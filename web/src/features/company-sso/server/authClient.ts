/**
 * Company OpenID SSO — auth-service client and identity normalization.
 *
 * The corporate protocol is not standard OIDC: the browser carries an
 * `authOpenIdToken` cookie and the backend exchanges it for an identity via
 * `/login/getLoginUser?key=<cookie>&systemCode=<code>` (same contract as
 * super-agent-service's CookieAuthMiddleware). This module wraps that call
 * and normalizes the response into the fields Langfuse needs: email + name
 * (+ jobNumber as the account id).
 *
 * Observed contract (captured 2026-09-01):
 *   { code: 200, ok: true, msg: null, rel: true,
 *     data: { id: null, userId: "H24655", popo: "<corp email>",
 *             name: "<real name>", status: 1, departmentId, telephone, type } }
 * `popo` is the corp email, `userId` the job number, `status` 1=active
 * (5=departed, per the omg_employee model in super-agent-service).
 */
import { env } from "@/src/env.mjs";
import { logger } from "@langfuse/shared/src/server";
import { pickAuthServiceBaseUrl } from "./nacosClient";

export interface CompanyIdentity {
  jobNumber: string;
  email: string;
  name: string;
  /** raw employment status when present; checked at login time. */
  status?: string | number;
  raw: Record<string, unknown>;
}

/** omg_employee-style status codes observed in super-agent-service (5 = departed). */
const DEPARTED_STATUSES = new Set<string | number>([5, "5", "departed"]);

export function isCompanySsoEnabled(): boolean {
  return env.COMPANY_SSO_STUB === "true" || env.COMPANY_SSO_LOGIN_URL !== undefined;
}

export function isDeparted(status: string | number | undefined): boolean {
  return status !== undefined && DEPARTED_STATUSES.has(status);
}

/**
 * Stub mode (COMPANY_SSO_STUB=true): cookie value is a base64 JSON identity
 * minted by /api/company-sso/stub-login, so the whole flow is testable
 * without corporate network access.
 */
function decodeStubCookie(cookieValue: string): CompanyIdentity {
  try {
    const parsed = JSON.parse(
      Buffer.from(cookieValue, "base64").toString("utf-8"),
    ) as Partial<CompanyIdentity>;
    const jobNumber = String(parsed.jobNumber ?? "H0001");
    return {
      jobNumber,
      email: String(parsed.email ?? `${jobNumber.toLowerCase()}@stub.corp`),
      name: String(parsed.name ?? `Stub ${jobNumber}`),
      status: parsed.status,
      raw: parsed as Record<string, unknown>,
    };
  } catch {
    throw new Error("company-sso stub: cookie is not a base64 JSON identity");
  }
}

function firstString(
  payload: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

/** Mapping of the getLoginUser response (contract captured 2026-09-01). */
export function normalizeIdentity(json: unknown): CompanyIdentity {
  if (json && typeof json === "object") {
    const w = json as { ok?: boolean; code?: number; msg?: string | null };
    if (w.ok === false || (w.code !== undefined && w.code !== 200)) {
      throw new Error(
        `company-sso: getLoginUser rejected (code=${w.code}, msg=${w.msg ?? ""})`,
      );
    }
  }
  const wrapped =
    json && typeof json === "object" && "data" in (json as object)
      ? ((json as { data?: unknown }).data ?? json)
      : json;
  const payload = (
    wrapped && typeof wrapped === "object" ? wrapped : {}
  ) as Record<string, unknown>;

  // popo = corp email; userId = job number; name = real name.
  const email = firstString(payload, ["popo", "email", "mail"]);
  const name = firstString(payload, ["name"]);
  const jobNumber = firstString(payload, ["userId", "jobNumber"]);
  const statusRaw = payload.status ?? payload.employeeStatus;
  const status =
    typeof statusRaw === "string" || typeof statusRaw === "number"
      ? statusRaw
      : undefined;

  if (!email || !jobNumber) {
    logger.error("company-sso: getLoginUser response missing email/jobNumber", {
      keys: Object.keys(payload),
    });
    throw new Error("company-sso: identity response missing email/jobNumber");
  }
  return {
    jobNumber,
    email: email.toLowerCase(),
    name: name ?? jobNumber,
    status,
    raw: payload,
  };
}

/**
 * Exchange the authOpenIdToken cookie value for a normalized identity.
 * Stub mode decodes locally; real mode calls auth-service at a Nacos-picked
 * instance (or the COMPANY_SSO_AUTH_BASE_URL override).
 */
export async function resolveIdentityFromCookie(
  cookieValue: string,
): Promise<CompanyIdentity> {
  if (env.COMPANY_SSO_STUB === "true") return decodeStubCookie(cookieValue);

  const base = await pickAuthServiceBaseUrl();
  if (!base) {
    throw new Error(
      "company-sso: no auth-service base url (set COMPANY_SSO_AUTH_BASE_URL or Nacos discovery vars)",
    );
  }
  const url = `${base}/login/getLoginUser?${new URLSearchParams({
    key: cookieValue,
    systemCode: env.COMPANY_SSO_SYSTEM_CODE ?? "",
  }).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`company-sso: getLoginUser HTTP ${res.status}`);
  }
  return normalizeIdentity(await res.json());
}

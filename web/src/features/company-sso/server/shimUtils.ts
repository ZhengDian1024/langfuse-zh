/**
 * Company OpenID SSO — shared helpers for the /api/company-sso/* shim routes.
 */
import { decode, encode } from "next-auth/jwt";
import { env } from "@/src/env.mjs";
import {
  CODE_MAX_AGE_S,
  CODE_SALT,
  COMPANY_SSO_PROVIDER_ID,
} from "./provider";
import type { CompanyIdentity } from "./authClient";

export function companySsoCallbackUrl(): string {
  return `${env.NEXTAUTH_URL}/api/auth/callback/${COMPANY_SSO_PROVIDER_ID}`;
}

export function isCallbackRedirectUri(uri: string): boolean {
  return uri === companySsoCallbackUrl();
}

/** Only bounce back to our own origins (open-redirect guard). */
export function isSameOriginUrl(url: string): boolean {
  return url.startsWith(env.NEXTAUTH_URL);
}

export function readAuthCookie(
  cookies: Partial<Record<string, string>>,
): string | undefined {
  return cookies[env.COMPANY_SSO_COOKIE_NAME ?? "authOpenIdToken"];
}

/** NEXTAUTH_SECRET is only optional in dev; the shim cannot work without it. */
function signingSecret(): string {
  if (!env.NEXTAUTH_SECRET) {
    throw new Error("company-sso: NEXTAUTH_SECRET is required");
  }
  return env.NEXTAUTH_SECRET;
}

/** Self-contained signed code: the identity itself, short-lived. */
export async function mintCode(identity: CompanyIdentity): Promise<string> {
  return encode({
    token: {
      jobNumber: identity.jobNumber,
      email: identity.email,
      name: identity.name,
      status: identity.status,
    },
    secret: signingSecret(),
    salt: CODE_SALT,
    maxAge: CODE_MAX_AGE_S,
  });
}

export interface CodePayload {
  jobNumber?: string;
  email?: string;
  name?: string;
  status?: string | number;
}

export async function decodeCode(code: string): Promise<CodePayload | null> {
  try {
    return (await decode({
      token: code,
      secret: signingSecret(),
      salt: CODE_SALT,
    })) as CodePayload | null;
  } catch {
    return null;
  }
}

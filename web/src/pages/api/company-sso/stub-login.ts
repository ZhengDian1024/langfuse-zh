/**
 * Company OpenID SSO shim — stub corporate login page (dev/test only).
 *
 * Emulates the corporate login: mints an authOpenIdToken cookie (base64 JSON
 * identity) on the local domain and bounces back to returnUrl. Enabled only
 * with COMPANY_SSO_STUB=true so the whole NextAuth flow is testable without
 * corporate network access.
 */
import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "@/src/env.mjs";
import { isSameOriginUrl } from "@/src/features/company-sso/server/shimUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (env.COMPANY_SSO_STUB !== "true") {
    res.status(404).json({ error: "stub disabled" });
    return;
  }
  const returnUrl =
    typeof req.query.returnUrl === "string" ? req.query.returnUrl : "";
  if (!returnUrl || !isSameOriginUrl(returnUrl)) {
    res.status(400).json({ error: "invalid returnUrl" });
    return;
  }

  const q = (k: string, d: string) =>
    typeof req.query[k] === "string" && req.query[k] !== ""
      ? (req.query[k] as string)
      : d;
  const jobNumber = q("jobNumber", "H0001");
  const identity = {
    jobNumber,
    name: q("name", `Stub ${jobNumber}`),
    email: q("email", `${jobNumber.toLowerCase()}@stub.corp`),
    status: q("status", "1"),
  };
  const cookieValue = Buffer.from(JSON.stringify(identity)).toString("base64");
  res.setHeader(
    "Set-Cookie",
    `${env.COMPANY_SSO_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax`,
  );
  res.redirect(302, returnUrl);
}

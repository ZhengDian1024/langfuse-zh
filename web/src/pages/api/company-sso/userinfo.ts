/**
 * Company OpenID SSO shim — userinfo endpoint.
 *
 * Returns the identity carried in the signed code as the OAuth profile.
 * `sub` is the employee job number — it becomes the Account's
 * providerAccountId, so the corporate identity stays traceable in Langfuse.
 */
import { type NextApiRequest, type NextApiResponse } from "next";
import { decodeCode } from "@/src/features/company-sso/server/shimUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const header = req.headers.authorization ?? "";
  // scheme is case-insensitive (RFC 7235); openid-client echoes our token_type verbatim
  const match = header.match(/^bearer\s+(.+)$/i);
  const code = match?.[1] ?? "";
  const payload = code ? await decodeCode(code) : null;
  if (!payload || !payload.email) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  res.status(200).json({
    sub: payload.jobNumber ?? payload.email,
    jobNumber: payload.jobNumber,
    email: payload.email,
    name: payload.name,
    status: payload.status,
  });
}

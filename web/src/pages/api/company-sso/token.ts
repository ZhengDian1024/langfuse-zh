/**
 * Company OpenID SSO shim — token endpoint.
 *
 * NextAuth exchanges the authorization code here. The code is a self
 * contained signed JWT (see shimUtils.mintCode), so no server-side code
 * store is needed.
 */
import { type NextApiRequest, type NextApiResponse } from "next";
import {
  CODE_MAX_AGE_S,
} from "@/src/features/company-sso/server/provider";
import { decodeCode } from "@/src/features/company-sso/server/shimUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const code =
    typeof req.body?.code === "string"
      ? req.body.code
      : typeof req.query.code === "string"
        ? req.query.code
        : "";
  if (!code) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }
  const payload = await decodeCode(code);
  if (!payload || !payload.email) {
    res.status(401).json({ error: "invalid_grant" });
    return;
  }
  res.status(200).json({
    access_token: code,
    token_type: "bearer",
    expires_in: CODE_MAX_AGE_S,
  });
}

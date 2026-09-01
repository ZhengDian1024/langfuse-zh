/**
 * Company OpenID SSO shim — authorization endpoint.
 *
 * NextAuth redirects the browser here; we redirect on to the corporate login
 * page (or the local stub) with returnUrl pointing at /api/company-sso/return,
 * carrying NextAuth's state + redirect_uri through the round trip.
 */
import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "@/src/env.mjs";
import { isCompanySsoEnabled } from "@/src/features/company-sso/server/authClient";
import {
  companySsoCallbackUrl,
  isCallbackRedirectUri,
} from "@/src/features/company-sso/server/shimUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isCompanySsoEnabled()) {
    res.status(404).json({ error: "company sso disabled" });
    return;
  }
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const redirectUri =
    typeof req.query.redirect_uri === "string"
      ? req.query.redirect_uri
      : companySsoCallbackUrl();
  if (!isCallbackRedirectUri(redirectUri)) {
    res.status(400).json({ error: "invalid redirect_uri" });
    return;
  }

  const returnTo = `${env.NEXTAUTH_URL}/api/company-sso/return?${new URLSearchParams(
    { state, redirect_uri: redirectUri },
  ).toString()}`;

  let loginUrl: string;
  if (env.COMPANY_SSO_STUB === "true") {
    loginUrl = `${env.NEXTAUTH_URL}/api/company-sso/stub-login?${new URLSearchParams(
      { returnUrl: returnTo },
    ).toString()}`;
  } else {
    const base = env.COMPANY_SSO_LOGIN_URL as string;
    loginUrl = `${base}${base.includes("?") ? "&" : "?"}returnUrl=${encodeURIComponent(
      returnTo,
    )}`;
  }
  res.redirect(302, loginUrl);
}

/**
 * Company OpenID SSO shim — return endpoint.
 *
 * The browser lands here after the corporate login (real or stub) with the
 * authOpenIdToken cookie set on our domain. We exchange the cookie for an
 * identity (getLoginUser), enforce the employment-status gate, mint a short
 * signed code and hand control back to NextAuth's callback with code+state.
 */
import { type NextApiRequest, type NextApiResponse } from "next";
import { logger, traceException } from "@langfuse/shared/src/server";
import {
  isDeparted,
  resolveIdentityFromCookie,
} from "@/src/features/company-sso/server/authClient";
import {
  isCallbackRedirectUri,
  mintCode,
  readAuthCookie,
} from "@/src/features/company-sso/server/shimUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const redirectUri =
    typeof req.query.redirect_uri === "string" ? req.query.redirect_uri : "";
  if (!redirectUri || !isCallbackRedirectUri(redirectUri)) {
    res.status(400).json({ error: "invalid redirect_uri" });
    return;
  }

  const cookie = readAuthCookie(req.cookies ?? {});
  if (!cookie) {
    res.redirect(302, "/auth/sign-in?error=CompanySSOMissingCookie");
    return;
  }

  try {
    const identity = await resolveIdentityFromCookie(cookie);
    if (isDeparted(identity.status)) {
      logger.warn("company-sso: departed employee rejected at login", {
        jobNumber: identity.jobNumber,
      });
      res.redirect(302, "/auth/sign-in?error=CompanySSODeparted");
      return;
    }
    const code = await mintCode(identity);
    const sep = redirectUri.includes("?") ? "&" : "?";
    res.redirect(
      302,
      `${redirectUri}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    );
  } catch (e) {
    traceException(e);
    logger.error("company-sso: identity exchange failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    res.redirect(302, "/auth/sign-in?error=CompanySSOExchangeFailed");
  }
}

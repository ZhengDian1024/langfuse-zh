/**
 * Company OpenID SSO — NextAuth provider (self-hosted OAuth shim).
 *
 * The corporate protocol (redirect login → authOpenIdToken cookie →
 * getLoginUser exchange) is not OIDC, so instead of pointing NextAuth at a
 * discovery document we host the OAuth endpoints ourselves under
 * /api/company-sso/* and let NextAuth run its standard authorization-code
 * flow against them. This keeps every NextAuth surface intact (signIn
 * callback checks, Prisma adapter user creation, JWT sessions) while the
 * corporate handshake lives in our own routes.
 */
import type { OAuthConfig } from "next-auth/providers/oauth";
import type { User } from "next-auth";
import { env } from "@/src/env.mjs";

export const COMPANY_SSO_PROVIDER_ID = "company-sso";

/** Salt separating shim code JWTs from next-auth session tokens. */
export const CODE_SALT = "company-sso-code";
export const CODE_MAX_AGE_S = 300;

interface CompanySSOProfile extends Record<string, unknown> {
  sub?: string;
  jobNumber?: string;
  email: string;
  name: string;
}

export function CompanySSOProvider(): OAuthConfig<CompanySSOProfile> {
  const base = env.NEXTAUTH_URL;
  return {
    id: COMPANY_SSO_PROVIDER_ID,
    name: env.COMPANY_SSO_NAME ?? "网易CORP邮箱登录",
    type: "oauth",
    authorization: { url: `${base}/api/company-sso/authorize` },
    token: `${base}/api/company-sso/token`,
    userinfo: `${base}/api/company-sso/userinfo`,
    checks: ["state"],
    // Both ends of this "OAuth" flow are our own routes; the client
    // credentials are placeholders required by next-auth, not real secrets.
    clientId: "langfuse-company-sso",
    clientSecret: "langfuse-company-sso-internal",
    profile(profile) {
      // Only DB-shaped fields: the Prisma adapter spreads profile() output
      // into user.create, and the session callback rebuilds the extended
      // User (featureFlags, organizations, …) from the DB by email. Web's
      // augmented next-auth User type demands those fields here, hence the
      // localized cast.
      return {
        id: profile.sub ?? profile.jobNumber ?? profile.email,
        name: profile.name,
        email: profile.email,
        image: null,
      } as User;
    },
  };
}

import { signIn } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ErrorPageWithSentry } from "@/src/components/error-page";
import { Spinner } from "@/src/components/layouts/spinner";
import { useI18n } from "@/src/features/i18n/useI18n";

// Sentinel values stored in error state; translated to user-facing text at
// render time so the effect below does not depend on `t`.
const ERR_NO_PROVIDER = "__sso_no_provider__";
const ERR_FAILED = "__sso_failed__";

export default function SSOInitiate() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) {
      return;
    }

    const provider = router.query.provider as string | undefined;

    // If provider is missing or empty, show error
    if (!provider || provider === "") {
      setError(ERR_NO_PROVIDER);
      return;
    }

    // Automatically trigger sign-in with the provider
    signIn(provider)
      .then(() => {
        // signIn will redirect automatically on success
        // No need to do anything here
      })
      .catch((error) => {
        console.error("SSO initiation error:", error);
        setError(
          error instanceof Error ? error.message : ERR_FAILED,
        );
      });
  }, [router.isReady, router.query.provider]);

  // Translate sentinel errors to user-facing text at render time.
  const errorMessage = !error
    ? null
    : error === ERR_NO_PROVIDER
      ? t(
          "auth.sso-initiate.no-provider",
          "No SSO provider specified. Please contact your administrator.",
        )
      : error === ERR_FAILED
        ? t(
            "auth.sso-initiate.failed",
            "Failed to initiate SSO sign-in. Please try again or contact support.",
          )
        : error;

  // Show error page if sign-in failed
  if (errorMessage) {
    return (
      <>
        <Head>
          <title>
            {t(
              "auth.sso-initiate.error-document-title",
              "Sign-in Error | Langfuse",
            )}
          </title>
        </Head>
        <ErrorPageWithSentry
          title={t("auth.sso-initiate.error-title", "SSO Sign-in Failed")}
          message={errorMessage}
        />
      </>
    );
  }

  // Show loading spinner while processing
  return (
    <>
      <Head>
        <title>
          {t(
            "auth.sso-initiate.signing-in-document-title",
            "Signing in | Langfuse",
          )}
        </title>
      </Head>
      <Spinner
        message={t(
          "auth.sso-initiate.redirecting",
          "Redirecting to your identity provider...",
        )}
      />
    </>
  );
}

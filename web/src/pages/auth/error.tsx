import { ErrorPageWithSentry } from "@/src/components/error-page";
import { useRouter } from "next/router";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function AuthError() {
  const router = useRouter();
  const { t } = useI18n();
  const { error } = router.query;
  const errorMessage = error
    ? decodeURIComponent(String(error))
    : t(
        "auth.error.default-message",
        "An authentication error occurred. Please reach out to support.",
      );

  return (
    <ErrorPageWithSentry
      title={t("auth.error.page-title", "Authentication Error")}
      message={errorMessage}
    />
  );
}

import { env } from "@/src/env.mjs";
import { useI18n } from "@/src/features/i18n/useI18n";

export const CloudPrivacyNotice = ({ action }: { action: string }) => {
  const { t } = useI18n();
  return env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION !== undefined ? (
    <div className="text-muted-foreground mx-auto mt-10 max-w-lg text-center text-xs">
      {t(
        "auth.privacy.before",
        "By {action} you are agreeing to our ",
        { action },
      )}
      <a
        href="https://langfuse.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {t("auth.privacy.terms", "Terms and Conditions")}
      </a>
      {t("auth.privacy.mid1", ", ")}
      <a
        href="https://langfuse.com/privacy"
        rel="noopener noreferrer"
        className="italic"
      >
        {t("auth.privacy.privacy-policy", "Privacy Policy")}
      </a>
      {t("auth.privacy.mid2", ", and ")}
      <a
        href="https://langfuse.com/cookie-policy"
        rel="noopener noreferrer"
        className="italic"
      >
        {t("auth.privacy.cookie-policy", "Cookie Policy")}
      </a>
      {t(
        "auth.privacy.after",
        ". You also confirm that the entered data is accurate.",
      )}
    </div>
  ) : null;
};

// This page is part of the cloud signup flow and can also be opened directly for local testing.

import Head from "next/head";
import { OnboardingSurvey } from "@/src/features/onboarding/components/OnboardingSurvey";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function OnboardingPage() {
  const { t } = useI18n();
  return (
    <>
      <Head>
        <title>{t("onboarding.document-title", "Onboarding | Langfuse")}</title>
      </Head>
      <OnboardingSurvey />
    </>
  );
}

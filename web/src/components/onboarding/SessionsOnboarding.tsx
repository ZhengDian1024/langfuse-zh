import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { useI18n } from "@/src/features/i18n/useI18n";

export function SessionsOnboarding() {
  const { t } = useI18n();
  return (
    <SplashScreen
      title={t("onboarding.sessions.title", "You aren't using sessions yet")}
      description={t("onboarding.sessions.description", "Sessions let you group traces that belong to the same workflow, or conversation.")}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/sessions-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-semibold">
          {t("onboarding.sessions.start", "Start using sessions")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("onboarding.sessions.instructions-before", "To start using sessions, you need to add a ")}
          <code>sessionId</code>
          {t("onboarding.sessions.instructions-after", " to your traces.")}
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/sessions"
          variant="default"
        >
          {t("common.read-docs", "Read the docs")}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}

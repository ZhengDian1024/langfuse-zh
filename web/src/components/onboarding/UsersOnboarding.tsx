import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { useI18n } from "@/src/features/i18n/useI18n";

export function UsersOnboarding() {
  const { t } = useI18n();
  return (
    <SplashScreen
      title={t("onboarding.users.title", "You aren't tracking users yet")}
      description={t("onboarding.users.description", "Once you add a user ID to your traces, you can correlate costs, evaluations and other LLM Application metrics to better understand how they interact with your LLM applications.")}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/users-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-semibold">
          {t("onboarding.users.start", "Start tracking users")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("onboarding.users.instructions-before", "To start tracking users, you need to add a ")}
          <code>userId</code>
          {t("onboarding.users.instructions-after", " to your traces.")}
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/users"
          variant="default"
        >
          {t("common.read-docs", "Read the docs")}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}

import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ClipboardCheck, Users, BarChart4, GitMerge } from "lucide-react";
import { CreateOrEditAnnotationQueueButton } from "@/src/features/annotation-queues/components/CreateOrEditAnnotationQueueButton";
import { useI18n } from "@/src/features/i18n/useI18n";

export function AnnotationQueuesOnboarding({
  projectId,
}: {
  projectId: string;
}) {
  const { t } = useI18n();
  const valuePropositions: ValueProposition[] = [
    {
      title: t("onboarding.annotation.value.workflows.title", "Manage scoring workflows"),
      description: t("onboarding.annotation.value.workflows.description", "Create and manage annotation queues to streamline your scoring workflows"),
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: t("onboarding.annotation.value.collaborate.title", "Collaborate with annotators"),
      description: t("onboarding.annotation.value.collaborate.description", "Invite team members to annotate and evaluate your LLM outputs"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: t("onboarding.annotation.value.metrics.title", "Track annotation metrics"),
      description: t("onboarding.annotation.value.metrics.description", "Monitor annotation progress and quality metrics across your team"),
      icon: <BarChart4 className="h-4 w-4" />,
    },
    {
      title: t("onboarding.annotation.value.baseline.title", "Baseline evaluation efforts"),
      description: t("onboarding.annotation.value.baseline.description", "Use annotation data as a baseline to evaluate your other evaluation metrics"),
      icon: <GitMerge className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={t("onboarding.annotation.title", "Get Started with Annotation Queues")}
      description={t("onboarding.annotation.description", "Annotation queues help you manage manual annotation/labeling for your LLM projects. Create queues, define annotation metrics, and track progress.")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: t("onboarding.annotation.create", "Create Annotation Queue"),
        component: (
          <CreateOrEditAnnotationQueueButton
            variant="default"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: t("common.learn-more", "Learn More"),
        href: "https://langfuse.com/docs/scores/annotation",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/annotation-queue-overview-v1.mp4"
    />
  );
}

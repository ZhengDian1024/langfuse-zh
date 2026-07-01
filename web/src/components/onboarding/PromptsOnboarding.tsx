import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { FileText, GitBranch, Zap, BarChart4 } from "lucide-react";
import { useI18n } from "@/src/features/i18n/useI18n";

export function PromptsOnboarding({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const valuePropositions: ValueProposition[] = [
    {
      title: t("onboarding.prompts.value.decoupled.title", "Decoupled from code"),
      description: t("onboarding.prompts.value.decoupled.description", "Deploy new prompts without application redeployment, making updates faster and easier"),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: t("onboarding.prompts.value.edit.title", "Edit in UI or programmatically"),
      description: t("onboarding.prompts.value.edit.description", "Non-technical users can easily edit prompts in the UI. Developers can optionally update prompts programmatically via the API and SDKs"),
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      title: t("onboarding.prompts.value.performance.title", "Performance optimized"),
      description: t("onboarding.prompts.value.performance.description", "Client-side caching prevents latency or availability issues for your applications"),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: t("onboarding.prompts.value.metrics.title", "Compare metrics"),
      description: t("onboarding.prompts.value.metrics.description", "Track latency, cost, and evaluation metrics across different prompt versions"),
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={t("onboarding.prompts.title", "Get Started with Prompt Management")}
      description={t("onboarding.prompts.description", "Langfuse Prompt Management helps you centrally manage, version control, and collaboratively iterate on your prompts. Start using prompt management to improve your LLM application's performance and maintainability.")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: t("onboarding.prompts.create", "Create Prompt"),
        href: `/project/${projectId}/prompts/new`,
      }}
      secondaryAction={{
        label: t("common.learn-more", "Learn More"),
        href: "https://langfuse.com/docs/prompt-management/get-started",
      }}
    />
  );
}

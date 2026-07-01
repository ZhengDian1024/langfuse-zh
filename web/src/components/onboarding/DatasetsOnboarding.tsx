import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Database, Beaker, Zap, Code } from "lucide-react";
import { DatasetActionButton } from "@/src/features/datasets/components/DatasetActionButton";
import { useI18n } from "@/src/features/i18n/useI18n";

export function DatasetsOnboarding({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const valuePropositions: ValueProposition[] = [
    {
      title: t("onboarding.datasets.value.improvement.title", "Continuous improvement"),
      description: t("onboarding.datasets.value.improvement.description", "Create datasets from production edge cases to improve your application"),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: t("onboarding.datasets.value.predeploy.title", "Pre-deployment testing"),
      description: t("onboarding.datasets.value.predeploy.description", "Benchmark new releases before deploying to production"),
      icon: <Beaker className="h-4 w-4" />,
    },
    {
      title: t("onboarding.datasets.value.structured.title", "Structured testing"),
      description: t("onboarding.datasets.value.structured.description", "Run experiments on collections of inputs and expected outputs"),
      icon: <Database className="h-4 w-4" />,
    },
    {
      title: t("onboarding.datasets.value.workflows.title", "Custom workflows"),
      description: t("onboarding.datasets.value.workflows.description", "Build custom workflows around your datasets via the API and SDKs, e.g. for fine-tuning, few-shotting"),
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={t("onboarding.datasets.title", "Get Started with Datasets & Experiments")}
      description={t("onboarding.datasets.description", "Datasets in Langfuse are collections of inputs (and expected outputs) for your LLM application. You can run Experiments against these datasets to test new releases before deployment to production.")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: t("onboarding.datasets.create", "Create Dataset"),
        component: (
          <DatasetActionButton
            variant="default"
            mode="create"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: t("common.learn-more", "Learn More"),
        href: "https://langfuse.com/docs/datasets",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/datasets-overview-v1.mp4"
    />
  );
}

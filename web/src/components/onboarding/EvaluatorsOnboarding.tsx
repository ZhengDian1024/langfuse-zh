import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Bot, Gauge, Zap, BarChart4 } from "lucide-react";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";
import { EvalTemplateSourceCodeLanguage } from "@langfuse/shared";
import { useI18n } from "@/src/features/i18n/useI18n";

interface EvaluatorsOnboardingProps {
  projectId: string;
}

export function EvaluatorsOnboarding({ projectId }: EvaluatorsOnboardingProps) {
  const { t } = useI18n();
  const { enabled, supportedSourceCodeLanguages } = useIsCodeEvalEnabled();
  const codeEvaluatorLanguageDescription =
    supportedSourceCodeLanguages.includes(EvalTemplateSourceCodeLanguage.PYTHON)
      ? t("onboarding.evaluators.language.typescript-or-python", "TypeScript or Python")
      : t("onboarding.evaluators.language.typescript", "TypeScript");

  const llmAsJudgeValuePropositions: ValueProposition[] = [
    {
      title: t("onboarding.evaluators.value.automate.title", "Automate evaluations"),
      description: t("onboarding.evaluators.value.automate.description", "Use LLM-as-a-judge to automatically evaluate your traces without manual review"),
      icon: <Bot className="h-4 w-4" />,
    },
    {
      title: t("onboarding.evaluators.value.quality.title", "Measure quality"),
      description: t("onboarding.evaluators.value.quality.description", "Create custom evaluation criteria to measure the quality of your LLM outputs"),
      icon: <Gauge className="h-4 w-4" />,
    },
    {
      title: t("onboarding.evaluators.value.scale.title", "Scale efficiently"),
      description: t("onboarding.evaluators.value.scale.description", "Evaluate thousands of traces automatically with customizable sampling rates"),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: t("onboarding.evaluators.value.performance.title", "Track performance"),
      description: t("onboarding.evaluators.value.performance.description", "Monitor evaluation metrics over time to identify trends and improvements"),
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  if (enabled) {
    return (
      <SplashScreen
        title={t("onboarding.evaluators.title", "Get started with evaluations")}
        description={
          <>
            {t("onboarding.evaluators.description-before", "Use evaluators to score traces and observations automatically. Langfuse supports two evaluator types:")}
            <ul className="text-muted-foreground mx-auto mt-2 max-w-2xl list-disc space-y-2 pl-5 text-left text-sm">
              <li>
                <span className="text-foreground font-medium">
                  {t("onboarding.evaluators.llm-title", "LLM-as-a-judge evaluators")}
                </span>{" "}
                {t("onboarding.evaluators.llm-description", "use an LLM to score outputs against natural-language criteria.")}
              </li>
              <li>
                <span className="text-foreground font-medium">
                  {t("onboarding.evaluators.code-title", "Code evaluators")}
                </span>{" "}
                {t("onboarding.evaluators.code-description", "use {language} logic for deterministic, custom scoring.", {
                  language: codeEvaluatorLanguageDescription,
                })}
              </li>
            </ul>
          </>
        }
        primaryAction={{
          label: t("onboarding.evaluators.create", "Create Evaluator"),
          href: `/project/${projectId}/evals/new`,
        }}
        secondaryAction={{
          label: t("common.learn-more", "Learn More"),
          href: "https://langfuse.com/docs/evaluation",
        }}
      />
    );
  }

  return (
    <SplashScreen
      title={t("onboarding.evaluators.llm-judge-title", "Get Started with LLM-as-a-Judge Evaluations")}
      description={t("onboarding.evaluators.llm-judge-description", "Create evaluation templates and evaluators to automatically score your traces with LLM-as-a-judge. Set up custom evaluation criteria and let AI help you measure the quality of your outputs.")}
      valuePropositions={llmAsJudgeValuePropositions}
      primaryAction={{
        label: t("onboarding.evaluators.create", "Create Evaluator"),
        href: `/project/${projectId}/evals/new`,
      }}
      secondaryAction={{
        label: t("common.learn-more", "Learn More"),
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-llm-as-a-judge-overview-v1.mp4"
    />
  );
}

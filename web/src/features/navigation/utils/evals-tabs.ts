import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const EVALS_TABS = {
  CONFIGS: "configs",
  TEMPLATES: "templates",
} as const;

export type EvalsTab = (typeof EVALS_TABS)[keyof typeof EVALS_TABS];

export const getEvalsTabs = (projectId: string, t: TranslateFn) => [
  {
    value: EVALS_TABS.CONFIGS,
    label: t("nav.running-evaluators", "Running Evaluators"),
    href: `/project/${projectId}/evals`,
  },
  {
    value: EVALS_TABS.TEMPLATES,
    label: t("nav.evaluator-library", "Evaluator Library"),
    href: `/project/${projectId}/evals/templates`,
  },
];

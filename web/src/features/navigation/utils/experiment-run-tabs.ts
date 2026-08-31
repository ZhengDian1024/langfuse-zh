import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const EXPERIMENT_RUN_TABS = {
  RESULTS: "results",
  ANALYTICS: "analytics",
} as const;

export type ExperimentRunTab =
  (typeof EXPERIMENT_RUN_TABS)[keyof typeof EXPERIMENT_RUN_TABS];

export const getExperimentRunTabs = (
  projectId: string,
  onResultsClick: (() => void) | undefined,
  t: TranslateFn,
) => [
  {
    value: EXPERIMENT_RUN_TABS.RESULTS,
    label: t("nav.results", "Results"),
    href: onResultsClick
      ? undefined
      : `/project/${projectId}/experiments/results`,
    onClick: onResultsClick,
  },
  {
    value: EXPERIMENT_RUN_TABS.ANALYTICS,
    label: t("nav.analytics", "Analytics"),
    href: `/project/${projectId}/experiments/analytics`,
  },
];

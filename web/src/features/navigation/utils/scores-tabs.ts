import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const SCORES_TABS = {
  SCORES: "scores",
  ANALYTICS: "analytics",
} as const;

export type ScoresTab = (typeof SCORES_TABS)[keyof typeof SCORES_TABS];

export const getScoresTabs = (projectId: string, t: TranslateFn) => [
  {
    value: SCORES_TABS.SCORES,
    label: t("nav.scores", "Scores"),
    href: `/project/${projectId}/scores`,
  },
  {
    value: SCORES_TABS.ANALYTICS,
    label: t("nav.analytics", "Analytics"),
    href: `/project/${projectId}/scores/analytics`,
  },
];

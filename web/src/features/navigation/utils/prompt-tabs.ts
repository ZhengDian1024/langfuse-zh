import type { MessageKey } from "@/src/features/i18n/messages";

export const PROMPT_TABS = {
  VERSIONS: "versions",
  METRICS: "metrics",
} as const;

export type PromptTab = (typeof PROMPT_TABS)[keyof typeof PROMPT_TABS];

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const getPromptTabs = (
  projectId: string,
  promptName: string,
  t: TranslateFn,
) => [
  {
    value: PROMPT_TABS.VERSIONS,
    label: t("prompts.tab.versions", "Versions"),
    href: `/project/${projectId}/prompts/${encodeURIComponent(promptName)}`,
  },
  {
    value: PROMPT_TABS.METRICS,
    label: t("prompts.tab.metrics", "Metrics"),
    href: `/project/${projectId}/prompts/${encodeURIComponent(promptName)}/metrics`,
  },
];

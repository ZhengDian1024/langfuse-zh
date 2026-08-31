import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const TRACING_TABS = {
  TRACES: "traces",
  OBSERVATIONS: "observations",
} as const;

export type TracingTab = (typeof TRACING_TABS)[keyof typeof TRACING_TABS];

export const getTracingTabs = (projectId: string, t: TranslateFn) => [
  {
    value: TRACING_TABS.TRACES,
    label: t("nav.traces", "Traces"),
    href: `/project/${projectId}/traces`,
  },
  {
    value: TRACING_TABS.OBSERVATIONS,
    label: t("nav.observations", "Observations"),
    href: `/project/${projectId}/observations`,
  },
];

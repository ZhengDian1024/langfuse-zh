import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

import { type ParsedUrlQuery } from "querystring";

export const DATASET_RUN_COMPARE_TABS = {
  COMPARE: "compare",
  CHARTS: "charts",
} as const;

export type DatasetRunCompareTab =
  (typeof DATASET_RUN_COMPARE_TABS)[keyof typeof DATASET_RUN_COMPARE_TABS];

export const getDatasetRunCompareTabs = (
  projectId: string,
  datasetId: string,
  t: TranslateFn,
) => [
  {
    value: DATASET_RUN_COMPARE_TABS.COMPARE,
    label: t("nav.outputs", "Outputs"),
    href: `/project/${projectId}/datasets/${datasetId}/compare`,
    querySelector: (query: ParsedUrlQuery) => ({ runs: query.runs }),
  },
  {
    value: DATASET_RUN_COMPARE_TABS.CHARTS,
    label: t("nav.charts", "Charts"),
    href: `/project/${projectId}/datasets/${datasetId}/compare/charts`,
    querySelector: (query: ParsedUrlQuery) => ({ runs: query.runs }),
  },
];

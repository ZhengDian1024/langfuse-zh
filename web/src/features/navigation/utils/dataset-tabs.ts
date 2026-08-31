import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const DATASET_TABS = {
  ITEMS: "items",
  EXPERIMENTS: "experiments",
} as const;

export type DatasetTab = (typeof DATASET_TABS)[keyof typeof DATASET_TABS];

export const getDatasetTabs = (
  projectId: string,
  datasetId: string,
  t: TranslateFn,
) => {
  return [
    {
      value: DATASET_TABS.ITEMS,
      label: t("nav.items", "Items"),
      href: `/project/${projectId}/datasets/${datasetId}/items`,
    },
    {
      value: DATASET_TABS.EXPERIMENTS,
      label: t("nav.experiments", "Experiments"),
      href: `/project/${projectId}/datasets/${datasetId}/experiments`,
    },
  ];
};

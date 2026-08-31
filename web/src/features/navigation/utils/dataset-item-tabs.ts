import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const DATASET_ITEM_TABS = {
  ITEM: "item",
  RUNS: "runs",
} as const;

export type DatasetItemTab =
  (typeof DATASET_ITEM_TABS)[keyof typeof DATASET_ITEM_TABS];

export const getDatasetItemTabs = ({
  projectId,
  datasetId,
  itemId,
  t,
}: {
  projectId: string;
  datasetId: string;
  itemId: string;
  t: TranslateFn;
}) => [
  {
    value: DATASET_ITEM_TABS.ITEM,
    label: t("nav.item", "Item"),
    href: `/project/${projectId}/datasets/${datasetId}/items/${itemId}`,
  },
  {
    value: DATASET_ITEM_TABS.RUNS,
    label: t("nav.experiments", "Experiments"),
    href: `/project/${projectId}/datasets/${datasetId}/items/${itemId}/runs`,
  },
];

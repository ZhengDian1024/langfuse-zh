import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";
import { useI18n } from "@/src/features/i18n/useI18n";

type DatasetItemViewModeContentProps = {
  item: DatasetItemDomain | null;
  isLoading: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders the latest version of a dataset item in view mode.
 * Handles loading and not-found states.
 */
export const DatasetItemViewModeContent = ({
  item,
  isLoading,
  dataset,
}: DatasetItemViewModeContentProps) => {
  const { t } = useI18n();
  if (isLoading) {
    return <div className="text-muted-foreground text-sm">{t("datasets.loading", "Loading...")}</div>;
  }

  if (item === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">{t("datasets.item.not-found-title", "Dataset item not found")}</p>
          <p className="mt-2 text-sm">
            {t("datasets.item.not-found-body", "This dataset item does not exist or has been deleted.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(item.input),
        expectedOutput: stringifyDatasetItemData(item.expectedOutput),
        metadata: stringifyDatasetItemData(item.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={item.projectId}
      datasetItemId={item.id}
    />
  );
};

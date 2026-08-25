import { DatasetForm } from "@/src/features/datasets/components/DatasetForm";
import type { DatasetCreateStepProps } from "./types";
import { useI18n } from "@/src/features/i18n/useI18n";

export function DatasetCreateStep(props: DatasetCreateStepProps) {
  const { projectId, formRef, onDatasetCreated, onValidationChange } = props;
  const { t } = useI18n();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium">
          {t(
            "batch-actions.add-to-dataset.create.title",
            "Create New Dataset",
          )}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t(
            "batch-actions.add-to-dataset.create.description",
            "Fill in the details to create a new dataset",
          )}
        </p>
      </div>

      <DatasetForm
        ref={formRef}
        projectId={projectId}
        mode="create"
        redirectOnSuccess={false}
        showFooter={false}
        onCreateDatasetSuccess={onDatasetCreated}
        onValidationChange={onValidationChange}
      />
    </div>
  );
}

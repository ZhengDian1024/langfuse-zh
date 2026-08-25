import { Database, Plus } from "lucide-react";
import type { DatasetChoiceStepProps } from "./types";
import { useI18n } from "@/src/features/i18n/useI18n";

export function DatasetChoiceStep(props: DatasetChoiceStepProps) {
  const { onSelectMode } = props;
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Existing Dataset Card */}
      <button
        type="button"
        onClick={() => onSelectMode("select")}
        className="hover:border-tertiary hover:bg-accent flex flex-col items-center rounded-lg border-2 p-8 text-center transition-all"
      >
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Database className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {t(
            "batch-actions.add-to-dataset.choice.existing",
            "Existing Dataset",
          )}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t(
            "batch-actions.add-to-dataset.choice.existing-desc",
            "Add to a dataset that already exists",
          )}
        </p>
      </button>

      {/* New Dataset Card */}
      <button
        type="button"
        onClick={() => onSelectMode("create")}
        className="hover:border-tertiary hover:bg-accent flex flex-col items-center rounded-lg border-2 p-8 text-center transition-all"
      >
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Plus className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {t("batch-actions.add-to-dataset.choice.new", "New Dataset")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t(
            "batch-actions.add-to-dataset.choice.new-desc",
            "Create a new dataset for these observations",
          )}
        </p>
      </button>
    </div>
  );
}

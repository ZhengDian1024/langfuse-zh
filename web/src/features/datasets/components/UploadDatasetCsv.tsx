import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { z } from "zod";
import { parseCsvClient } from "@/src/features/datasets/lib/csv/helpers";
import { DialogBody } from "@/src/components/ui/dialog";
import {
  Dropzone,
  DropzoneEmptyState,
} from "@/src/components/ui/shadcn-io/dropzone";
import type { CsvPreviewResult } from "@/src/features/datasets/lib/csv/types";
import { useI18n } from "@/src/features/i18n/useI18n";

export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ["text/csv"] as const;

const FileSchema = z.object({
  type: z.enum([...ACCEPTED_FILE_TYPES]),
  size: z.number().min(1),
});

export const UploadDatasetCsv = ({
  setPreview,
  setCsvFile,
}: {
  setPreview: (preview: CsvPreviewResult | null) => void;
  setCsvFile: (file: File | null) => void;
}) => {
  const { t } = useI18n();
  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const result = FileSchema.safeParse(file);
    if (!result.success) {
      showErrorToast(
        t("datasets.csv.invalid-file-type-title", "Invalid file type"),
        t("datasets.csv.invalid-file-type-desc", "Please select a valid CSV file"),
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorToast(
        t("datasets.csv.file-too-large-title", "File too large"),
        t("datasets.csv.file-too-large-desc", "Maximum file size is 10MB"),
      );
      return;
    }

    try {
      setCsvFile(file);
      const preview = await parseCsvClient(file, {
        isPreview: true,
        collectSamples: true,
      });

      if (!Boolean(preview.columns.length)) {
        showErrorToast(
          t("datasets.csv.invalid-csv-title", "Invalid CSV"),
          t("datasets.csv.invalid-csv-desc", "CSV must have at least 1 column"),
        );
        return;
      }

      setPreview(preview);
    } catch (error) {
      showErrorToast(
        t("datasets.csv.parse-failed-title", "Failed to parse CSV"),
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  return (
    <DialogBody className="border-t">
      <Card className="h-full items-center justify-center border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {t("datasets.csv.add-items-title", "Add items to dataset")}
          </CardTitle>
          <CardDescription>
            {t(
              "datasets.csv.add-items-desc",
              "Add items to dataset by uploading a file, add items manually or via our SDKs/API",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone
            onDrop={handleFiles}
            accept={{ "text/csv": [".csv"] }}
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            className="bg-secondary/50 border-dashed"
          >
            <DropzoneEmptyState />
          </Dropzone>
        </CardContent>
      </Card>
    </DialogBody>
  );
};

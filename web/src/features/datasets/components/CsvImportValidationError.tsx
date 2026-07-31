import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { type BulkDatasetItemValidationError } from "@langfuse/shared";
import { useI18n } from "@/src/features/i18n/useI18n";

type CsvImportValidationErrorProps = {
  errors: BulkDatasetItemValidationError[];
};

export const CsvImportValidationError: React.FC<
  CsvImportValidationErrorProps
> = ({ errors }) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.length;
  const hasMoreThan10 = errorCount >= 10; // Backend might limit errors

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle className="text-base font-semibold">
        {t("datasets.csv.validation-failed-title", "Schema Validation Failed")}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {hasMoreThan10
            ? t(
                "datasets.csv.validation-failed-many",
                "{count}+ items failed validation. Showing first {count} errors.",
                { count: String(errorCount) },
              )
            : t(
                "datasets.csv.validation-failed-single",
                "{count} item failed validation.",
                { count: String(errorCount) },
              )}
        </p>
        <p className="text-muted-foreground text-sm">
          {t(
            "datasets.csv.validation-failed-desc",
            "The CSV data does not match the required schema for this dataset. Fix the errors in your CSV file and try importing again.",
          )}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-sm font-medium hover:bg-transparent"
        >
          {isExpanded ? (
            <ChevronDown className="mr-1 h-4 w-4" />
          ) : (
            <ChevronRight className="mr-1 h-4 w-4" />
          )}
          {isExpanded
            ? t("datasets.csv.hide", "Hide")
            : t("datasets.csv.show", "Show")}
          {t("datasets.csv.error-details", " error details")}
        </Button>

        {isExpanded && (
          <div className="border-destructive/20 bg-destructive/5 mt-3 max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-3">
            {errors.map((error, idx) => (
              <div
                key={`${error.itemIndex}-${error.field}`}
                className="border-destructive/10 space-y-1 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-medium">
                    {t("datasets.csv.row-prefix", "CSV Row {n}:", {
                      n: String(error.itemIndex + 2),
                    })}{" "}
                    {error.field === "input"
                      ? t("datasets.compare-runs.col-input", "Input")
                      : error.field === "metadata"
                        ? t("datasets.compare-runs.col-metadata", "Metadata")
                        : t(
                            "datasets.compare-runs.col-expected-output",
                            "Expected Output",
                          )}
                  </span>
                </div>

                <ul className="ml-6 space-y-1 text-sm">
                  {error.errors.map((err, errIdx) => (
                    <li key={errIdx} className="text-destructive">
                      {err.path !== "/" && (
                        <span className="text-muted-foreground font-mono text-xs">
                          {err.path}:{" "}
                        </span>
                      )}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasMoreThan10 && (
              <p className="text-muted-foreground pt-2 text-xs">
                {t(
                  "datasets.csv.fix-errors",
                  "Fix these errors to see if there are additional validation issues.",
                )}
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

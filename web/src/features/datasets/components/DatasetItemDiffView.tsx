import type { DatasetItemDomain } from "@langfuse/shared";
import DiffViewer from "@/src/components/DiffViewer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { stringifyDatasetItemData } from "../utils/datasetItemUtils";
import { useI18n } from "@/src/features/i18n/useI18n";

type DatasetItemDiffViewProps = {
  selectedVersion: DatasetItemDomain;
  latestVersion: DatasetItemDomain;
};

export const DatasetItemDiffView = ({
  selectedVersion,
  latestVersion,
}: DatasetItemDiffViewProps) => {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={["input", "output"]}
        className="w-full"
      >
        <AccordionItem value="input">
          <AccordionTrigger>{t("datasets.compare-runs.col-input", "Input")}</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(selectedVersion.input)}
              newString={stringifyDatasetItemData(latestVersion.input)}
              oldLabel={t("datasets.diff.selected-version", "Selected Version")}
              newLabel={t("datasets.diff.latest-version", "Latest Version")}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="output">
          <AccordionTrigger>{t("datasets.compare-runs.col-expected-output", "Expected Output")}</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(
                selectedVersion.expectedOutput,
              )}
              newString={stringifyDatasetItemData(latestVersion.expectedOutput)}
              oldLabel={t("datasets.diff.selected-version", "Selected Version")}
              newLabel={t("datasets.diff.latest-version", "Latest Version")}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="metadata">
          <AccordionTrigger>{t("datasets.compare-runs.col-metadata", "Metadata")}</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(selectedVersion.metadata)}
              newString={stringifyDatasetItemData(latestVersion.metadata)}
              oldLabel={t("datasets.diff.selected-version", "Selected Version")}
              newLabel={t("datasets.diff.latest-version", "Latest Version")}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

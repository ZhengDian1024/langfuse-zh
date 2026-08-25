import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { SourceField } from "../types";
import { useI18n } from "@/src/features/i18n/useI18n";

type SourceFieldSelectorProps = {
  value: SourceField;
  onChange: (field: SourceField) => void;
  disabled?: boolean;
};

export function SourceFieldSelector({
  value,
  onChange,
  disabled = false,
}: SourceFieldSelectorProps) {
  const { t } = useI18n();
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SourceField)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="input">
          {t("batch-actions.add-to-dataset.field.input", "Input")}
        </SelectItem>
        <SelectItem value="output">
          {t("batch-actions.add-to-dataset.field.output", "Output")}
        </SelectItem>
        <SelectItem value="metadata">
          {t("batch-actions.add-to-dataset.field.metadata", "Metadata")}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { type ObjectType } from "@/src/features/score-analytics/lib/analytics-url-state";
import { useI18n } from "@/src/features/i18n/useI18n";

const OBJECT_TYPE_VALUES: ObjectType[] = [
  "all",
  "trace",
  "session",
  "observation",
  "dataset_run",
];

interface ObjectTypeFilterProps {
  value: ObjectType;
  onChange: (value: ObjectType) => void;
  className?: string;
}

export function ObjectTypeFilter({
  value,
  onChange,
  className,
}: ObjectTypeFilterProps) {
  const { t } = useI18n();
  const getLabel = (optionValue: ObjectType) => {
    switch (optionValue) {
      case "all":
        return t("score-analytics.object-type-all", "all");
      case "trace":
        return t("score-analytics.object-type-traces", "Traces");
      case "session":
        return t("score-analytics.object-type-sessions", "Sessions");
      case "observation":
        return t("score-analytics.object-type-observations", "Observations");
      case "dataset_run":
        return t("score-analytics.object-type-dataset-runs", "Dataset Runs");
    }
  };
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label={t("score-analytics.object-type", "Object type")}>
        <SelectValue placeholder={t("score-analytics.object-type", "Object type")} />
      </SelectTrigger>
      <SelectContent>
        {OBJECT_TYPE_VALUES.map((optionValue) => (
          <SelectItem key={optionValue} value={optionValue}>
            {getLabel(optionValue)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

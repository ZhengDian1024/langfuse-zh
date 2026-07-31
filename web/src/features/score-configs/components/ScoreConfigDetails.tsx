import { isNumericDataType } from "@/src/features/scores/lib/helpers";
import { isPresent, type ScoreConfigDomain } from "@langfuse/shared";
import React from "react";
import { useI18n } from "@/src/features/i18n/useI18n";

export function ScoreConfigDetails({ config }: { config: ScoreConfigDomain }) {
  const { t } = useI18n();
  const { name, description, minValue, maxValue, dataType } = config;
  if (!description && !isPresent(minValue) && !isPresent(maxValue)) return null;
  const isNameTruncated = name.length > 20;

  return (
    <div className="bg-background p-2 text-xs font-light text-wrap">
      {!!description && (
        <p>
          {t("score-configs.description-prefix", "Description: ")}
          {description}
        </p>
      )}
      {isNumericDataType(dataType) &&
      (isPresent(minValue) || isPresent(maxValue)) ? (
        <p>
          {t("score-configs.range-prefix", "Range: ")}
          [{minValue ?? "-∞"}, {maxValue ?? "∞"}]
        </p>
      ) : null}
      {isNameTruncated && (
        <p>
          {t("score-configs.full-name-prefix", "Full name: ")}
          {name}
        </p>
      )}
    </div>
  );
}

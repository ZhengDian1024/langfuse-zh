import React from "react";
import Header from "@/src/components/layouts/header";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { ScoreConfigsTable } from "@/src/components/table/use-cases/score-configs";
import { useI18n } from "@/src/features/i18n/useI18n";

export function ScoreConfigSettings({ projectId }: { projectId: string }) {
  const hasReadAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:read",
  });
  const { t } = useI18n();

  if (!hasReadAccess) return null;

  return (
    <div id="score-configs">
      <Header title={t("score-configs.title", "Score Configs")} />
      <p className="mb-2 text-sm">
        {t(
          "score-configs.description-before",
          "Score configs define which scores are available for ",
        )}
        <a
          href="https://langfuse.com/docs/evaluation/evaluation-methods/annotation"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("score-configs.annotation-link", "annotation")}
        </a>
        {t(
          "score-configs.description-after",
          " in your project. Please note that all score configs are immutable.",
        )}
      </p>
      <ScoreConfigsTable projectId={projectId} />
    </div>
  );
}

import { Archive } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import React from "react";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useEmptyScoreConfigs } from "@/src/features/scores/hooks/useEmptyConfigs";
import { useI18n } from "@/src/features/i18n/useI18n";

export const ArchiveScoreConfigButton = ({
  configId,
  projectId,
  isArchived,
  name,
}: {
  configId: string;
  projectId: string;
  isArchived: boolean;
  name: string;
}) => {
  const capture = usePostHogClientCapture();
  const { t } = useI18n();
  const { emptySelectedConfigIds, setEmptySelectedConfigIds } =
    useEmptyScoreConfigs();

  const hasAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:CUD",
  });

  const utils = api.useUtils();
  const configMutation = api.scoreConfigs.update.useMutation({
    onSuccess: () => utils.scoreConfigs.invalidate(),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start"
          disabled={!hasAccess}
          onClick={(e) => {
            e.stopPropagation();
            capture("score_configs:archive_form_open");
          }}
        >
          <Archive className="mr-2 h-4 w-4"></Archive>
          {t("score-configs.archive", "Archive")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-[500px]"
      >
        <h2 className="mb-3 font-semibold">
          {isArchived
            ? t("score-configs.restore-config", "Restore config")
            : t("score-configs.archive-config", "Archive config")}
        </h2>
        <p className="mb-3 text-sm">
          {t("score-configs.config-current", "Your config is currently ")}
          {isArchived
            ? t(
                "score-configs.archived-desc",
                'archived. Restore if you want to use "{name}" in annotation again.',
                { name },
              )
            : t(
                "score-configs.active-desc",
                'active. Archive if you no longer want to use "{name}" in annotation. Historic "{name}" scores will still be shown and can be deleted. You can restore your config at any point.',
                { name },
              )}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant={isArchived ? "default" : "destructive"}
            loading={configMutation.isPending}
            onClick={() => {
              configMutation.mutateAsync({
                projectId,
                id: configId,
                isArchived: !isArchived,
              });
              setEmptySelectedConfigIds(
                emptySelectedConfigIds.filter((id) => id !== configId),
              );
              capture("score_configs:archive_form_submit");
            }}
          >
            {t("common.confirm", "Confirm")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

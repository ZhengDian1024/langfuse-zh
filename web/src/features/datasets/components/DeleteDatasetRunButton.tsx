import { Trash } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { api } from "@/src/utils/api";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useI18n } from "@/src/features/i18n/useI18n";

export const DeleteDatasetRunButton = ({
  projectId,
  datasetRunId,
  redirectUrl,
  datasetId,
}: {
  projectId: string;
  datasetRunId: string;
  redirectUrl?: string;
  datasetId: string;
}) => {
  const { t } = useI18n();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const capture = usePostHogClientCapture();
  const hasAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "datasets:CUD",
  });
  const utils = api.useUtils();
  const router = useRouter();
  const mutDelete = api.datasets.deleteDatasetRuns.useMutation({
    onSuccess: () => {
      redirectUrl ? router.push(redirectUrl) : utils.datasets.invalidate();
    },
  });

  const button = (
    <Button
      variant="ghost"
      className="w-full"
      disabled={!hasAccess}
      onClick={() => capture("dataset_run:delete_form_open")}
    >
      <div className="flex w-full flex-row items-center gap-1">
        <Trash className="h-4 w-4" />
        <span className="text-sm font-normal">
          {t("datasets.delete", "Delete")}
        </span>
      </div>
    </Button>
  );

  return hasAccess ? (
    <ConfirmDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      trigger={button}
      title={t("datasets.delete-run.confirm-title", "Please confirm")}
      description={t(
        "datasets.delete-run.confirm-desc",
        "This action cannot be undone. Traces linked to this run must be deleted manually.",
      )}
      confirmLabel={t(
        "datasets.delete-run.confirm-label",
        "Delete Dataset Run",
      )}
      loading={mutDelete.isPending}
      onConfirm={async () => {
        capture("dataset_run:delete_form_submit");
        await mutDelete.mutateAsync({
          projectId,
          datasetId: datasetId,
          datasetRunIds: [datasetRunId],
        });
        setIsDialogOpen(false);
      }}
    />
  ) : (
    button
  );
};

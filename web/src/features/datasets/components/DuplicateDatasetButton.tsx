import { useRouter } from "next/router";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { Copy } from "lucide-react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useI18n } from "@/src/features/i18n/useI18n";

export const DuplicateDatasetButton: React.FC<{
  projectId: string;
  datasetId: string;
}> = ({ projectId, datasetId }) => {
  const { t } = useI18n();
  const router = useRouter();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });
  const duplicateDataset = api.datasets.duplicateDataset.useMutation({
    onSuccess: ({ id }) => {
      router.push(`/project/${projectId}/datasets/${id}/items`);
    },
  });

  const handleDuplicate = () => {
    if (
      confirm(
        t(
          "datasets.duplicate.confirm",
          "Are you sure you want to duplicate this dataset and all of its items?",
        ),
      )
    ) {
      duplicateDataset.mutate({ projectId, datasetId });
    }
  };

  return (
    <Button
      onClick={handleDuplicate}
      variant="ghost"
      title={t("datasets.duplicate.title", "Duplicate dataset")}
      loading={duplicateDataset.isPending}
      disabled={!hasAccess}
    >
      <Copy className="mr-2 h-4 w-4" />
      {t("datasets.duplicate", "Duplicate")}
    </Button>
  );
};

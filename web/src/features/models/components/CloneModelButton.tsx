import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { UpsertModelFormDialog } from "@/src/features/models/components/UpsertModelFormDialog";
import { type GetModelResult } from "@/src/features/models/validation";
import { useI18n } from "@/src/features/i18n/useI18n";

export const CloneModelButton = ({
  modelData,
  projectId,
}: {
  modelData: GetModelResult;
  projectId: string;
}) => {
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "models:CUD",
  });
  const { t } = useI18n();

  return (
    <UpsertModelFormDialog {...{ modelData, projectId, action: "clone" }}>
      <Button
        variant="outline"
        disabled={!hasAccess}
        title={t("models.aria.clone", "Clone model")}
        className="flex items-center"
      >
        <span>{t("models.action.clone", "Clone")}</span>
      </Button>
    </UpsertModelFormDialog>
  );
};

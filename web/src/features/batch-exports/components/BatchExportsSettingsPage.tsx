import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { BatchExportsTable } from "@/src/features/batch-exports/components/BatchExportsTable";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";
import { useI18n } from "@/src/features/i18n/useI18n";

export function BatchExportsSettingsPage(props: { projectId: string }) {
  const { t } = useI18n();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:read",
  });

  return (
    <>
      <Header title={t("batch-exports.page.title", "Exports")} />
      <p className="mb-4 text-sm">
        {t(
          "batch-exports.page.description",
          "Export large datasets in your preferred format via the export buttons across Langfuse. Exports are processed asynchronously and remain available for download for one hour. You will receive an email notification once your export is ready.",
        )}
      </p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchExportsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <AlertTitle>
            {t("batch-exports.access-denied.title", "Access Denied")}
          </AlertTitle>
          <AlertDescription>
            {t(
              "batch-exports.access-denied.description",
              "You do not have permission to view batch exports.",
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

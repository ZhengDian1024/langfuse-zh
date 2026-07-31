import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function NewDashboard() {
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };
  const { t } = useI18n();

  // State for new dashboard
  const [dashboardName, setDashboardName] = useState(t("dashboard.new.default-name", "New Dashboard"));
  const [dashboardDescription, setDashboardDescription] = useState("");

  // Check project access
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  // Mutation for creating a new dashboard
  const createDashboard = api.dashboard.createDashboard.useMutation({
    onSuccess: (data) => {
      showSuccessToast({
        title: t("dashboard.toast.created-title", "Dashboard created"),
        description: t("dashboard.toast.created-description", "Your new dashboard has been created successfully"),
      });
      // Navigate to the newly created dashboard
      router.push(`/project/${projectId}/dashboards/${data.id}`);
    },
    onError: (error) => {
      showErrorToast(t("dashboard.toast.error-create", "Error creating dashboard"), error.message);
    },
  });

  // Handle form submission
  const handleCreateDashboard = () => {
    if (dashboardName.trim()) {
      createDashboard.mutate({
        projectId,
        name: dashboardName,
        description: dashboardDescription,
      });
    } else {
      showErrorToast(t("dashboard.toast.error-validation", "Validation error"), t("dashboard.toast.name-required", "Dashboard name is required"));
    }
  };

  return (
    <Page
      withPadding
      headerProps={{
        title: t("dashboard.new.title", "Create Dashboard"),
        help: {
          description: t("dashboard.new.help-description", "Create a new dashboard for your project"),
        },
        actionButtonsRight: (
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/project/${projectId}/dashboards`)}
            >
              {t("dashboard.action.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={
                !dashboardName.trim() ||
                createDashboard.isPending ||
                !hasCUDAccess
              }
              loading={createDashboard.isPending}
            >
              {t("dashboard.action.create", "Create")}
            </Button>
          </>
        ),
      }}
    >
      <div className="mx-auto my-8 max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="dashboard-name">{t("dashboard.new.name-label", "Dashboard Name")}</Label>
          <Input
            id="dashboard-name"
            value={dashboardName}
            onChange={(e) => {
              setDashboardName(e.target.value);
            }}
            placeholder={t("dashboard.new.name-placeholder", "Enter dashboard name")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dashboard-description">{t("dashboard.new.description-label", "Description")}</Label>
          <Textarea
            id="dashboard-description"
            value={dashboardDescription}
            onChange={(e) => {
              setDashboardDescription(e.target.value);
            }}
            placeholder={t("dashboard.new.description-placeholder", "Describe the purpose of this dashboard. Optional, but very helpful.")}
            rows={4}
          />
        </div>

        <div className="text-muted-foreground text-sm">
          <p>
            {t("dashboard.new.after-create-note", "After creating the dashboard, you can add widgets to visualize your data.")}
          </p>
        </div>
      </div>
    </Page>
  );
}

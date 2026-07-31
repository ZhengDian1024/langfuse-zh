import React, { useState } from "react";
import { api } from "@/src/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useI18n } from "@/src/features/i18n/useI18n";

interface EditDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  dashboardId: string;
  initialName: string;
  initialDescription: string;
}

export function EditDashboardDialog({
  open,
  onOpenChange,
  projectId,
  dashboardId,
  initialName,
  initialDescription,
}: EditDashboardDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const utils = api.useUtils();
  const { t } = useI18n();

  const updateDashboard = api.dashboard.updateDashboardMetadata.useMutation({
    onSuccess: () => {
      utils.dashboard.invalidate();
      showSuccessToast({
        title: t("dashboard.toast.updated-title", "Dashboard updated"),
        description: t("dashboard.toast.updated-description", "The dashboard has been updated successfully"),
      });
      onOpenChange(false);
    },
    onError: (e) => {
      showErrorToast(t("dashboard.toast.error-update", "Failed to update dashboard"), e.message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      showErrorToast(t("dashboard.toast.error-validation", "Validation error"), t("dashboard.toast.name-required", "Dashboard name is required"));
      return;
    }

    updateDashboard.mutate({
      projectId,
      dashboardId,
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dashboard.dialog.edit-title", "Edit Dashboard")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("dashboard.dialog.name-label", "Name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("dashboard.dialog.name-placeholder", "Dashboard name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("dashboard.dialog.description-label", "Description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("dashboard.dialog.description-placeholder", "Dashboard description")}
                rows={3}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              type="button"
            >
              {t("dashboard.action.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              type="button"
              loading={updateDashboard.isPending}
            >
              {t("dashboard.action.save-changes", "Save Changes")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

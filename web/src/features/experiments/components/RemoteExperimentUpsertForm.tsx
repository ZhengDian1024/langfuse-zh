import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { api } from "@/src/utils/api";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import { type Prisma } from "@langfuse/shared";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getFormattedPayload } from "@/src/features/experiments/utils/format";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useI18n } from "@/src/features/i18n/useI18n";

const RemoteExperimentSetupSchema = z.object({
  url: z.url(),
  defaultPayload: z.string(),
  enabled: z.boolean(),
});

type RemoteExperimentSetupForm = z.infer<typeof RemoteExperimentSetupSchema>;

export const RemoteExperimentUpsertForm = ({
  projectId,
  datasetId,
  existingRemoteExperiment,
  setShowRemoteExperimentUpsertForm,
  onBack,
}: {
  projectId: string;
  datasetId: string;
  existingRemoteExperiment?: {
    url: string;
    payload: Prisma.JsonValue;
    enabled?: boolean;
  } | null;
  setShowRemoteExperimentUpsertForm: (show: boolean) => void;
  onBack?: () => void;
}) => {
  const { t } = useI18n();
  const hasDatasetAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  const dataset = api.datasets.byId.useQuery({
    projectId,
    datasetId,
  });
  const utils = api.useUtils();

  const form = useForm<RemoteExperimentSetupForm>({
    resolver: zodResolver(RemoteExperimentSetupSchema),
    defaultValues: {
      url: existingRemoteExperiment?.url || "",
      defaultPayload: getFormattedPayload(existingRemoteExperiment?.payload),
      enabled: existingRemoteExperiment?.enabled ?? true,
    },
  });

  const upsertRemoteExperimentMutation =
    api.datasets.upsertRemoteExperiment.useMutation({
      onSuccess: () => {
        showSuccessToast({
          title: t("experiments.upsert.setup-success-title", "Setup successfully"),
          description: t("experiments.upsert.setup-success-desc", "Your changes have been saved."),
        });
        setShowRemoteExperimentUpsertForm(false);
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
      },
      onError: (error) => {
        showErrorToast(
          error.message || t("experiments.upsert.setup-failed-title", "Failed to setup"),
          t("experiments.upsert.setup-failed-desc", "Please check your URL and config and try again."),
        );
      },
    });

  const deleteRemoteExperimentMutation =
    api.datasets.deleteRemoteExperiment.useMutation({
      onSuccess: () => {
        showSuccessToast({
          title: t("experiments.upsert.delete-success-title", "Deleted successfully"),
          description: t(
            "experiments.upsert.delete-success-desc",
            "The remote dataset run trigger has been removed from this dataset.",
          ),
        });
        setShowRemoteExperimentUpsertForm(false);
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
      },
      onError: (error) => {
        showErrorToast(
          error.message || t("experiments.upsert.delete-failed-title", "Failed to delete remote dataset run trigger"),
          t("experiments.upsert.delete-failed-desc", "Please try again."),
        );
      },
    });

  const onSubmit = (data: RemoteExperimentSetupForm) => {
    if (data.defaultPayload.trim()) {
      try {
        JSON.parse(data.defaultPayload);
      } catch {
        form.setError("defaultPayload", {
          message: t("experiments.upsert.invalid-json", "Invalid JSON format"),
        });
        return;
      }
    }

    upsertRemoteExperimentMutation.mutate({
      projectId,
      datasetId,
      url: data.url,
      defaultPayload: data.defaultPayload,
      enabled: data.enabled,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        t("experiments.upsert.confirm-delete", "Are you sure you want to delete this remote dataset run trigger?"),
      )
    ) {
      deleteRemoteExperimentMutation.mutate({
        projectId,
        datasetId,
      });
    }
  };

  if (!hasDatasetAccess) {
    return null;
  }

  if (dataset.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setShowRemoteExperimentUpsertForm(false);
            }
          }}
          className="inline-block self-start"
        >
          ← {t("experiments.upsert.back", "Back")}
        </Button>
        <DialogTitle>
          {existingRemoteExperiment
            ? t("experiments.upsert.edit-title", "Edit remote experiment trigger")
            : t("experiments.upsert.setup-title", "Set up remote experiment trigger in UI")}
        </DialogTitle>
        <DialogDescription>
          {t(
            "experiments.upsert.description",
            'Enable your team to run custom experiments on dataset "{name}". Configure a webhook URL to trigger remote custom experiments from UI. We will send dataset info (name, id) and config to your service, which can run against the dataset and post results to Langfuse.',
            { name: dataset.isSuccess ? (dataset.data?.name ?? "") : "" },
          )}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("experiments.upsert.url", "URL")}</FormLabel>
                  <FormDescription>
                    {t("experiments.upsert.url-desc", "The URL that will be called when the remote experiment is triggered.")}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder={t("experiments.upsert.url-placeholder", "https://your-service.com/webhook")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultPayload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("experiments.upsert.default-config", "Default config")}</FormLabel>
                  <FormDescription>
                    {t("experiments.upsert.default-config-desc", "Set a default config that will be sent to the remote experiment run URL. This can be modified before starting a new run. View docs for more details.")}
                  </FormDescription>
                  <CodeMirrorEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    editable
                    mode="json"
                    minHeight={200}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("experiments.upsert.enabled", "Enabled")}</FormLabel>
                    <FormDescription>
                      {field.value
                        ? t("experiments.upsert.enabled-active-desc", "Trigger is active. You can disable anytime to pause without losing your configuration.")
                        : t("experiments.upsert.enabled-paused-desc", "Trigger is paused. Enable to allow running remote experiments.")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full justify-between">
              {existingRemoteExperiment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteRemoteExperimentMutation.isPending}
                >
                  {deleteRemoteExperimentMutation.isPending && (
                    <div className="mr-2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {t("experiments.upsert.delete", "Delete")}
                </Button>
              )}
              <Button
                type="submit"
                className="ml-auto"
                disabled={upsertRemoteExperimentMutation.isPending}
              >
                {upsertRemoteExperimentMutation.isPending ? (
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                ) : null}
                {existingRemoteExperiment
                  ? t("experiments.upsert.update", "Update")
                  : t("experiments.upsert.setup", "Set up")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

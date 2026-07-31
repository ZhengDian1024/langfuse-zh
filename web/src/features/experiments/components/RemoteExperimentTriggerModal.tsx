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
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import { api } from "@/src/utils/api";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { getFormattedPayload } from "@/src/features/experiments/utils/format";
import { type Prisma } from "@langfuse/shared";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useI18n } from "@/src/features/i18n/useI18n";

const RemoteExperimentTriggerSchema = z.object({
  payload: z.string(),
});

type RemoteExperimentTriggerForm = z.infer<
  typeof RemoteExperimentTriggerSchema
>;

export const RemoteExperimentTriggerModal = ({
  projectId,
  datasetId,
  remoteExperimentConfig,
  setShowTriggerModal,
}: {
  projectId: string;
  datasetId: string;
  remoteExperimentConfig: {
    url: string;
    payload?: Prisma.JsonValue;
  };
  setShowTriggerModal: (show: boolean) => void;
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

  const form = useForm<RemoteExperimentTriggerForm>({
    resolver: zodResolver(RemoteExperimentTriggerSchema),
    defaultValues: {
      payload: getFormattedPayload(remoteExperimentConfig.payload),
    },
  });

  const runRemoteExperimentMutation =
    api.datasets.triggerRemoteExperiment.useMutation({
      onSuccess: (data) => {
        if (data.success && data.skipped) {
          showErrorToast(
            t("experiments.trigger-modal.disabled-title", "Trigger is disabled"),
            t("experiments.trigger-modal.disabled-desc", "Enable the trigger in settings to run remote experiments."),
            "WARNING",
          );
        } else if (data.success) {
          showSuccessToast({
            title: t("experiments.trigger-modal.success-title", "Remote experiment triggered"),
            description: t("experiments.trigger-modal.success-desc", "Your remote experiment may take a few minutes to complete."),
          });
        } else {
          showErrorToast(
            t("experiments.trigger-modal.failed-title", "Failed to trigger remote experiment"),
            data.error ||
              t("experiments.trigger-modal.failed-desc", "Please try again or check your remote experiment configuration."),
          );
        }
        setShowTriggerModal(false);
      },
    });

  const onSubmit = (data: RemoteExperimentTriggerForm) => {
    if (data.payload.trim()) {
      try {
        JSON.parse(data.payload);
      } catch {
        form.setError("payload", {
          message: t("experiments.trigger-modal.invalid-json", "Invalid JSON format"),
        });
        return;
      }
    }

    runRemoteExperimentMutation.mutate({
      projectId,
      datasetId,
      payload: data.payload,
    });
  };

  if (!hasDatasetAccess) {
    return null;
  }

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={() => setShowTriggerModal(false)}
          className="inline-block self-start"
        >
          ← {t("experiments.trigger-modal.back", "Back")}
        </Button>
        <DialogTitle>{t("experiments.trigger-modal.title", "Run remote dataset run")}</DialogTitle>
        <DialogDescription>
          {t("experiments.trigger-modal.description", "This action will send the following information to {url}.", { url: remoteExperimentConfig.url ?? "" })}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="payload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("experiments.trigger-modal.config", "Config")}</FormLabel>
                    <FormDescription>
                      {t(
                        "experiments.trigger-modal.config-desc",
                        "Confirm the config you want to send to the remote dataset run URL along with the {datasetName} dataset information.",
                        { datasetName: dataset.data?.name ?? "" },
                      )}
                    </FormDescription>
                    <FormControl>
                      <CodeMirrorEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        editable
                        mode="json"
                        minHeight={200}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTriggerModal(false)}
                disabled={runRemoteExperimentMutation.isPending}
              >
                {t("experiments.trigger-modal.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={runRemoteExperimentMutation.isPending}
              >
                {runRemoteExperimentMutation.isPending && (
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                )}
                {t("experiments.trigger-modal.run", "Run")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

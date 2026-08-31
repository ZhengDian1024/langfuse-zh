import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import type * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import Header from "@/src/components/layouts/header";
import { useI18n } from "@/src/features/i18n/useI18n";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { LockIcon } from "lucide-react";
import { useQueryProject } from "@/src/features/projects/hooks";
import { useSession } from "next-auth/react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { projectRetentionSchema } from "@/src/features/auth/lib/projectRetentionSchema";
import { ActionButton } from "@/src/components/ActionButton";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";

export default function ConfigureRetention() {
  const { update: updateSession } = useSession();
  const { project } = useQueryProject();
  const capture = usePostHogClientCapture();
  const { t } = useI18n();
  const hasAccess = useHasProjectAccess({
    projectId: project?.id,
    scope: "project:update",
  });
  const hasEntitlement = useHasEntitlement("data-retention");

  const form = useForm({
    resolver: zodResolver(projectRetentionSchema),
    defaultValues: {
      retention: project?.retentionDays ?? 0,
    },
  });
  const setRetention = api.projects.setRetention.useMutation({
    onSuccess: (_) => {
      updateSession();
    },
    onError: (error) => form.setError("retention", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof projectRetentionSchema>) {
    if (!hasAccess || !project) return;
    capture("project_settings:retention_form_submit");
    setRetention
      .mutateAsync({
        projectId: project.id,
        retention: values.retention || null, // Fallback to null for indefinite retention
      })
      .then(() => {
        form.reset();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div>
      <Header title={t("projects.retention.title", "Data Retention")} />
      <Card className="mb-4 p-3">
        <p className="text-primary mb-4 text-sm">
          {t(
            "projects.retention.desc",
            "Data retention automatically deletes events older than the specified number of days. The value must be 0 or at least 3 days. Set to 0 to retain data indefinitely. The deletion happens asynchronously, i.e. event may be available for a while after they expired.",
          )}
        </p>
        {Boolean(form.getValues().retention) &&
        form.getValues().retention !== project?.retentionDays ? (
          <p className="text-primary mb-4 text-sm">
            {t(
              "projects.retention.will-set",
              'Your Project\'s retention will be set from "{from}" to "{to}" days.',
              {
                from:
                  project?.retentionDays?.toString() ??
                  t("projects.retention.indefinite", "Indefinite"),
                to:
                  Number(form.watch("retention")) === 0
                    ? t("projects.retention.indefinite", "Indefinite")
                    : Number(form.watch("retention")).toString(),
              },
            )}
          </p>
        ) : !Boolean(project?.retentionDays) ? (
          <p className="text-primary mb-4 text-sm">
            {t(
              "projects.retention.indefinite-current",
              "Your Project retains data indefinitely.",
            )}
          </p>
        ) : (
          <p className="text-primary mb-4 text-sm">
            {t(
              "projects.retention.current",
              'Your Project\'s current retention is "{days}" days.',
              { days: project?.retentionDays?.toString() ?? "" },
            )}
          </p>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1"
            id="set-retention-project-form"
          >
            <FormField
              control={form.control}
              name="retention"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="1"
                        placeholder={project?.retentionDays?.toString() ?? ""}
                        {...field}
                        value={(field.value as number) ?? ""}
                        className="flex-1"
                        disabled={!hasAccess || !hasEntitlement}
                      />
                      {!hasAccess && (
                        <span title={t("projects.no-access", "No access")}>
                          <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              hasEntitlement={hasEntitlement}
              loading={setRetention.isPending}
              disabled={form.getValues().retention === null}
              className="mt-4"
              type="submit"
            >
              {t("common.save", "Save")}
            </ActionButton>
          </form>
        </Form>
      </Card>
    </div>
  );
}

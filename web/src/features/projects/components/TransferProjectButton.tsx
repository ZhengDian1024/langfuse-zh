import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { api } from "@/src/utils/api";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  hasOrganizationAccess,
  useHasOrganizationAccess,
} from "@/src/features/rbac/utils/checkOrganizationAccess";
import { useQueryProject } from "@/src/features/projects/hooks";
import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useI18n } from "@/src/features/i18n/useI18n";

export function TransferProjectButton() {
  const capture = usePostHogClientCapture();
  const session = useSession();
  const { t } = useI18n();
  const { project, organization } = useQueryProject();
  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "projects:transfer_org",
  });
  const allOrgs = session.data?.user?.organizations ?? [];
  const organizationsToTransferTo =
    allOrgs.filter((org) =>
      hasOrganizationAccess({
        session: session.data,
        organizationId: org.id,
        scope: "projects:transfer_org",
      }),
    ) ?? [];
  const confirmMessage = (organization?.name + "/" + project?.name)
    .replaceAll(" ", "-")
    .toLowerCase();

  const formSchema = z.object({
    name: z.string().includes(confirmMessage, {
      message: t("projects.confirm-error", 'Please confirm with "{name}"', {
        name: confirmMessage,
      }),
    }),
    projectId: z.string(),
  });

  const transferProject = api.projects.transfer.useMutation({
    onSuccess: async () => {
      showSuccessToast({
        title: t("projects.transfer.success-title", "Project transferred"),
        description: t(
          "projects.transfer.success-desc",
          "The project is successfully transferred to the new organization. Redirecting...",
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
      session.update();
      window.location.href = "/";
    },
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectId: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!project) return;
    capture("project_settings:project_delete");
    transferProject.mutate({
      projectId: project.id,
      targetOrgId: values.projectId,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive-secondary" disabled={!hasAccess}>
          {t("projects.transfer.button", "Transfer Project")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("projects.transfer.title", "Transfer Project")}
          </DialogTitle>
          <Alert className="mt-2">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>{t("projects.transfer.warning", "Warning")}</AlertTitle>
            <AlertDescription>
              {t(
                "projects.transfer.warning-desc",
                "Transferring the project will move it to a different organization:",
              )}
              <ul className="list-disc pl-4">
                <li>
                  {t(
                    "projects.transfer.warning-members",
                    "Members who are not part of the new organization will lose access.",
                  )}
                </li>
                <li>
                  {t(
                    "projects.transfer.warning-operational",
                    "The project remains fully operational as API keys, settings, and data will remain unchanged. All features (e.g. tracing, prompt management) will continue to work without interruption.",
                  )}
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogBody>
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "projects.transfer.select-org",
                        "Select New Organization",
                      )}
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={transferProject.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "projects.transfer.select-org-placeholder",
                              "Select organization",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationsToTransferTo
                            .filter((org) => org.id !== organization?.id)
                            .map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t(
                        "projects.transfer.select-org-desc",
                        "Transfer this project to another organization where you have the ability to create projects.",
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.confirm", "Confirm")}</FormLabel>
                    <FormControl>
                      <Input placeholder={confirmMessage} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "projects.confirm-hint",
                        'To confirm, type "{name}" in the input box',
                        { name: confirmMessage },
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="submit"
                variant="destructive"
                loading={transferProject.isPending}
                className="w-full"
              >
                {t("projects.transfer.confirm", "Transfer project")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

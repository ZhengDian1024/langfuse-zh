import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Webhook, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/src/components/ActionButton";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/src/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useI18n } from "@/src/features/i18n/useI18n";
import {
  WEB_CALLOUT_BLOCKED_HEADER_NAMES,
  WEB_CALLOUT_HEADER_NAME_PATTERN,
} from "@/src/features/web-callouts/headerRules";
import { api, type RouterOutputs } from "@/src/utils/api";

type WebCalloutEndpoint = RouterOutputs["webCallouts"]["all"][number];

const webCalloutFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(100),
    url: z.url(),
    enabled: z.boolean(),
    toastMessage: z.string().trim().min(1).max(200),
    headers: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const seenHeaderNames = new Set<string>();

    data.headers.forEach((header, index) => {
      const name = header.name.trim();

      if (!name) {
        return;
      }

      const lowerName = name.toLowerCase();

      if (!WEB_CALLOUT_HEADER_NAME_PATTERN.test(name)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid header name.",
          path: ["headers", index, "name"],
        });
      }

      if (WEB_CALLOUT_BLOCKED_HEADER_NAMES.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "This header is set by Langfuse and cannot be customized.",
          path: ["headers", index, "name"],
        });
      }

      if (seenHeaderNames.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "Header names must be unique.",
          path: ["headers", index, "name"],
        });
      }

      seenHeaderNames.add(lowerName);
    });
  });

type WebCalloutFormValues = z.infer<typeof webCalloutFormSchema>;

export function WebCalloutSettingsPage(props: { projectId: string }) {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] =
    useState<WebCalloutEndpoint | null>(null);

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const endpoints = api.webCallouts.all.useQuery(
    { projectId: props.projectId },
    { enabled: hasAccess },
  );
  const utils = api.useUtils();

  const deleteMutation = api.webCallouts.delete.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: t("integration.web-callouts.deleted-title", "Callout endpoint deleted"),
        description: t("integration.web-callouts.deleted-desc", "The endpoint was removed from this project."),
      });
    },
    onError: (error) => {
      showErrorToast(t("integration.web-callouts.failed-delete", "Failed to delete callout endpoint"), error.message);
    },
  });

  if (!hasAccess) {
    return (
      <div>
        <Alert>
          <AlertTitle>{t("integration.web-callouts.access-denied-title", "Access Denied")}</AlertTitle>
          <AlertDescription>
            {t("integration.web-callouts.access-denied-desc", "You do not have permission to manage integrations for this project.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const configuredEndpoint = endpoints.data?.[0];
  const canCreateEndpoint = !configuredEndpoint;
  const addEndpointDisabledReason = endpoints.isLoading
    ? t("integration.web-callouts.loading-disabled", "Loading callout endpoint configuration.")
    : !canCreateEndpoint
      ? t("integration.web-callouts.only-one-allowed", "Currently you can only create one callout per project.")
      : undefined;

  const openCreateDialog = () => {
    setEditingEndpoint(null);
    setDialogOpen(true);
  };

  const openEditDialog = (endpoint: WebCalloutEndpoint) => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  };

  return (
    <div>
      <p className="text-primary mb-4 text-sm">
        {t("integration.web-callouts.description-before", "Configure a project-level callout. Your users can trigger a POST to an endpoint on trace, observation, and session detail screens. This can be used to integrate with your services to trigger workflows. See the docs")}{" "}
        <a
          href="https://langfuse.com/docs/observability/features/web-callouts"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {t("integration.web-callouts.description-link", "here")}
        </a>{" "}
        {t("integration.web-callouts.description-after", "for more info.")}
      </p>

      <div className="mb-4 flex justify-end">
        <WebCalloutEndpointDialog
          projectId={props.projectId}
          endpoint={editingEndpoint}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEndpoint(null);
            }
          }}
          trigger={
            <AddEndpointButton
              disabledReason={addEndpointDisabledReason}
              onClick={openCreateDialog}
            />
          }
        />
      </div>

      <Card className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">{t("integration.web-callouts.col-name", "Name")}</TableHead>
              <TableHead className="text-primary">{t("integration.web-callouts.col-endpoint", "Endpoint")}</TableHead>
              <TableHead className="text-primary">{t("integration.web-callouts.col-toast-message", "Toast Message")}</TableHead>
              <TableHead className="text-primary">{t("integration.web-callouts.col-headers", "Headers")}</TableHead>
              <TableHead className="text-primary">{t("integration.web-callouts.col-status", "Status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  density="comfortable"
                  colSpan={6}
                  className="text-muted-foreground text-center"
                >
                  {t("integration.web-callouts.no-endpoint", "No callout endpoint configured.")}
                </TableCell>
              </TableRow>
            ) : (
              endpoints.data?.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell density="comfortable" className="font-medium">
                    {endpoint.name}
                  </TableCell>
                  <TableCell
                    density="comfortable"
                    className="max-w-xl font-mono break-all"
                  >
                    {endpoint.url}
                  </TableCell>
                  <TableCell density="comfortable">
                    <ToastMessageCell endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <HeaderList endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <StatusBadge
                      type={endpoint.enabled ? "active" : "disabled"}
                    />
                  </TableCell>
                  <TableCell density="comfortable" className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(endpoint)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("integration.web-callouts.edit-endpoint-tooltip", "Edit endpoint")}</TooltipContent>
                      </Tooltip>
                      <DeleteEndpointButton
                        endpoint={endpoint}
                        onDelete={(id) => {
                          deleteMutation.mutate({
                            projectId: props.projectId,
                            id,
                          });
                        }}
                        loading={deleteMutation.isPending}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddEndpointButton(props: {
  disabledReason?: string;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const button = (
    <Button
      disabled={Boolean(props.disabledReason)}
      className={props.disabledReason ? "pointer-events-none" : undefined}
      onClick={props.onClick}
    >
      <Plus className="mr-1 h-4 w-4" />
      {t("integration.web-callouts.add-endpoint", "Add endpoint")}
    </Button>
  );

  if (!props.disabledReason) {
    return <DialogTrigger asChild>{button}</DialogTrigger>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{button}</span>
      </TooltipTrigger>
      <TooltipContent>{props.disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function HeaderList(props: { endpoint: WebCalloutEndpoint }) {
  const { t } = useI18n();
  const headers = props.endpoint.requestHeaderKeys;

  if (headers.length === 0) {
    return <span className="text-muted-foreground">{t("integration.web-callouts.none", "None")}</span>;
  }

  return (
    <span className="font-mono text-sm break-words">{headers.join(", ")}</span>
  );
}

function ToastMessageCell(props: { endpoint: WebCalloutEndpoint }) {
  return (
    <div
      className="max-w-xs truncate text-sm"
      title={props.endpoint.toastMessage}
    >
      {props.endpoint.toastMessage}
    </div>
  );
}

function WebCalloutEndpointDialog(props: {
  projectId: string;
  endpoint: WebCalloutEndpoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  const { t } = useI18n();
  const utils = api.useUtils();
  const upsertMutation = api.webCallouts.upsert.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: props.endpoint
          ? t("integration.web-callouts.updated-title", "Callout endpoint updated")
          : t("integration.web-callouts.created-title", "Callout endpoint created"),
        description: t("integration.web-callouts.saved-desc", "Web callout configuration was saved."),
      });
      props.onOpenChange(false);
    },
    onError: (error) => {
      showErrorToast(t("integration.web-callouts.failed-save", "Failed to save callout endpoint"), error.message);
    },
  });

  const form = useForm<WebCalloutFormValues>({
    resolver: zodResolver(webCalloutFormSchema),
    defaultValues: endpointToFormValues(props.endpoint),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  useEffect(() => {
    if (props.open) {
      form.reset(endpointToFormValues(props.endpoint));
    }
  }, [form, props.endpoint, props.open]);

  const onSubmit = (values: WebCalloutFormValues) => {
    upsertMutation.mutate({
      projectId: props.projectId,
      id: values.id,
      name: values.name,
      url: values.url,
      enabled: values.enabled,
      toastMessage: values.toastMessage,
      requestHeaders: formValuesToRequestHeaders(values),
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger}
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {props.endpoint ? t("integration.web-callouts.dialog-title-edit", "Edit Callout Endpoint") : t("integration.web-callouts.dialog-title-add", "Add Callout Endpoint")}
          </DialogTitle>
          <DialogDescription>
            {t("integration.web-callouts.dialog-desc", "Langfuse sends a backend JSON POST when a user clicks a web callout action.")}{" "}
            <a
              href="https://langfuse.com/docs/observability/features/web-callouts"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {t("integration.web-callouts.view-docs", "View docs")}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogBody className="min-h-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("integration.web-callouts.name-label", "Name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("integration.web-callouts.endpoint-url-label", "Endpoint URL")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("integration.web-callouts.endpoint-url-placeholder", "https://example.com/langfuse/callout")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("integration.web-callouts.endpoint-url-desc", "HTTP or HTTPS URL. Custom ports are allowed. The endpoint is called from the Langfuse backend.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>{t("integration.common.enabled", "Enabled")}</FormLabel>
                      <FormDescription>
                        {t("integration.web-callouts.enabled-desc", "Shows the callout action in trace, observation, and session detail headers.")}
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

              <FormField
                control={form.control}
                name="toastMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("integration.web-callouts.toast-message-label", "Toast message")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("integration.web-callouts.toast-message-desc", "Shown after the backend callout succeeds.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>{t("integration.web-callouts.headers-label", "Headers")}</FormLabel>
                <FormDescription className="mb-2">
                  {t("integration.web-callouts.headers-desc", "Optional headers added to the backend POST. Content-Type is set automatically. Leave values empty for existing header names to keep encrypted values.")}
                </FormDescription>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const currentHeaderName = form.watch(
                      `headers.${index}.name`,
                    );
                    const preservesExistingValue = hasExistingHeaderName(
                      props.endpoint,
                      currentHeaderName,
                    );

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`headers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={t("integration.web-callouts.header-name-placeholder", "Header name")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`headers.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={
                                    preservesExistingValue
                                      ? "***"
                                      : t("integration.web-callouts.header-value-placeholder", "Header value")
                                  }
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("integration.web-callouts.remove-header", "Remove header")}</TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    append({
                      name: "",
                      value: "",
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t("integration.web-callouts.add-header", "Add header")}
                </Button>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => props.onOpenChange(false)}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={upsertMutation.isPending}>
                {t("integration.web-callouts.save-endpoint", "Save endpoint")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEndpointButton(props: {
  endpoint: WebCalloutEndpoint;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("integration.web-callouts.delete-endpoint-tooltip", "Delete endpoint")}</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("integration.web-callouts.delete-dialog-title", "Delete Callout Endpoint")}</DialogTitle>
          <DialogDescription>
            {t("integration.web-callouts.delete-dialog-desc", "This removes the configured endpoint and hides the web callout action.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            loading={props.loading}
            onClick={() => {
              props.onDelete(props.endpoint.id);
              setOpen(false);
            }}
          >
            {t("integration.web-callouts.delete-endpoint-button", "Delete endpoint")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const endpointToFormValues = (
  endpoint: WebCalloutEndpoint | null,
): WebCalloutFormValues => ({
  id: endpoint?.id,
  name: endpoint?.name ?? "Default",
  url: endpoint?.url ?? "",
  enabled: endpoint?.enabled ?? true,
  toastMessage: endpoint?.toastMessage ?? "Callout sent",
  headers: (endpoint?.requestHeaderKeys ?? []).map((name) => ({
    name,
    value: "",
  })),
});

const formValuesToRequestHeaders = (
  values: WebCalloutFormValues,
): Record<string, string> =>
  Object.fromEntries(
    values.headers
      .filter((header) => header.name.trim())
      .map((header) => [header.name.trim(), header.value.trim()]),
  );

const hasExistingHeaderName = (
  endpoint: WebCalloutEndpoint | null,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return false;
  }

  return (
    endpoint?.requestHeaderKeys.some(
      (headerName) => headerName.toLowerCase() === normalizedName,
    ) ?? false
  );
};

export function WebCalloutIntegrationCard(props: {
  projectId: string;
  hasAccess: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="p-3">
      <div className="mb-4 flex items-center gap-2">
        <Webhook className="text-foreground h-5 w-5" />
        <span className="font-semibold">{t("integration.web-callouts.card-title", "Web Callouts")}</span>
      </div>
      <p className="text-primary mb-4 text-sm">
        {t("integration.web-callouts.card-description", "Send backend callouts from trace, observation, and session detail views to your own application.")}
      </p>
      <ActionButton
        variant="secondary"
        hasAccess={props.hasAccess}
        href={`/project/${props.projectId}/settings/integrations/web-callouts`}
      >
        {t("settings.integrations.configure", "Configure")}
      </ActionButton>
    </Card>
  );
}

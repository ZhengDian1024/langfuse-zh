import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import { Button } from "@/src/components/ui/button";
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
import { PasswordInput } from "@/src/components/ui/password-input";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  blobStorageIntegrationFormSchema,
  parquetEnabledFromTuning,
  type BlobStorageIntegrationFormSchema,
  type BlobStorageSyncStatus,
} from "@/src/features/blobstorage-integration/types";
import { deriveSyncStatus } from "@/src/features/blobstorage-integration/deriveSyncStatus";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/src/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import {
  BlobStorageIntegrationType,
  BlobStorageIntegrationFileType,
  BlobStorageExportMode,
  AnalyticsIntegrationExportSource,
  type BlobStorageIntegration,
  EXPORT_FIELD_GROUP_OPTIONS,
  OBSERVATION_FIELD_GROUPS_FULL,
  type ObservationFieldGroupFull,
  isLegacyBlobExportAllowed,
  isLegacyBlobExporter,
} from "@langfuse/shared";
import {
  getExportSourceFormValue,
  getExportSourceOptions,
  isExportSourceSelectable,
} from "@/src/features/blobstorage-integration/exportSource";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { useQueryProject } from "@/src/features/projects/hooks";
import { useI18n } from "@/src/features/i18n/useI18n";
import { Info, ExternalLink } from "lucide-react";

export default function BlobStorageIntegrationSettings() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "integrations:CRUD",
  });
  const state = api.blobStorageIntegration.get.useQuery(
    { projectId },
    {
      enabled: hasAccess,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 50 * 60 * 1000, // 50 minutes
      refetchInterval: (query) => {
        const cfg = query.state.data?.config;
        if (!cfg) return false;
        const status = deriveSyncStatus({
          enabled: cfg.enabled,
          lastError: cfg.lastError,
          lastSyncAt: cfg.lastSyncAt ? new Date(cfg.lastSyncAt) : null,
          nextSyncAt: cfg.nextSyncAt ? new Date(cfg.nextSyncAt) : null,
          runStartedAt: cfg.runStartedAt ? new Date(cfg.runStartedAt) : null,
        });
        return status === "running" || status === "queued" ? 5_000 : false;
      },
    },
  );

  const syncStatus =
    state.isLoading || !hasAccess || !state.data?.config
      ? undefined
      : deriveSyncStatus({
          enabled: state.data.config.enabled,
          lastError: state.data.config.lastError,
          lastSyncAt: state.data.config.lastSyncAt
            ? new Date(state.data.config.lastSyncAt)
            : null,
          nextSyncAt: state.data.config.nextSyncAt
            ? new Date(state.data.config.nextSyncAt)
            : null,
          runStartedAt: state.data.config.runStartedAt
            ? new Date(state.data.config.runStartedAt)
            : null,
        });

  const syncStatusToBadge: Record<BlobStorageSyncStatus, string> = {
    up_to_date: "active",
    running: "running",
    queued: "queued",
    idle: "pending",
    disabled: "disabled",
    error: "error",
  };

  return (
    <ContainerPage
      headerProps={{
        title: t("integration.page.blobstorage.title", "Blob Storage Integration"),
        breadcrumb: [
          { name: t("breadcrumb.settings", "Settings"), href: `/project/${projectId}/settings` },
        ],
        actionButtonsLeft: (
          <>
            {syncStatus && <StatusBadge type={syncStatusToBadge[syncStatus]} />}
          </>
        ),
        actionButtonsRight: (
          <Button asChild variant="secondary">
            <Link
              href="https://langfuse.com/docs/api-and-data-platform/features/export-to-blob-storage"
              target="_blank"
            >
              {t("settings.integrations.docs", "Integration Docs ↗")}
            </Link>
          </Button>
        ),
      }}
    >
      <p className="text-primary mb-4 text-sm">
        {t(
          "integration.blobstorage.description",
          "Configure scheduled exports of your trace data to AWS S3, S3-compatible storages, or Azure Blob Storage. Set up a hourly, daily, or weekly export to your own storage for data analysis or backup purposes. Use the “Validate” button to test your configuration by uploading a small test file, and the “Run Now” button to trigger an immediate export.",
        )}
      </p>
      {!hasAccess && (
        <p className="text-sm">
          {t(
            "integration.common.no-access",
            "Your current role does not grant you access to these settings, please reach out to your project admin or owner.",
          )}
        </p>
      )}
      {state.data?.config && (
        <>
          <Header title={t("integration.common.status", "Status")} />
          {state.data.config.lastError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t("integration.common.last-export-failed", "Last export failed")}</AlertTitle>
              <AlertDescription>
                {state.data.config.lastError}
                {state.data.config.lastErrorAt && (
                  <>
                    <br />
                    <span className="text-xs opacity-70">
                      {new Date(state.data.config.lastErrorAt).toLocaleString()}
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Card className="p-3">
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">{t("integration.common.data-exported-up-to", "Data exported up to")}</span>
              <span>
                {state.data.config.lastSyncAt
                  ? new Date(state.data.config.lastSyncAt).toLocaleString()
                  : t("integration.common.never-pending", "Never (pending)")}
              </span>
              {state.data.config.nextSyncAt && (
                <>
                  <span className="text-muted-foreground">
                    {t("integration.common.next-export-scheduled", "Next export scheduled")}
                  </span>
                  <span>
                    {new Date(state.data.config.nextSyncAt).toLocaleString()}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">{t("integration.common.export-mode", "Export mode")}</span>
              <span>
                {state.data.config.exportMode ===
                BlobStorageExportMode.FULL_HISTORY
                  ? t("integration.common.export-mode-full-history", "Full history")
                  : state.data.config.exportMode ===
                      BlobStorageExportMode.FROM_TODAY
                    ? t("integration.common.export-mode-from-setup", "From setup date")
                    : state.data.config.exportMode ===
                        BlobStorageExportMode.FROM_CUSTOM_DATE
                      ? t("integration.common.export-mode-from-custom", "From custom date")
                      : t("integration.common.export-mode-unknown", "Unknown")}
              </span>
              {(state.data.config.exportMode ===
                BlobStorageExportMode.FROM_CUSTOM_DATE ||
                state.data.config.exportMode ===
                  BlobStorageExportMode.FROM_TODAY) &&
                state.data.config.exportStartDate && (
                  <>
                    <span className="text-muted-foreground">
                      {t("integration.common.export-start-date", "Export start date")}
                    </span>
                    <span>
                      {new Date(
                        state.data.config.exportStartDate,
                      ).toLocaleDateString()}
                    </span>
                  </>
                )}
            </div>
          </Card>
        </>
      )}
      {hasAccess && (
        <>
          <Header title={t("integration.common.configuration", "Configuration")} className="mt-8" />
          <Card className="p-3">
            <BlobStorageIntegrationSettingsForm
              state={state.data?.config || undefined}
              projectId={projectId}
              isLoading={state.isLoading}
              isEnrichedExportAvailable={
                state.data?.isEnrichedExportAvailable ?? false
              }
            />
          </Card>
        </>
      )}
    </ContainerPage>
  );
}

const BlobStorageIntegrationSettingsForm = ({
  state,
  projectId,
  isLoading,
  isEnrichedExportAvailable,
}: {
  state?: Partial<BlobStorageIntegration>;
  projectId: string;
  isLoading: boolean;
  isEnrichedExportAvailable: boolean;
}) => {
  const capture = usePostHogClientCapture();
  const { t } = useI18n();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const { project } = useQueryProject();

  // Check if this is a self-hosted instance (no cloud region set)
  const isSelfHosted = !isLangfuseCloud;

  const isPostCutoffCloud =
    project?.createdAt != null &&
    !isLegacyBlobExportAllowed(new Date(project.createdAt), isLangfuseCloud);
  const eventsExportAvailable = isEnrichedExportAvailable;
  // Integration-level cutoff (Cloud only): a row predating the exporter cutoff
  // keeps legacy options; a new or post-cutoff row is locked to EVENTS.
  const isLegacyExporter = isLegacyBlobExporter(
    state?.createdAt ? new Date(state.createdAt) : null,
    isLangfuseCloud,
  );
  const forceEventsExport =
    isPostCutoffCloud || (eventsExportAvailable && !isLegacyExporter);
  const availability = useMemo(
    () => ({ eventsExportAvailable, forceEventsExport }),
    [eventsExportAvailable, forceEventsExport],
  );

  // Block the save when the persisted source is no longer selectable rather
  // than silently rewriting it (LFE-10296).
  const formSchema = useMemo(
    () =>
      blobStorageIntegrationFormSchema.superRefine((data, ctx) => {
        if (!isExportSourceSelectable(data.exportSource, availability)) {
          ctx.addIssue({
            code: "custom",
            path: ["exportSource"],
            message:
              "This export source is not available on this deployment. Select an available export source to save.",
          });
        }
      }),
    [availability],
  );

  const blobStorageForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: state?.type || BlobStorageIntegrationType.S3,
      bucketName: state?.bucketName || "",
      endpoint: state?.endpoint || null,
      region: state?.region || "",
      accessKeyId: state?.accessKeyId || "",
      secretAccessKey: state?.secretAccessKey || null,
      prefix: state?.prefix || "",
      exportFrequency: (state?.exportFrequency || "daily") as
        | "every_20_minutes"
        | "daily"
        | "weekly"
        | "hourly",
      enabled: state?.enabled || false,
      forcePathStyle: state?.forcePathStyle || false,
      fileType: state?.fileType || BlobStorageIntegrationFileType.JSONL,
      exportMode: state?.exportMode || BlobStorageExportMode.FULL_HISTORY,
      exportStartDate: state?.exportStartDate || null,
      exportSource: getExportSourceFormValue(state?.exportSource, availability),
      // Empty array in the DB means "export everything" (the worker falls back
      // to all groups), so surface it as the full selection in the form.
      exportFieldGroups: state?.exportFieldGroups?.length
        ? (state.exportFieldGroups as ObservationFieldGroupFull[])
        : [...OBSERVATION_FIELD_GROUPS_FULL],
      compressed: state?.compressed ?? true,
    },
    disabled: isLoading,
  });

  const integrationType =
    blobStorageForm.watch("type") ?? BlobStorageIntegrationType.S3;

  useEffect(() => {
    blobStorageForm.reset(
      {
        type: state?.type || BlobStorageIntegrationType.S3,
        bucketName: state?.bucketName || "",
        endpoint: state?.endpoint || null,
        region: state?.region || "auto",
        accessKeyId: state?.accessKeyId || "",
        secretAccessKey: state?.secretAccessKey || null,
        prefix: state?.prefix || "",
        exportFrequency: (state?.exportFrequency || "daily") as
          | "every_20_minutes"
          | "daily"
          | "weekly"
          | "hourly",
        enabled: state?.enabled || false,
        forcePathStyle: state?.forcePathStyle || false,
        fileType: state?.fileType || BlobStorageIntegrationFileType.JSONL,
        exportMode: state?.exportMode || BlobStorageExportMode.FULL_HISTORY,
        exportStartDate: state?.exportStartDate || null,
        exportSource: getExportSourceFormValue(
          state?.exportSource,
          availability,
        ),
        // Empty array in the DB means "export everything" (the worker falls back
        // to all groups), so surface it as the full selection in the form.
        exportFieldGroups: state?.exportFieldGroups?.length
          ? (state.exportFieldGroups as ObservationFieldGroupFull[])
          : [...OBSERVATION_FIELD_GROUPS_FULL],
        compressed: state?.compressed ?? true,
      },
      state ? { keepDirtyValues: true } : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, availability]);

  const watchedExportMode = blobStorageForm.watch("exportMode");
  const watchedExportSource = blobStorageForm.watch("exportSource");
  // Internal `exportTuning.parquet` override (no write path); reflected read-only
  // below since the worker forces Parquet over the persisted fileType + gzip.
  const isParquetOverride = parquetEnabledFromTuning(state?.exportTuning);
  const exportSourceOptions = getExportSourceOptions(
    state?.exportSource,
    availability,
  );
  // Visible but locked when there is only one selectable option.
  const exportSourceLocked = exportSourceOptions.length === 1;
  const exportSourceUnavailable =
    watchedExportSource != null &&
    !isExportSourceSelectable(watchedExportSource, availability);
  // The legacy observations table contains fewer columns than the enriched
  // observations, so the per-group field lists differ for legacy-only exports.
  const isLegacyOnlyExport =
    watchedExportSource ===
    AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS;
  // Traces and legacy observations are only exported for the legacy and mixed
  // sources; an EVENTS-only export produces scores and enriched observations.
  const includesLegacyExport =
    watchedExportSource ===
      AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS ||
    watchedExportSource ===
      AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS_EVENTS;

  const utils = api.useUtils();
  const mut = api.blobStorageIntegration.update.useMutation({
    onSuccess: () => {
      utils.blobStorageIntegration.invalidate();
    },
    onError: (error) => {
      showErrorToast(t("integration.common.save-failed", "Failed to save integration"), error.message);
    },
  });
  const mutDelete = api.blobStorageIntegration.delete.useMutation({
    onSuccess: () => {
      utils.blobStorageIntegration.invalidate();
    },
  });
  const mutRunNow = api.blobStorageIntegration.runNow.useMutation({
    onSuccess: () => {
      utils.blobStorageIntegration.invalidate();
    },
  });
  const mutValidate = api.blobStorageIntegration.validate.useMutation({
    onSuccess: (data) => {
      showSuccessToast({
        title: data.message,
        description: t("integration.common.test-file-prefix", "Test file: {name}", {
          name: data.testFileName,
        }),
      });
    },
    onError: (error) => {
      showErrorToast(t("integration.common.validation-failed", "Validation failed"), error.message);
    },
  });

  async function onSubmit(values: BlobStorageIntegrationFormSchema) {
    capture("integrations:blob_storage_form_submitted");
    mut.mutate({
      projectId,
      ...values,
    });
  }

  const handleIntegrationTypeChange = (value: BlobStorageIntegrationType) => {
    blobStorageForm.setValue("type", value, { shouldDirty: true });
  };

  return (
    <Form {...blobStorageForm}>
      <form
        className="space-y-3"
        onSubmit={blobStorageForm.handleSubmit(onSubmit)}
      >
        <FormField
          control={blobStorageForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.storage-provider-label", "Storage Provider")}</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    handleIntegrationTypeChange(
                      value as BlobStorageIntegrationType,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("integration.blobstorage.storage-provider-placeholder", "Select provider")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S3">{t("integration.blobstorage.s3", "AWS S3")}</SelectItem>
                    <SelectItem value="S3_COMPATIBLE">
                      {t("integration.blobstorage.s3-compatible", "S3 Compatible Storage")}
                    </SelectItem>
                    <SelectItem value="AZURE_BLOB_STORAGE">
                      {t("integration.blobstorage.azure-blob-storage", "Azure Blob Storage")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {t("integration.blobstorage.storage-provider-desc", "Choose your cloud storage provider")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="bucketName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.container-name", "Container Name")
                  : t("integration.blobstorage.bucket-name", "Bucket Name")}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.container-name-desc", "Azure container name (3-63 chars, lowercase letters, numbers, and hyphens only)")
                  : t("integration.blobstorage.bucket-name-desc", "The S3 bucket name")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endpoint URL field - Only shown for S3-compatible and Azure */}
        {integrationType !== "S3" && (
          <FormField
            control={blobStorageForm.control}
            name="endpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("integration.blobstorage.endpoint-url-label", "Endpoint URL")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  {integrationType === "AZURE_BLOB_STORAGE"
                    ? t("integration.blobstorage.endpoint-azure-desc", "Azure Blob Storage endpoint URL (e.g., https://accountname.blob.core.windows.net)")
                    : t("integration.blobstorage.endpoint-s3-desc", "S3 compatible endpoint URL (e.g., https://play.min.io)")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Region field - Only shown for AWS S3 or compatible storage */}
        {integrationType !== "AZURE_BLOB_STORAGE" && (
          <FormField
            control={blobStorageForm.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("integration.blobstorage.region-label", "Region")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  {integrationType === "S3"
                    ? t("integration.blobstorage.region-s3-desc", "AWS region (e.g., us-east-1)")
                    : t("integration.blobstorage.region-s3-compatible-desc", "S3 compatible storage region")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Force Path Style switch - Only shown for S3-compatible */}
        {integrationType === "S3_COMPATIBLE" && (
          <FormField
            control={blobStorageForm.control}
            name="forcePathStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("integration.blobstorage.force-path-style-label", "Force Path Style")}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 ml-4"
                  />
                </FormControl>
                <FormDescription>
                  {t("integration.blobstorage.force-path-style-desc", "Enable for MinIO and some other S3 compatible providers")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={blobStorageForm.control}
          name="accessKeyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.azure-account-name", "Storage Account Name")
                  : integrationType === "S3"
                    ? t("integration.blobstorage.aws-access-key-id", "AWS Access Key ID")
                    : t("integration.blobstorage.access-key-id", "Access Key ID")}
                {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
                {isSelfHosted && integrationType === "S3" && (
                  <span className="text-muted-foreground">{t("integration.blobstorage.access-key-optional-suffix", " (optional)")}</span>
                )}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.azure-account-name-desc", "Your Azure storage account name")
                  : integrationType === "S3"
                    ? isSelfHosted
                      ? t("integration.blobstorage.aws-access-key-id-self-hosted-desc", "Your AWS IAM user access key ID. Leave empty to use host credentials (IAM roles, instance profiles, etc.)")
                      : t("integration.blobstorage.aws-access-key-id-desc", "Your AWS IAM user access key ID")
                    : t("integration.blobstorage.access-key-s3-compatible-desc", "Access key for your S3-compatible storage")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="secretAccessKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.azure-account-key", "Storage Account Key")
                  : integrationType === "S3"
                    ? t("integration.blobstorage.aws-secret-access-key", "AWS Secret Access Key")
                    : t("integration.blobstorage.secret-access-key", "Secret Access Key")}
                {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
                {isSelfHosted && integrationType === "S3" && (
                  <span className="text-muted-foreground">{t("integration.blobstorage.access-key-optional-suffix", " (optional)")}</span>
                )}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="********************"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.azure-account-key-desc", "Your Azure storage account access key")
                  : integrationType === "S3"
                    ? isSelfHosted
                      ? t("integration.blobstorage.aws-secret-access-key-self-hosted-desc", "Your AWS IAM user secret access key. Leave empty to use host credentials (IAM roles, instance profiles, etc.)")
                      : t("integration.blobstorage.aws-secret-access-key-desc", "Your AWS IAM user secret access key")
                    : t("integration.blobstorage.secret-access-key-s3-compatible-desc", "Secret key for your S3-compatible storage")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.export-prefix-label", "Export Prefix")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("integration.blobstorage.export-prefix-azure-desc", "Optional prefix path for exported files in your Azure container (e.g., “langfuse-exports/”)")
                  : integrationType === "S3"
                    ? t("integration.blobstorage.export-prefix-s3-desc", "Optional prefix path for exported files in your S3 bucket (e.g., “langfuse-exports/”)")
                    : t("integration.blobstorage.export-prefix-s3-compatible-desc", "Optional prefix path for exported files (e.g., “langfuse-exports/”)")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="exportFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.export-frequency-label", "Export Frequency")}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("integration.blobstorage.export-frequency-placeholder", "Select frequency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every_20_minutes">
                      {t("integration.blobstorage.export-frequency-every-20-minutes", "Every 20 Minutes")}
                    </SelectItem>
                    <SelectItem value="hourly">{t("integration.blobstorage.export-frequency-hourly", "Hourly")}</SelectItem>
                    <SelectItem value="daily">{t("integration.blobstorage.export-frequency-daily", "Daily")}</SelectItem>
                    <SelectItem value="weekly">{t("integration.blobstorage.export-frequency-weekly", "Weekly")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {t("integration.blobstorage.export-frequency-desc", "How often the data should be exported. Changes are taken into consideration from the next run onwards.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="fileType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.file-type-label", "File Type")}</FormLabel>
              <FormControl>
                {/* "PARQUET" is display-only; the persisted fileType is kept but ignored. */}
                <Select
                  value={isParquetOverride ? "PARQUET" : field.value}
                  onValueChange={field.onChange}
                  disabled={isParquetOverride}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("integration.blobstorage.file-type-placeholder", "Select file type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSONL">JSONL</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                    {isParquetOverride && (
                      <SelectItem value="PARQUET">Parquet</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {isParquetOverride
                  ? t("integration.blobstorage.file-type-parquet-desc", "Exporting as Apache Parquet — a columnar binary format encoded and compressed by ClickHouse. This is configured for your project and overrides the file type; gzip compression is not applicable.")
                  : t("integration.blobstorage.file-type-desc", "The file format for exported data.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="exportMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.export-mode-label", "Export Mode")}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("integration.blobstorage.export-mode-placeholder", "Select export mode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BlobStorageExportMode.FULL_HISTORY}>
                      {t("integration.blobstorage.export-mode-full-history", "Full history")}
                    </SelectItem>
                    <SelectItem value={BlobStorageExportMode.FROM_TODAY}>
                      {t("integration.blobstorage.export-mode-today", "Today")}
                    </SelectItem>
                    <SelectItem value={BlobStorageExportMode.FROM_CUSTOM_DATE}>
                      {t("integration.blobstorage.export-mode-custom-date", "Custom date")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {t("integration.blobstorage.export-mode-desc", "Choose when to start exporting data. “Today” and “Custom date” modes will not include historical data before the specified date.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={blobStorageForm.control}
          name="exportSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 pt-2">
                {t("integration.common.export-source", "Export Source")}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[350px] space-y-2 p-3"
                  >
                    {exportSourceOptions.map((option) => (
                      <div key={option.value} className="space-y-0.5">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {option.description}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <a
                        href="https://langfuse.com/docs/integrations/export-sources"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        {t("integration.common.for-further-info", "For further information see")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={exportSourceLocked}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("integration.common.export-source-placeholder", "Select data to export")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exportSourceOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.unavailable}
                    >
                      {option.unavailable
                        ? `${option.label}${t("integration.blobstorage.export-source-not-available-suffix", " (not available on this deployment)")}`
                        : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t("integration.common.export-source-desc-blob", "Choose which data sources to export to blob storage. Scores are always included.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {exportSourceUnavailable && (
          <Alert variant="destructive">
            <AlertTitle>{t("integration.blobstorage.export-source-unavailable-title", "Saved export source is no longer available")}</AlertTitle>
            <AlertDescription>
              {/* Two distinct rejection reasons; key on the deployment, not the
                  source, since TRACES_OBSERVATIONS_EVENTS is both enriched and
                  legacy. !eventsExportAvailable means enriched is genuinely
                  unavailable; otherwise the block is the Cloud legacy cutoff. */}
              {!availability.eventsExportAvailable
                ? t("integration.blobstorage.export-source-unavailable-enriched-desc", "This integration is configured to export enriched observations, but enriched export is not available on this deployment. Saving is blocked until you select an available export source above. To keep the current configuration instead, re-enable enriched export (V4 preview opt-in) on your deployment.")
                : t("integration.blobstorage.export-source-unavailable-legacy-desc", "This integration is configured to export legacy traces and observations, which is no longer available for this project. Saving is blocked until you select an available export source above.")}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={blobStorageForm.control}
          name="exportFieldGroups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.blobstorage.export-field-groups-label", "Export Field Groups")}</FormLabel>
              <FormDescription>
                {t("integration.blobstorage.export-field-groups-desc", "Choose which field groups to include in the observation exports. Deselect large groups (e.g. Input / Output) to reduce export size, or privacy-sensitive groups (e.g. Metadata) to avoid storing user data.")}
                {includesLegacyExport
                  ? t("integration.blobstorage.export-field-groups-legacy-suffix", " Traces and scores are always exported in full. Fields that only exist on the enriched observations (e.g. Trace Context) are omitted from the legacy observations export.")
                  : t("integration.blobstorage.export-field-groups-events-suffix", " Scores are always exported in full.")}
              </FormDescription>
              <div className="mt-2 space-y-2">
                {EXPORT_FIELD_GROUP_OPTIONS.map((option) => {
                  const isCore = option.value === "core";
                  return (
                    <div key={option.value} className="flex items-start gap-2">
                      <Checkbox
                        id={`field-group-${option.value}`}
                        checked={
                          isCore
                            ? true
                            : (field.value ?? []).includes(option.value)
                        }
                        disabled={isCore}
                        onCheckedChange={
                          isCore
                            ? undefined
                            : (checked) => {
                                const current = field.value ?? [];
                                const next =
                                  checked === true
                                    ? current.includes(option.value)
                                      ? current
                                      : [...current, option.value]
                                    : current.filter(
                                        (v: ObservationFieldGroupFull) =>
                                          v !== option.value,
                                      );
                                field.onChange(next);
                              }
                        }
                      />
                      <label
                        htmlFor={`field-group-${option.value}`}
                        className={
                          isCore ? "space-y-0.5" : "cursor-pointer space-y-0.5"
                        }
                      >
                        <div className="text-sm leading-none font-medium">
                          {option.label}
                          {isCore && (
                            <span className="text-muted-foreground ml-1 font-normal">
                              {t("integration.blobstorage.export-field-groups-required-suffix", "(required)")}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {isParquetOverride
                            ? isLegacyOnlyExport
                              ? option.legacyParquetDescription
                              : option.parquetDescription
                            : isLegacyOnlyExport
                              ? option.legacyDescription
                              : option.description}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
              <FormMessage>
                {blobStorageForm.formState.errors.exportFieldGroups?.message}
              </FormMessage>
            </FormItem>
          )}
        />

        {watchedExportMode === BlobStorageExportMode.FROM_CUSTOM_DATE && (
          <FormField
            control={blobStorageForm.control}
            name="exportStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("integration.blobstorage.export-start-date-label", "Export Start Date")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={(() => {
                      const now = new Date();
                      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                    })()}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      field.onChange(date);
                    }}
                    placeholder={t("integration.blobstorage.export-start-date-placeholder", "Select start date")}
                  />
                </FormControl>
                <FormDescription>
                  {t("integration.blobstorage.export-start-date-desc", "Data before this date will not be included in exports")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Parquet compresses internally — gzip does not apply. */}
        {!isParquetOverride && (
          <FormField
            control={blobStorageForm.control}
            name="compressed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("integration.common.gzip-compression", "Gzip Compression")}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 ml-4"
                  />
                </FormControl>
                <FormDescription>
                  {t("integration.common.gzip-desc", "Compress exported files with gzip (.csv.gz, .json.gz, .jsonl.gz)")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={blobStorageForm.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integration.common.enabled", "Enabled")}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 ml-4"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
      <div className="mt-8 flex gap-2">
        <Button
          loading={mut.isPending}
          onClick={blobStorageForm.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {t("common.save", "Save")}
        </Button>
        <Button
          variant="secondary"
          loading={mutValidate.isPending}
          disabled={isLoading || !state}
          title={t("integration.common.validate-title", "Test your saved configuration by uploading a small test file to your storage")}
          onClick={() => {
            mutValidate.mutate({ projectId });
          }}
        >
          {t("integration.common.validate", "Validate")}
        </Button>
        <Button
          variant="secondary"
          loading={mutRunNow.isPending}
          disabled={isLoading || !state?.enabled}
          title={t("integration.common.run-now-title", "Trigger an immediate export of all data since the last sync")}
          onClick={() => {
            if (
              confirm(
                t("integration.common.confirm-run-now-blob", "Are you sure you want to run the blob storage export now? This will export all data since the last sync."),
              )
            )
              mutRunNow.mutate({ projectId });
          }}
        >
          {t("integration.common.run-now", "Run Now")}
        </Button>
        <Button
          variant="ghost"
          loading={mutDelete.isPending}
          disabled={isLoading || !!!state}
          onClick={() => {
            if (
              confirm(
                t("integration.common.confirm-reset-blob", "Are you sure you want to reset the Blob Storage integration for this project?"),
              )
            )
              mutDelete.mutate({ projectId });
          }}
        >
          {t("integration.common.reset", "Reset")}
        </Button>
      </div>
    </Form>
  );
};

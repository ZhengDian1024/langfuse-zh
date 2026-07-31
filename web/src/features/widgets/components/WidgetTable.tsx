import { useEffect } from "react";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { useOrderByState } from "@/src/features/orderBy/hooks/useOrderByState";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import { api } from "@/src/utils/api";
import { DataTable } from "@/src/components/table/data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { createColumnHelper } from "@tanstack/react-table";
import TableLink from "@/src/components/table/table-link";
import { LocalIsoDate } from "@/src/components/LocalIsoDate";
import { useDetailPageLists } from "@/src/features/navigate-detail-pages/context";
import startCase from "lodash/startCase";
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { Download, Trash } from "lucide-react";
import { useState } from "react";
import { downloadWidgetJson } from "@/src/features/widgets/utils/import-export-utils";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useRouter } from "next/router";
import { getChartTypeDisplayName } from "@/src/features/widgets/chart-library/utils";
import { type DashboardWidgetChartType } from "@langfuse/shared/src/db";
import { type metricAggregations } from "@langfuse/shared/query";
import { type z } from "zod";
import { useI18n } from "@/src/features/i18n/useI18n";

type WidgetTableRow = {
  id: string;
  name: string;
  description: string;
  view: string;
  chartType: string;
  createdAt: Date;
  updatedAt: Date;
  owner: "PROJECT" | "LANGFUSE";
};

export function DeleteWidget({
  widgetId,
  owner,
}: {
  widgetId: string;
  owner: "PROJECT" | "LANGFUSE";
}) {
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const hasAccess =
    useHasProjectAccess({ projectId, scope: "dashboards:CUD" }) &&
    owner !== "LANGFUSE";
  const capture = usePostHogClientCapture();
  const { t } = useI18n();

  const mutDeleteWidget = api.dashboardWidgets.delete.useMutation({
    onSuccess: () => {
      utils.dashboardWidgets.invalidate();
      capture("dashboard:delete_widget_form_open");
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        showErrorToast(
          t("widgets.toast.in-use-title", "Widget in use"),
          t("widgets.toast.in-use-description", "Widget is still in use. Please remove it from all dashboards before deleting it."),
        );
      } else {
        showErrorToast(t("widgets.toast.error-delete", "Failed to delete widget"), error.message);
      }
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!hasAccess}>
          <Trash className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-semibold">{t("widgets.delete.confirm-title", "Please confirm")}</h2>
        <p className="mb-3 text-sm">
          {t("widgets.delete.confirm-description", "This action permanently deletes this widget. If the widget is currently used in any dashboard, you will need to remove it from those dashboards first.")}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={mutDeleteWidget.isPending}
            onClick={() => {
              if (!projectId) {
                console.error("Project ID is missing");
                return;
              }

              mutDeleteWidget.mutate({
                projectId,
                widgetId,
              });
              setIsOpen(false);
            }}
          >
            {t("widgets.delete.button", "Delete Widget")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ShareWidgetButton({ widgetId }: { widgetId: string }) {
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useI18n();

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={!projectId}
      loading={isDownloading}
      onClick={async () => {
        if (!projectId) {
          return;
        }

        setIsDownloading(true);

        try {
          const widget = await utils.dashboardWidgets.get.fetch({
            projectId,
            widgetId,
          });

          downloadWidgetJson({
            name: widget.name,
            description: widget.description,
            view: widget.view,
            dimensions: widget.dimensions,
            metrics: widget.metrics.map((metric) => ({
              measure: metric.measure,
              agg: metric.agg as z.infer<typeof metricAggregations>,
            })),
            filters: widget.filters,
            chartType: widget.chartType,
            chartConfig: widget.chartConfig,
            minVersion: widget.minVersion,
          });
        } catch (error) {
          showErrorToast(
            t("widgets.toast.error-download", "Failed to download widget"),
            error instanceof Error ? error.message : t("widgets.toast.error-unknown", "Unknown error"),
          );
        } finally {
          setIsDownloading(false);
        }
      }}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}

export function DashboardWidgetTable() {
  const projectId = useProjectIdFromURL();
  const { isBetaEnabled } = useV4Beta();
  const { setDetailPageList } = useDetailPageLists();
  const router = useRouter();
  const { t } = useI18n();

  const [orderByState, setOrderByState] = useOrderByState({
    column: "updatedAt",
    order: "DESC",
  });
  const [paginationState, setPaginationState] = useQueryParams({
    pageIndex: withDefault(NumberParam, 0),
    pageSize: withDefault(NumberParam, 50),
  });

  const widgets = api.dashboardWidgets.all.useQuery(
    {
      page: paginationState.pageIndex,
      limit: paginationState.pageSize,
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      orderBy: orderByState,
    },
    {
      enabled: Boolean(projectId),
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  useEffect(() => {
    if (widgets.isSuccess) {
      setDetailPageList(
        "widgets",
        widgets.data?.widgets.map((w) => ({ id: w.id })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets.isSuccess, widgets.data]);

  const columnHelper = createColumnHelper<WidgetTableRow>();
  const widgetColumns = [
    columnHelper.accessor("name", {
      header: t("widgets.table.col-name", "Name"),
      id: "name",
      enableSorting: true,
      size: 200,
      cell: (row) => {
        const name = row.getValue();
        return name ? (
          <TableLink
            path={`/project/${projectId}/widgets/${encodeURIComponent(row.row.original.id)}`}
            value={name}
          />
        ) : undefined;
      },
    }),
    columnHelper.accessor("description", {
      header: t("widgets.table.col-description", "Description"),
      id: "description",
      size: 300,
      cell: (row) => {
        return row.getValue();
      },
    }),
    columnHelper.accessor("view", {
      header: t("widgets.table.col-view-type", "View Type"),
      id: "view",
      enableSorting: true,
      size: 100,
      cell: (row) => {
        return startCase(row.getValue().toLowerCase());
      },
    }),
    columnHelper.accessor("chartType", {
      header: t("widgets.table.col-chart-type", "Chart Type"),
      id: "chartType",
      enableSorting: true,
      size: 100,
      cell: (row) =>
        getChartTypeDisplayName(row.getValue() as DashboardWidgetChartType, t),
    }),
    columnHelper.accessor("createdAt", {
      header: t("widgets.table.col-created-at", "Created At"),
      id: "createdAt",
      enableSorting: true,
      size: 150,
      cell: (row) => {
        const createdAt = row.getValue();
        return <LocalIsoDate date={createdAt} />;
      },
    }),
    columnHelper.accessor("updatedAt", {
      header: t("widgets.table.col-updated-at", "Updated At"),
      id: "updatedAt",
      enableSorting: true,
      size: 150,
      cell: (row) => {
        const updatedAt = row.getValue();
        return <LocalIsoDate date={updatedAt} />;
      },
    }),
    columnHelper.display({
      id: "actions",
      header: t("widgets.table.col-actions", "Actions"),
      size: 70,
      cell: (row) => {
        const id = row.row.original.id;
        return (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isBetaEnabled && <ShareWidgetButton widgetId={id} />}
            <DeleteWidget widgetId={id} owner={row.row.original.owner} />
          </div>
        );
      },
    }),
  ] as LangfuseColumnDef<WidgetTableRow>[];

  return (
    <DataTable
      tableName={"widgets"}
      columns={widgetColumns}
      data={
        widgets.isLoading
          ? { isLoading: true, isError: false }
          : widgets.isError
            ? {
                isLoading: false,
                isError: true,
                error: widgets.error.message,
              }
            : {
                isLoading: false,
                isError: false,
                data: widgets.data?.widgets ?? [],
              }
      }
      orderBy={orderByState}
      setOrderBy={setOrderByState}
      cellPadding="comfortable"
      pagination={{
        totalCount: widgets.data?.totalCount ?? null,
        onChange: setPaginationState,
        state: paginationState,
      }}
      onRowClick={(row) => {
        router.push(
          `/project/${projectId}/widgets/${encodeURIComponent(row.id)}`,
        );
      }}
    />
  );
}

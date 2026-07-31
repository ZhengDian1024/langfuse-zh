import type { MessageKey } from "@/src/features/i18n/messages";

export const DASHBOARD_TABS = {
  DASHBOARDS: "dashboards",
  WIDGETS: "widgets",
} as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[keyof typeof DASHBOARD_TABS];

type TranslateFn = (
  key: MessageKey,
  defaultMessage?: string,
) => string;

export const getDashboardTabs = (
  projectId: string,
  t: TranslateFn,
) => [
  {
    value: DASHBOARD_TABS.DASHBOARDS,
    label: t("nav.dashboards", "Dashboards"),
    href: `/project/${projectId}/dashboards`,
  },
  {
    value: DASHBOARD_TABS.WIDGETS,
    label: t("nav.widgets", "Widgets"),
    href: `/project/${projectId}/widgets`,
  },
];

import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import Header from "@/src/components/layouts/header";
import { MembershipInvitesPage } from "@/src/features/rbac/components/MembershipInvitesPage";
import { MembersTable } from "@/src/features/rbac/components/MembersTable";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import RenameOrganization from "@/src/features/organizations/components/RenameOrganization";
import { useQueryOrganization } from "@/src/features/organizations/hooks";
import { useRouter } from "next/router";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import { DeleteOrganizationButton } from "@/src/features/organizations/components/DeleteOrganizationButton";
import { BillingSettings } from "@/src/ee/features/billing/components/BillingSettings";
import { useHasEntitlement, usePlan } from "@/src/features/entitlements/hooks";
import ContainerPage from "@/src/components/layouts/container-page";
import { SSOSettings } from "@/src/ee/features/sso-settings/components/SSOSettings";
import { isCloudPlan } from "@langfuse/shared";
import { useQueryProjectOrOrganization } from "@/src/features/projects/hooks";
import { ApiKeyList } from "@/src/features/public-api/components/ApiKeyList";
import AIFeatureSwitch from "@/src/features/organizations/components/AIFeatureSwitch";
import { useIsCloudBillingAvailable } from "@/src/ee/features/billing/utils/isCloudBilling";
import { env } from "@/src/env.mjs";
import { OrgAuditLogsSettingsPage } from "@/src/ee/features/audit-log-viewer/OrgAuditLogsSettingsPage";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { useI18n } from "@/src/features/i18n/useI18n";
import type { MessageKey } from "@/src/features/i18n/messages";

type TranslateFn = (key: MessageKey, defaultMessage?: string) => string;

type OrganizationSettingsPage = {
  title: string;
  slug: string;
  show?: boolean | (() => boolean);
  cmdKKeywords?: string[];
} & ({ content: React.ReactNode } | { href: string });

export function useOrganizationSettingsPages(): OrganizationSettingsPage[] {
  const { organization } = useQueryProjectOrOrganization();
  const { t } = useI18n();
  const showBillingSettings = useHasEntitlement("cloud-billing");
  const hasAdminApiEntitlement = useHasEntitlement("admin-api");
  const hasOrgApiKeyAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:CRUD_apiKeys",
  });
  const showOrgApiKeySettings = hasAdminApiEntitlement && hasOrgApiKeyAccess;
  const showAuditLogs = useHasEntitlement("audit-logs");
  const plan = usePlan();
  const isLangfuseCloud = isCloudPlan(plan) ?? false;
  const isCloudBillingAvailable = useIsCloudBillingAvailable();

  if (!organization) return [];

  return getOrganizationSettingsPages({
    organization,
    showBillingSettings: showBillingSettings && isCloudBillingAvailable,
    showOrgApiKeySettings,
    showAuditLogs,
    isLangfuseCloud,
    t,
  });
}

export const getOrganizationSettingsPages = ({
  organization,
  showBillingSettings,
  showOrgApiKeySettings,
  showAuditLogs,
  isLangfuseCloud,
  t,
}: {
  organization: { id: string; name: string; metadata: Record<string, unknown> };
  showBillingSettings: boolean;
  showOrgApiKeySettings: boolean;
  showAuditLogs: boolean;
  isLangfuseCloud: boolean;
  t: TranslateFn;
}): OrganizationSettingsPage[] => [
  {
    title: t("organization.settings.nav.general", "General"),
    slug: "index",
    cmdKKeywords: ["name", "id", "delete"],
    content: (
      <div className="flex flex-col gap-6">
        <RenameOrganization />
        <div>
          <Header title={t("organization.settings.debug-title", "Debug Information")} />
          <JSONView
            title={t("organization.settings.metadata-title", "Metadata")}
            json={{
              name: organization.name,
              id: organization.id,
              ...organization.metadata,
              ...(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION && {
                cloudRegion: env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
              }),
            }}
          />
        </div>
        <AIFeatureSwitch />
        <SettingsDangerZone
          items={[
            {
              title: t("organization.settings.delete-title", "Delete this organization"),
              description: t("organization.settings.delete-description", "Once you delete an organization, there is no going back. Please be certain."),
              button: <DeleteOrganizationButton />,
            },
          ]}
        />
      </div>
    ),
  },
  {
    title: t("organization.settings.nav.api-keys", "API Keys"),
    slug: "api-keys",
    content: (
      <div className="flex flex-col gap-6">
        <ApiKeyList entityId={organization.id} scope="organization" />
      </div>
    ),
    show: showOrgApiKeySettings,
  },
  {
    title: t("organization.settings.nav.members", "Members"),
    slug: "members",
    cmdKKeywords: ["invite", "user", "rbac"],
    content: (
      <div className="flex flex-col gap-6">
        <div>
          <Header title={t("organization.settings.members-title", "Organization Members")} />
          <MembersTable orgId={organization.id} />
        </div>
        <div>
          <MembershipInvitesPage orgId={organization.id} />
        </div>
      </div>
    ),
  },
  {
    title: t("organization.settings.nav.audit-logs", "Audit Logs"),
    slug: "audit-logs",
    cmdKKeywords: ["audit", "logs", "history", "changes"],
    content: <OrgAuditLogsSettingsPage orgId={organization.id} />,
    show: showAuditLogs,
  },
  {
    title: t("organization.settings.nav.billing", "Billing"),
    slug: "billing",
    cmdKKeywords: ["payment", "subscription", "plan", "invoice"],
    content: <BillingSettings />,
    show: showBillingSettings,
  },
  {
    title: t("organization.settings.nav.sso", "SSO"),
    slug: "sso",
    cmdKKeywords: [
      "sso",
      "login",
      "auth",
      "okta",
      "saml",
      "azure",
      "domain",
      "dns",
      "txt",
      "verify",
    ],
    content: <SSOSettings orgId={organization.id} />,
    show: isLangfuseCloud,
  },
  {
    title: t("organization.settings.nav.projects", "Projects"),
    slug: "projects",
    href: `/organization/${organization.id}`,
  },
];

const OrgSettingsPage = () => {
  const organization = useQueryOrganization();
  const router = useRouter();
  const { page } = router.query;
  const { t } = useI18n();
  const pages = useOrganizationSettingsPages();

  if (!organization) return null;

  return (
    <ContainerPage
      headerProps={{
        title: t("organization.settings.title", "Organization Settings"),
      }}
    >
      <PagedSettingsContainer
        activeSlug={page as string | undefined}
        pages={pages}
      />
    </ContainerPage>
  );
};

export default OrgSettingsPage;

import ContainerPage from "@/src/components/layouts/container-page";
import { WebCalloutSettingsPage } from "@/src/features/web-callouts/components/WebCalloutSettingsPage";
import { useI18n } from "@/src/features/i18n/useI18n";
import { useRouter } from "next/router";

export default function WebCalloutsSettings() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;

  if (!projectId) {
    return null;
  }

  return (
    <ContainerPage
      headerProps={{
        title: t("integration.page.web-callouts.title", "Web Callouts"),
        breadcrumb: [
          { name: t("breadcrumb.settings", "Settings"), href: `/project/${projectId}/settings` },
        ],
      }}
    >
      <WebCalloutSettingsPage projectId={projectId} />
    </ContainerPage>
  );
}

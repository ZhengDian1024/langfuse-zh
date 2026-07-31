import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { FlaskConical } from "lucide-react";
import { useExperimentAccess } from "@/src/features/experiments/hooks/useExperimentAccess";
import {
  EXPERIMENT_RUN_TABS,
  getExperimentRunTabs,
} from "@/src/features/navigation/utils/experiment-run-tabs";
import useSessionStorage from "@/src/components/useSessionStorage";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useEffect } from "react";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function ExperimentAnalytics() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const { isExperimentsBetaActive, isInitializing } = useExperimentAccess();

  const [lastResultsUrl] = useSessionStorage<string | null>(
    "experiment-results-url",
    null,
  );

  const handleResultsClick = () => {
    const fallbackUrl = `/project/${projectId}/experiments/results`;
    router.push(lastResultsUrl ?? fallbackUrl);
  };

  useEffect(() => {
    if (isInitializing || isExperimentsBetaActive || !projectId) return;

    router.replace(`/project/${projectId}/datasets`);
  }, [isExperimentsBetaActive, isInitializing, projectId, router]);

  if (!isExperimentsBetaActive) {
    return (
      <Page headerProps={{ title: t("experiments.analytics", "Analytics") }}>
        <div className="flex h-full items-center justify-center">
          <Spinner size="xl" variant="muted" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      headerProps={{
        title: t("experiments.analytics", "Analytics"),
        itemType: "EXPERIMENT",
        breadcrumb: [
          { name: t("nav.experiments", "Experiments"), href: `/project/${projectId}/experiments` },
        ],
        tabsProps: {
          tabs: getExperimentRunTabs(projectId, handleResultsClick),
          activeTab: EXPERIMENT_RUN_TABS.ANALYTICS,
        },
      }}
    >
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="border-border bg-card/50 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center shadow-sm backdrop-blur-sm">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <FlaskConical className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              {t("experiments.analytics-coming-soon", "Analytics Coming Soon")}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("experiments.analytics-coming-soon-desc", "We are working on adding advanced analytics capabilities for experiments.")}
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}

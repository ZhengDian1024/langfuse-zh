import { useRouter } from "next/router";
import ScoresTable from "@/src/components/table/use-cases/scores";
import Page from "@/src/components/layouts/page";
import { api } from "@/src/utils/api";
import { useI18n } from "@/src/features/i18n/useI18n";
import { ScoresOnboarding } from "@/src/components/onboarding/ScoresOnboarding";
import {
  getScoresTabs,
  SCORES_TABS,
} from "@/src/features/navigation/utils/scores-tabs";

export default function ScoresPage() {
  const router = useRouter();
  const { t } = useI18n();
  const projectId = router.query.projectId as string;

  // Check if the user has any scores
  const { data: hasAnyScore, isLoading } = api.scores.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchInterval: 10_000,
    },
  );

  const showOnboarding = !isLoading && !hasAnyScore;

  return (
    <Page
      headerProps={{
        title: t("scores.page-title", "Scores"),
        help: {
          description: t(
            "scores.help",
            "A score is an evaluation of a trace or observation. It can be created from user feedback, model-based evaluations, or manual review. See docs to learn more.",
          ),
          href: "https://langfuse.com/docs/evaluation/overview",
        },
        tabsProps: {
          tabs: getScoresTabs(projectId, t),
          activeTab: SCORES_TABS.SCORES,
        },
      }}
      scrollable={showOnboarding}
    >
      {/* Show onboarding screen if user has no scores */}
      {showOnboarding ? (
        <ScoresOnboarding />
      ) : (
        <ScoresTable projectId={projectId} />
      )}
    </Page>
  );
}

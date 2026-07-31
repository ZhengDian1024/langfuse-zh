import { useRouter } from "next/router";
import { DatasetsTable } from "@/src/features/datasets/components/DatasetsTable";
import Page from "@/src/components/layouts/page";
import { DatasetActionButton } from "@/src/features/datasets/components/DatasetActionButton";
import { api } from "@/src/utils/api";
import { DatasetsOnboarding } from "@/src/components/onboarding/DatasetsOnboarding";
import { useQueryParam, StringParam } from "use-query-params";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function Datasets() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [currentFolderPath] = useQueryParam("folder", StringParam);

  // Check if the project has any datasets
  const { data: hasAnyDataset, isLoading } = api.datasets.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  const showOnboarding = !isLoading && !hasAnyDataset;

  if (showOnboarding) {
    return (
      <Page
        headerProps={{
          title: t("nav.datasets", "Datasets"),
          help: {
            description: t(
              "datasets.page.help",
              "Datasets in Langfuse are a collection of inputs (and expected outputs) of an LLM application. They are used to benchmark new releases before deployment to production. See docs to learn more.",
            ),
            href: "https://langfuse.com/docs/evaluation/dataset-runs/datasets",
          },
        }}
        scrollable
      >
        <DatasetsOnboarding projectId={projectId} />
      </Page>
    );
  }

  return (
    <Page
      headerProps={{
        title: "Datasets",
        help: {
          description:
            "Datasets in Langfuse are a collection of inputs (and expected outputs) of an LLM application. They are used to benchmark new releases before deployment to production. See docs to learn more.",
          href: "https://langfuse.com/docs/evaluation/dataset-runs/datasets",
        },
        actionButtonsRight: (
          <DatasetActionButton
            projectId={projectId}
            mode="create"
            folderPrefix={currentFolderPath || undefined}
          />
        ),
      }}
    >
      <DatasetsTable projectId={projectId} />
    </Page>
  );
}

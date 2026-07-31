import Page from "@/src/components/layouts/page";
import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { SupportOrUpgradePage } from "@/src/ee/features/billing/components/SupportOrUpgradePage";
import { DefaultEvalModelSetup } from "@/src/features/evals/components/default-eval-model-setup";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function DefaultEvaluationModelPage() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasReadAccess = useHasProjectAccess({
    projectId,
    scope: "evalDefaultModel:read",
  });

  if (!hasReadAccess) {
    return <SupportOrUpgradePage />;
  }

  return (
    <Page
      withPadding
      headerProps={{
        title: t(
          "evals.default-eval-model-page.title",
          "Default Evaluation Model",
        ),
        help: {
          description: t(
            "evals.default-eval-model-page.help",
            "Configure a default evaluation model for your project.",
          ),
          href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
        },
        breadcrumb: [
          {
            name: t(
              "evals.template-detail.breadcrumb-library",
              "Evaluator Library",
            ),
            href: `/project/${projectId}/evals/templates`,
          },
        ],
      }}
    >
      <DefaultEvalModelSetup projectId={projectId} />
    </Page>
  );
}

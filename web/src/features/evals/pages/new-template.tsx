import Page from "@/src/components/layouts/page";
import { EvalTemplateForm } from "@/src/features/evals/components/template-form";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useRouter } from "next/router";
import { useI18n } from "@/src/features/i18n/useI18n";

export default function NewTemplatesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "evalTemplate:read",
  });

  if (!hasAccess) {
    return null;
  }

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: t("evals.new-template.title", "Create custom evaluator"),
        breadcrumb: [
          {
            name: t("breadcrumb.evaluators", "Evaluators"),
            href: `/project/${projectId}/evals/templates`,
          },
        ],
      }}
    >
      <EvalTemplateForm
        projectId={projectId}
        isEditing={true}
        useDialog={false}
      />
    </Page>
  );
}

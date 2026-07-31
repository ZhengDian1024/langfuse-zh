import { CardContent } from "@/src/components/ui/card";
import { Card } from "@/src/components/ui/card";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";
import { useI18n } from "@/src/features/i18n/useI18n";

export function SetupDefaultEvalModelCard({
  projectId,
}: {
  projectId: string;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-dark-yellow bg-light-yellow mt-2">
      <CardContent className="mt-2 flex flex-col gap-1">
        <ManageDefaultEvalModel
          projectId={projectId}
          setUpMessage={
            <>
              {t(
                "evals.default-model-card.no-default",
                "No default model set. LLM-as-a-judge evaluations require an LLM connection for scoring. This default is used by all templates that don't specify their own model.",
              )}{" "}
              <a
                href="https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge#how-llm-as-a-judge-works"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t("evals.template.learn-more", "Learn more.")}
              </a>
            </>
          }
          variant="color-coded"
        />
        <p className="text-dark-yellow/70 text-xs">
          {t(
            "evals.default-model-card.expects-default",
            "This evaluator expects to use the default evaluation model for your project.",
          )}
        </p>
      </CardContent>
    </Card>
  );
}

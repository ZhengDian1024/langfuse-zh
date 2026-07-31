import Header from "@/src/components/layouts/header";
import ModelTable from "@/src/components/table/use-cases/models";
import { useI18n } from "@/src/features/i18n/useI18n";

export function ModelsSettings(props: { projectId: string }) {
  const { t } = useI18n();
  return (
    <>
      <Header title={t("models.settings.title", "Model Definitions")} />
      <p className="mb-2 text-sm">
        {t(
          "models.settings.description",
          "A configuration that stores pricing information for an LLM model. Model definitions specify the cost per input and output token, enabling Langfuse to automatically calculate the price of generations based on token usage.",
        )}
      </p>
      <ModelTable projectId={props.projectId} />
    </>
  );
}

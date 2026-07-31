import React from "react";
import { FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { TemplateSelector } from "@/src/features/evals/components/template-selector";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { type EvaluatorsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useI18n } from "@/src/features/i18n/useI18n";

export const EvaluatorsStep: React.FC<EvaluatorsStepProps> = ({
  projectId,
  datasetId,
  evaluatorState,
  permissions,
}) => {
  const { t } = useI18n();
  const {
    evalTemplates,
    activeEvaluators,
    pausedEvaluators,
    evaluatorTargetObjects,
    selectedEvaluatorData,
    showEvaluatorForm,
    handleConfigureEvaluator,
    handleSelectEvaluator,
    handleCloseEvaluatorForm,
    handleEvaluatorSuccess,
    handleEvaluatorToggled,
    preprocessFormValues,
  } = evaluatorState;
  const { hasEvalReadAccess, hasEvalWriteAccess } = permissions;
  return (
    <div className="space-y-6">
      <StepHeader
        title={t("experiments.evaluators-step.title", "Evaluators (Optional)")}
        description={t(
          "experiments.evaluators-step.description",
          "Configure evaluators to automatically score experiment results. You can add multiple evaluators to assess different aspects of your LLM outputs.",
        )}
      />

      <FormItem>
        <FormLabel>{t("experiments.evaluators-step.select", "Select Evaluators")}</FormLabel>
        {hasEvalReadAccess && datasetId ? (
          <TemplateSelector
            projectId={projectId}
            datasetId={datasetId}
            evalTemplates={evalTemplates}
            onConfigureTemplate={handleConfigureEvaluator}
            onSelectEvaluator={handleSelectEvaluator}
            onEvaluatorToggled={handleEvaluatorToggled}
            activeTemplateIds={activeEvaluators}
            inactiveTemplateIds={pausedEvaluators}
            evaluatorTargetObjects={evaluatorTargetObjects}
            disabled={!hasEvalWriteAccess}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            {!hasEvalReadAccess
              ? t("experiments.evaluators-step.no-permission", "You don't have permission to manage evaluators")
              : t("experiments.evaluators-step.select-dataset-first", "Please select a dataset first to configure evaluators")}
          </p>
        )}
        <FormMessage />
      </FormItem>

      {/* Dialog for configuring evaluators */}
      {selectedEvaluatorData && (
        <Dialog
          open={showEvaluatorForm}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseEvaluatorForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-(--breakpoint-md) overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEvaluatorData.evaluator.id
                  ? t("experiments.evaluators-step.edit-evaluator", "Edit Evaluator")
                  : t("experiments.evaluators-step.configure-evaluator", "Configure Evaluator")}
              </DialogTitle>
            </DialogHeader>
            <EvaluatorForm
              useDialog={true}
              projectId={projectId}
              evalTemplates={evalTemplates}
              templateId={selectedEvaluatorData.templateId}
              existingEvaluator={selectedEvaluatorData.evaluator}
              mode={selectedEvaluatorData.evaluator.id ? "edit" : "create"}
              hideTargetSection={!selectedEvaluatorData.evaluator.id}
              onFormSuccess={handleEvaluatorSuccess}
              preprocessFormValues={preprocessFormValues}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

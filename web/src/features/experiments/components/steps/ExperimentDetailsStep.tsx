import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { type ExperimentDetailsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useI18n } from "@/src/features/i18n/useI18n";

export const ExperimentDetailsStep: React.FC<ExperimentDetailsStepProps> = ({
  formState,
}) => {
  const { t } = useI18n();
  const { form } = formState;
  return (
    <div className="space-y-6">
      <StepHeader
        title={t("experiments.details-step.title", "Experiment Run Details")}
        description={t(
          "experiments.details-step.description",
          "Provide a name and optional description for your experiment to help identify and track it.",
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("experiments.details-step.experiment-name", "Experiment name")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("experiments.details-step.name-placeholder", "Enter experiment name")}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("experiments.details-step.description-optional", "Description (optional)")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t("experiments.details-step.desc-placeholder", "Describe the purpose or context of this experiment")}
                className="min-h-[100px] w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

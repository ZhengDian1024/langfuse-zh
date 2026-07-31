import { PlusCircle, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { FormUpsertModel } from "../../validation";
import { useI18n } from "@/src/features/i18n/useI18n";

type TierConditionsEditorProps = {
  tierIndex: number;
  form: UseFormReturn<FormUpsertModel>;
};

export type { TierConditionsEditorProps };

export function TierConditionsEditor({
  tierIndex,
  form,
}: TierConditionsEditorProps) {
  const { t } = useI18n();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `pricingTiers.${tierIndex}.conditions`,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>{t("models.form.label-conditions", "Conditions")}</FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append({
              usageDetailPattern: "",
              operator: "gt",
              value: 0,
              caseSensitive: false,
            })
          }
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          {t("models.action.add-condition", "Add Condition")}
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <strong>{t("models.form.warning-no-conditions", "Non-default tiers require at least one condition. This tier will fail validation.")}</strong>
        </div>
      )}

      {fields.map((condition, conditionIndex) => (
        <div key={condition.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("models.form.condition-label", "Condition {index}", { index: String(conditionIndex + 1) })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(conditionIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Pattern */}
          <FormField
            control={form.control}
            name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.usageDetailPattern`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.form.label-usage-detail-pattern", "Usage Detail Pattern (Regex)")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("models.form.placeholder-usage-pattern", "^input")} />
                </FormControl>
                <FormDescription>
                  {t("models.form.placeholder-usage-pattern-hint", "Match usage type keys (e.g., ^input, .*cache.*, output_tokens)")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Operator + Value */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.operator`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.form.label-operator", "Operator")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">{t("models.form.operator-gt", "> (greater than)")}</SelectItem>
                      <SelectItem value="gte">
                        {t("models.form.operator-gte", ">= (greater or equal)")}
                      </SelectItem>
                      <SelectItem value="lt">{t("models.form.operator-lt", "< (less than)")}</SelectItem>
                      <SelectItem value="lte">{t("models.form.operator-lte", "<= (less or equal)")}</SelectItem>
                      <SelectItem value="eq">{t("models.form.operator-eq", "= (equals)")}</SelectItem>
                      <SelectItem value="neq">{t("models.form.operator-neq", "!= (not equals)")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.form.label-value", "Value")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Case Sensitive */}
          <FormField
            control={form.control}
            name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.caseSensitive`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mt-0!">{t("models.form.label-case-sensitive", "Case sensitive")}</FormLabel>
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

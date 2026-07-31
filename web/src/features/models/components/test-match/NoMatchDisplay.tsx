import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/src/features/i18n/useI18n";

type NoMatchDisplayProps = {
  modelName: string;
};

export type { NoMatchDisplayProps };

export function NoMatchDisplay({ modelName }: NoMatchDisplayProps) {
  const { t } = useI18n();
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5" />
          {t("models.no-match.title", "No Match Found")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {t("models.no-match.description", "No model configuration matches \"{modelName}\" in this project.", { modelName })}
        </p>

        <div>
          <p className="mb-2 text-sm font-medium">{t("models.no-match.suggestions", "Suggestions:")}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>{t("models.no-match.suggestion-spelling", "Check your model name spelling")}</li>
            <li>{t("models.no-match.suggestion-view-patterns", "View existing models and their match patterns")}</li>
            <li>{t("models.no-match.suggestion-create", "Create a new model definition")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

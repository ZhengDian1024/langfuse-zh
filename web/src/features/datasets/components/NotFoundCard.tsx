import { Card } from "@/src/components/ui/card";
import { useI18n } from "@/src/features/i18n/useI18n";

export const NotFoundCard = ({
  itemType,
  singleLine = false,
}: {
  itemType: "trace" | "observation";
  singleLine?: boolean;
}) => {
  const { t } = useI18n();
  if (singleLine) {
    return (
      <Card className="flex h-full w-full items-center justify-start overflow-hidden rounded-sm px-2">
        <p
          className="text-muted-foreground truncate text-xs"
          title={t("datasets.not-found.message", "The {itemType} is either still being processed or has been deleted.", { itemType })}
        >
          {t("datasets.not-found.message", "The {itemType} is either still being processed or has been deleted.", { itemType })}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-sm p-3">
      <h2 className="mb-1.5 text-sm font-semibold">{t("datasets.not-found.title", "Not found")}</h2>
      <p className="text-muted-foreground max-w-xs text-center text-xs">
        {t("datasets.not-found.message", "The {itemType} is either still being processed or has been deleted.", { itemType })}
      </p>
    </Card>
  );
};

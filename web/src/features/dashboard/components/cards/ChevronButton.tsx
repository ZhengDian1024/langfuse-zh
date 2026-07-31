import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useI18n } from "@/src/features/i18n/useI18n";

export const ExpandListButton = ({
  isExpanded,
  setExpanded,
  totalLength,
  maxLength,
  expandText,
}: {
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
  totalLength: number;
  maxLength: number;
  expandText?: string;
}) => {
  const { t } = useI18n();
  const resolvedExpandText = expandText ?? t("dashboard.card.see-more", "See more");
  if (totalLength <= maxLength) {
    return null;
  }

  return (
    <Button
      className="mt-2"
      variant="ghost"
      onClick={() => setExpanded(!isExpanded)}
    >
      {isExpanded ? (
        <>
          <ChevronUp className="mr-2 h-4 w-4" /> {t("dashboard.card.see-less", "See less")}
        </>
      ) : (
        <>
          <ChevronDown className="mr-2 h-4 w-4" /> {resolvedExpandText}
        </>
      )}
    </Button>
  );
};

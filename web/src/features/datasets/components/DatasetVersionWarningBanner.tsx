import { Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/src/components/ui/button";
import { useI18n } from "@/src/features/i18n/useI18n";

type DatasetVersionWarningBannerProps = {
  selectedVersion: Date;
  resetToLatest: () => void;
  className?: string;
  changeCounts?: {
    upserts: number;
    deletes: number;
  };
};

export function DatasetVersionWarningBanner({
  selectedVersion,
  resetToLatest,
  className = "",
  changeCounts,
}: DatasetVersionWarningBannerProps) {
  const { t } = useI18n();
  const totalChanges = changeCounts
    ? changeCounts.upserts + changeCounts.deletes
    : 0;
  const hasChanges = totalChanges > 0;

  return (
    <div
      className={`border-accent-dark-blue/10 bg-accent-light-blue/30 flex items-start gap-3 border-b p-3 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm wrap-break-word">
            {t("datasets.version.viewing-version", "Viewing version from ")}{" "}
            <span className="text-foreground font-medium">
              {format(selectedVersion, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </p>
          <Button
            onClick={resetToLatest}
            variant="link"
            className="h-auto shrink-0 p-0 text-sm underline-offset-4"
          >
            {t("datasets.version.return-to-latest", "Return to latest")}
          </Button>
        </div>
        {changeCounts && hasChanges && (
          <p className="text-muted-foreground text-xs">
            {t("datasets.version.changes-since", "{changes} change(s) since this version, {upserts} upsert(s), {deletes} delete(s)", { changes: String(totalChanges), upserts: String(changeCounts.upserts), deletes: String(changeCounts.deletes) })}
          </p>
        )}
      </div>
    </div>
  );
}

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { Info } from "lucide-react";
import { useI18n } from "@/src/features/i18n/useI18n";

interface SamplingMetadata {
  samplingRate: number;
  preflightEstimates?: {
    score1Count: number;
    score2Count: number;
    estimatedMatchedCount: number;
  };
  adaptiveFinal?: {
    usedFinal: boolean;
    reason: string;
  };
}

interface SamplingDetailsHoverCardProps {
  samplingMetadata: SamplingMetadata;
  mode?: "single" | "two";
  showLabel?: boolean;
}

export function SamplingDetailsHoverCard({
  samplingMetadata,
  mode = "two",
  showLabel = false,
}: SamplingDetailsHoverCardProps) {
  const { t } = useI18n();
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={
            showLabel
              ? "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
              : "hover:bg-muted-foreground/10 inline-flex h-4 w-4 items-center justify-center rounded-full"
          }
          aria-label={t("score-analytics.view-sampling-details", "View sampling details")}
        >
          {showLabel && <span>{t("score-analytics.sampled-data", "Sampled Data")}</span>}
          <Info
            className={showLabel ? "h-3 w-3" : "text-muted-foreground h-3 w-3"}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 text-sm font-semibold">
              {mode === "single" ? t("score-analytics.estimated-score-count", "Estimated Score Count") : t("score-analytics.estimated-scores", "Estimated Scores")}
            </h4>
            <dl className="space-y-1 text-sm">
              {mode === "single" ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("score-analytics.total-scores", "Total Scores:")}</dt>
                  <dd className="font-medium">
                    ~
                    {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                  </dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("score-analytics.score-1-label", "Score 1:")}</dt>
                    <dd className="font-medium">
                      ~
                      {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("score-analytics.score-2-label", "Score 2:")}</dt>
                    <dd className="font-medium">
                      ~
                      {samplingMetadata.preflightEstimates?.score2Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("score-analytics.estimated-matches", "Estimated Matches:")}
                    </dt>
                    <dd className="font-medium">
                      ~
                      {samplingMetadata.preflightEstimates?.estimatedMatchedCount.toLocaleString()}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">{t("score-analytics.query-optimizations", "Query Optimizations")}</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("score-analytics.sampling", "Sampling:")}</dt>
                <dd className="font-medium">
                  {(samplingMetadata.samplingRate * 100).toFixed(1)}%
                  {t("score-analytics.hash-based", " (hash-based)")}
                </dd>
              </div>
              {samplingMetadata.adaptiveFinal && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("score-analytics.deduplication", "Deduplication:")}</dt>
                  <dd className="font-medium">
                    {samplingMetadata.adaptiveFinal.usedFinal
                      ? t("score-analytics.enabled", "Enabled")
                      : t("score-analytics.skipped-for-performance", "Skipped for performance")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <p className="text-muted-foreground text-xs">
            {t("score-analytics.sampling-note", "Hash-based sampling ensures consistent, repeatable results while maintaining statistical accuracy.")}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

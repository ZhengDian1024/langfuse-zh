/**
 * LogViewToolbar - Controls for log view search and actions.
 *
 * Provides:
 * - Search input for filtering observations (hidden in JSON view)
 * - Action buttons: expand/collapse all, copy JSON, download JSON
 * - Large Trace indicator for virtualized mode
 */

import { memo, useState } from "react";
import {
  FoldVertical,
  UnfoldVertical,
  Copy,
  Download,
  Check,
  IndentIncrease,
  Timer,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Command, CommandInput } from "@/src/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { cn } from "@/src/utils/tailwind";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useI18n } from "@/src/features/i18n/useI18n";

export interface LogViewToolbarProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Whether virtualization is active (for large traces) */
  isVirtualized?: boolean;
  /** Total number of observations (shown in Large Trace indicator) */
  observationCount?: number;
  /** Number of observations with loaded I/O data (for cache-only mode) */
  loadedObservationCount?: number;
  /** Callback to toggle expand/collapse all (non-virtualized only) */
  onToggleExpandAll?: () => void;
  /** Whether all rows are expanded */
  allRowsExpanded?: boolean;
  /** Whether copy/download action is currently loading */
  isCopyOrDownloadLoading?: boolean;
  /** Whether copy/download uses cached I/O only (doesn't load all) */
  isCopyOrDownloadCacheOnly?: boolean;
  /** Callback to copy JSON */
  onCopyJson?: () => void;
  /** Callback to download JSON */
  onDownloadJson?: () => void;
  /** Current view type (pretty/json/json-beta) */
  currentView?: "pretty" | "json" | "json-beta";
  /** Whether indent visualization is enabled */
  indentEnabled?: boolean;
  /** Whether indent toggle is disabled (tree too deep) */
  indentDisabled?: boolean;
  /** Callback to toggle indent visualization */
  onToggleIndent?: () => void;
  /** Whether milliseconds are shown in time values */
  showMilliseconds?: boolean;
  /** Callback to toggle milliseconds display */
  onToggleMilliseconds?: () => void;
}

/**
 * Toolbar for log view controls.
 */
export const LogViewToolbar = memo(function LogViewToolbar({
  searchQuery,
  onSearchChange,
  isVirtualized = true,
  observationCount,
  loadedObservationCount,
  onToggleExpandAll,
  allRowsExpanded,
  onCopyJson,
  isCopyOrDownloadLoading = false,
  onDownloadJson,
  isCopyOrDownloadCacheOnly = false,
  currentView = "pretty",
  indentEnabled = false,
  indentDisabled = false,
  onToggleIndent,
  showMilliseconds = false,
  onToggleMilliseconds,
}: LogViewToolbarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useI18n();

  const handleCopyClick = () => {
    if (isCopyOrDownloadLoading) return;

    setIsCopied(true);
    onCopyJson?.();
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="bg-background flex h-9 shrink-0 items-center gap-1.5 border-b px-2">
      {/* Large Trace indicator - only shown for virtualized mode */}
      {isVirtualized && (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <span className="cursor-help rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {t("trace.logview.large-trace", "Large Trace")}
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className="w-72 text-sm"
            sideOffset={8}
          >
            <p className="font-medium">
              {t("trace.logview.optimized", "Optimized for performance")}
            </p>
            <p className="text-muted-foreground mt-1.5">
              {t(
                "trace.logview.smooth-prefix",
                "This trace has {count} observations. To keep things smooth:",
                {
                  count:
                    observationCount?.toLocaleString() ??
                    t("trace.logview.large-trace-many", "many"),
                },
              )}
            </p>
            <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-0.5">
              <li>{t("trace.logview.content-loads", "Content loads as you scroll")}</li>
              <li>{t("trace.logview.json-disabled", "JSON view is disabled")}</li>
              <li>
                {t(
                  "trace.logview.download-copy-note",
                  "Download/copy includes I/O for cached observations only",
                )}
              </li>
            </ul>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* Search input or spacer (hidden in JSON dump view) */}
      {currentView === "json" ? (
        <div className="flex-1" />
      ) : (
        <Command className="flex-1 rounded-none border-0 bg-transparent">
          <CommandInput
            showBorder={false}
            placeholder={t(
              "trace.logview.search-placeholder",
              "Search observations...",
            )}
            className="h-7 border-0 focus:ring-0"
            value={searchQuery}
            onValueChange={onSearchChange}
          />
        </Command>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        {/* Indent Toggle - only in table view (pretty or json-beta) */}
        {currentView !== "json" && onToggleIndent && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant={indentEnabled ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  indentEnabled && "bg-primary text-primary-foreground",
                  indentDisabled && "cursor-not-allowed opacity-50",
                )}
                onClick={indentDisabled ? undefined : onToggleIndent}
                disabled={indentDisabled}
                title={
                  indentDisabled
                    ? undefined
                    : indentEnabled
                      ? t("trace.logview.hide-indentation", "Hide indentation")
                      : t("trace.logview.show-indentation", "Show indentation")
                }
              >
                <IndentIncrease className="h-3.5 w-3.5" />
              </Button>
            </HoverCardTrigger>
            {indentDisabled && (
              <HoverCardContent className="w-56 text-sm" sideOffset={8}>
                <p className="font-medium">
                  {t("trace.logview.indentation-unavailable", "Indentation unavailable")}
                </p>
                <p className="text-muted-foreground mt-1">
                  {t(
                    "trace.logview.indentation-disabled",
                    "Disabled for deeply nested trees to maintain readability.",
                  )}
                </p>
              </HoverCardContent>
            )}
          </HoverCard>
        )}

        {/* Milliseconds Toggle - only in table view (pretty or json-beta) */}
        {currentView !== "json" && onToggleMilliseconds && (
          <Button
            variant={showMilliseconds ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-7 w-7",
              showMilliseconds && "bg-primary text-primary-foreground",
            )}
            onClick={onToggleMilliseconds}
            title={
              showMilliseconds
                ? t("trace.logview.hide-milliseconds", "Hide milliseconds")
                : t("trace.logview.show-milliseconds", "Show milliseconds")
            }
          >
            <Timer className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Expand/Collapse All - show disabled with tooltip when virtualized */}
        {currentView !== "json" && onToggleExpandAll && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    isVirtualized && "cursor-not-allowed opacity-50",
                  )}
                  onClick={isVirtualized ? undefined : onToggleExpandAll}
                  disabled={isVirtualized}
                >
                  {allRowsExpanded && !isVirtualized ? (
                    <FoldVertical className="h-3.5 w-3.5" />
                  ) : (
                    <UnfoldVertical className="h-3.5 w-3.5" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {isVirtualized
                ? t("trace.logview.disabled-large", "Disabled for large traces")
                : allRowsExpanded
                  ? t("trace.common.collapse-all", "Collapse all")
                  : t("trace.common.expand-all", "Expand all")}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Copy JSON */}
        {onCopyJson && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={
                      isCopyOrDownloadLoading ? undefined : handleCopyClick
                    }
                    disabled={isCopyOrDownloadLoading}
                  >
                    {isCopyOrDownloadLoading ? (
                      <Spinner size="xs" />
                    ) : isCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCopyOrDownloadLoading
                    ? t("trace.logview.loading-data", "Loading data...")
                    : isCopyOrDownloadCacheOnly
                      ? t("trace.logview.copy-cache", "Copy as JSON (cache only)")
                      : t("trace.logview.copy", "Copy as JSON")}
                </TooltipContent>
              </Tooltip>
            </HoverCardTrigger>
            {isCopyOrDownloadCacheOnly && !isCopyOrDownloadLoading && (
              <HoverCardContent className="w-64 text-sm" sideOffset={8}>
                <p className="font-medium">
                  {t("trace.logview.cache-only-mode", "Cache-only mode")}
                </p>
                <p className="text-muted-foreground mt-1">
                  {t(
                    "trace.logview.cache-note",
                    "For large traces, only expanded observations include full I/O data.",
                  )}
                </p>
                {loadedObservationCount !== undefined &&
                  observationCount !== undefined && (
                    <p className="text-muted-foreground mt-1.5">
                      <span className="font-medium">
                        {t(
                          "trace.logview.loaded-count",
                          "{loaded} of {total}",
                          {
                            loaded: String(loadedObservationCount),
                            total: String(observationCount),
                          },
                        )}
                      </span>{" "}
                      {t(
                        "trace.logview.observations-loaded",
                        "observations loaded",
                      )}
                    </p>
                  )}
              </HoverCardContent>
            )}
          </HoverCard>
        )}

        {/* Download JSON */}
        {onDownloadJson && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={
                      isCopyOrDownloadLoading ? undefined : onDownloadJson
                    }
                    disabled={isCopyOrDownloadLoading}
                  >
                    {isCopyOrDownloadLoading ? (
                      <Spinner size="xs" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCopyOrDownloadLoading
                    ? t("trace.logview.loading-data", "Loading data...")
                    : isCopyOrDownloadCacheOnly
                      ? t("trace.logview.download-cache", "Download as JSON (cache only)")
                      : t("trace.logview.download", "Download as JSON")}
                </TooltipContent>
              </Tooltip>
            </HoverCardTrigger>
            {isCopyOrDownloadCacheOnly && !isCopyOrDownloadLoading && (
              <HoverCardContent className="w-64 text-sm" sideOffset={8}>
                <p className="font-medium">
                  {t("trace.logview.cache-only-mode", "Cache-only mode")}
                </p>
                <p className="text-muted-foreground mt-1">
                  {t(
                    "trace.logview.cache-note",
                    "For large traces, only expanded observations include full I/O data.",
                  )}
                </p>
                {loadedObservationCount !== undefined &&
                  observationCount !== undefined && (
                    <p className="text-muted-foreground mt-1.5">
                      <span className="font-medium">
                        {t(
                          "trace.logview.loaded-count",
                          "{loaded} of {total}",
                          {
                            loaded: String(loadedObservationCount),
                            total: String(observationCount),
                          },
                        )}
                      </span>{" "}
                      {t(
                        "trace.logview.observations-loaded",
                        "observations loaded",
                      )}
                    </p>
                  )}
              </HoverCardContent>
            )}
          </HoverCard>
        )}
      </div>
    </div>
  );
});

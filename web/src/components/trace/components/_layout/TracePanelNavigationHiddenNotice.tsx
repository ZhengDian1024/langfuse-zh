/**
 * HiddenObservationsNotice - Shows notification when observations are filtered by minimum level
 *
 * Displays:
 * - Count of hidden observations
 * - Current minimum observation level
 * - "Show all" link to reset filter to DEBUG level
 *
 * Only renders when hiddenObservationsCount > 0
 * Fixed height component placed below NavigationHeader
 */

import { ObservationLevel } from "@langfuse/shared";
import { useTraceData } from "../../contexts/TraceDataContext";
import { useViewPreferences } from "../../contexts/ViewPreferencesContext";
import { useI18n } from "@/src/features/i18n/useI18n";

export function TracePanelNavigationHiddenNotice() {
  const { hiddenObservationsCount } = useTraceData();
  const { minObservationLevel, setMinObservationLevel } = useViewPreferences();
  const { t } = useI18n();

  const handleShowAll = () => {
    setMinObservationLevel(ObservationLevel.DEBUG);
  };

  // Only show when observations are hidden
  if (hiddenObservationsCount === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center justify-end gap-1 border-b px-4 py-1">
      <span className="text-muted-foreground flex flex-col gap-1 text-xs sm:flex-row">
        <p>
          {t(
            "trace.panel.hidden-notice",
            "{count} hidden observations below {level} level.",
            {
              count: String(hiddenObservationsCount),
              level: minObservationLevel,
            },
          )}
        </p>
        <p
          className="cursor-pointer underline"
          onClick={handleShowAll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleShowAll();
            }
          }}
        >
          {t("trace.panel.show-all", "Show all")}
        </p>
      </span>
    </div>
  );
}

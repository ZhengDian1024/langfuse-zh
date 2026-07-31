/**
 * Simple metadata badges for ObservationDetailView
 * Each badge handles its own null checks and returns null when data is unavailable
 */

import { Badge } from "@/src/components/ui/badge";
import { formatIntervalSeconds } from "@/src/utils/dates";
import { useI18n } from "@/src/features/i18n/useI18n";

export function LatencyBadge({
  latencySeconds,
}: {
  latencySeconds: number | null;
}) {
  const { t } = useI18n();
  if (latencySeconds == null) return null;

  return (
    <Badge variant="tertiary">
      {t("trace.badge.latency", "Latency: ")}
      {formatIntervalSeconds(latencySeconds)}
    </Badge>
  );
}

export function TimeToFirstTokenBadge({
  timeToFirstToken,
}: {
  timeToFirstToken: number | null | undefined;
}) {
  const { t } = useI18n();
  if (timeToFirstToken == null) return null;

  return (
    <Badge variant="tertiary">
      {t("trace.badge.time-to-first-token", "Time to first token: ")}
      {formatIntervalSeconds(timeToFirstToken)}
    </Badge>
  );
}

export function EnvironmentBadge({
  environment,
}: {
  environment: string | null | undefined;
}) {
  const { t } = useI18n();
  if (!environment) return null;

  return (
    <Badge variant="tertiary">
      {t("trace.badge.env", "Env: ")}
      {environment}
    </Badge>
  );
}

export function VersionBadge({
  version,
}: {
  version: string | null | undefined;
}) {
  const { t } = useI18n();
  if (!version) return null;

  return (
    <Badge variant="tertiary">
      {t("trace.badge.version", "Version: ")}
      {version}
    </Badge>
  );
}

export function LevelBadge({ level }: { level: string | null | undefined }) {
  if (!level || level === "DEFAULT") return null;

  return (
    <Badge
      variant={
        level === "ERROR"
          ? "destructive"
          : level === "WARNING"
            ? "warning"
            : "tertiary"
      }
    >
      {level}
    </Badge>
  );
}

export function StatusMessageBadge({
  statusMessage,
}: {
  statusMessage: string | null | undefined;
}) {
  if (!statusMessage) return null;

  return <Badge variant="tertiary">{statusMessage}</Badge>;
}

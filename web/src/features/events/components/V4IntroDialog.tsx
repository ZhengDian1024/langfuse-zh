import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useI18n } from "@/src/features/i18n/useI18n";

export function V4IntroDialog({
  open,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent
        className="[&>div:last-child]:hidden"
        aria-label={t(
          "v4.intro.aria-label",
          "Welcome to a faster Langfuse",
        )}
      >
        <DialogBody>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/v4-beta-intro.jpg"
            alt={t(
              "v4.intro.image-alt",
              "Langfuse gets Faster — performance comparison showing 5x to 165x speedups",
            )}
            className="w-full rounded-md"
          />
          <ul className="flex flex-col gap-3">
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-medium">
                {t("v4.intro.faster-title", "Welcome to a faster Langfuse")}
              </span>{" "}
              {t(
                "v4.intro.faster-desc",
                "We've rebuilt the data model around observations rather than traces, which means charts, filters, and APIs are dramatically faster.",
              )}
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-medium">
                {t("v4.intro.observations-title", "New Observations table")}
              </span>{" "}
              {t(
                "v4.intro.observations-desc",
                "Your traces are still here. The default view now shows all observations. To see a table with just your root traces, filter by",
              )}{" "}
              <span className="font-medium">
                {t(
                  "v4.intro.observations-filter",
                  "Is Root Observation → True",
                )}
              </span>
              .
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-medium">
                {t("v4.intro.views-title", "New Saved Table Views")}
              </span>{" "}
              {t(
                "v4.intro.views-desc",
                "Save your table filters as an org-wide saved view so your whole team starts from the same place.",
              )}{" "}
              <a
                href="https://langfuse.com/faq/all/explore-observations-in-v4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                {t("v4.intro.best-practices", "Best practices →")}
              </a>
            </li>
          </ul>
          <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-950">
            <p className="text-yellow-900 dark:text-yellow-200">
              <span className="font-medium">
                {t("v4.intro.live-title", "Want traces to appear live?")}
              </span>{" "}
              {t(
                "v4.intro.live-desc",
                "Upgrade your SDK to the latest version. Older SDKs still work but traces may take ~10 minutes to appear.",
              )}{" "}
              <a
                href="https://langfuse.com/docs/observability/sdk/upgrade-path"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                {t("v4.intro.upgrade-guide", "Upgrade guide →")}
              </a>
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="items-center sm:justify-between">
          <a
            href="https://langfuse.com/docs/v4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium hover:underline"
          >
            {t("v4.intro.read-docs", "Read the v4 docs →")}
          </a>
          <Button onClick={onConfirm}>
            {t("v4.intro.understood", "Understood →")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

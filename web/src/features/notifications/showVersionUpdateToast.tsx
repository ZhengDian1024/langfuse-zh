import { Button } from "@/src/components/ui/button";
import { useI18n } from "@/src/features/i18n/useI18n";
import { toast } from "sonner";

const VersionUpdateNotification: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="flex justify-between">
      <div className="flex min-w-[300px] flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70 m-0 text-sm leading-tight font-medium">
            {t(
              "notifications.version-update.message",
              "We have released a new version of Langfuse. Please refresh your browser to get the latest update.",
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size={"sm"}
          className="text-foreground/50"
          onClick={() => {
            window.location.reload();
          }}
        >
          {t("notifications.version-update.refresh", "Refresh page")}
        </Button>
      </div>
    </div>
  );
};

export const showVersionUpdateToast = () => {
  toast.custom(() => <VersionUpdateNotification />, {
      duration: Infinity,
      style: {
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--border))",
      },
    },
  );
};

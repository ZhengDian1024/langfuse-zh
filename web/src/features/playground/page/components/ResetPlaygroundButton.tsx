import { ListRestartIcon } from "lucide-react";
import { useRouter } from "next/router";

import { Button } from "@/src/components/ui/button";
import { usePersistedWindowIds } from "@/src/features/playground/page/hooks/usePersistedWindowIds";
import { useI18n } from "@/src/features/i18n/useI18n";

export const ResetPlaygroundButton: React.FC = () => {
  const router = useRouter();
  const { clearAllCache } = usePersistedWindowIds();
  const { t } = useI18n();

  const handleClick = () => {
    clearAllCache();
    router.reload();
  };

  return (
    <Button
      variant="outline"
      title={t("playground.aria.reset-playground", "Reset playground state")}
      onClick={handleClick}
      className="gap-1"
    >
      <ListRestartIcon className="h-4 w-4" />
      <span className="hidden lg:inline">{t("playground.action.reset-playground", "Reset playground")}</span>
    </Button>
  );
};

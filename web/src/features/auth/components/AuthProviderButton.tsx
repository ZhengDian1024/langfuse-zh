import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/utils/tailwind";
import { useI18n } from "@/src/features/i18n/useI18n";
import React from "react";

interface AuthProviderButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  loading?: boolean;
  showLastUsedBadge?: boolean;
}

export function AuthProviderButton({
  icon,
  label,
  onClick,
  loading = false,
  showLastUsedBadge = false,
}: AuthProviderButtonProps) {
  const { t } = useI18n();
  return (
    <div>
      <Button
        onClick={onClick}
        variant="secondary"
        loading={loading}
        className="w-full"
      >
        {icon}
        {label}
      </Button>
      <div
        className={cn(
          "text-muted-foreground mt-0.5 text-center text-xs",
          showLastUsedBadge ? "visible" : "invisible",
        )}
      >
        {t("auth.last-used", "Last used")}
      </div>
    </div>
  );
}

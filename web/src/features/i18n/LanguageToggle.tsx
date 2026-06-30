import { Check } from "lucide-react";
import { useI18n, type AppLanguage } from "@/src/features/i18n/useI18n";
import { cn } from "@/src/utils/tailwind";

type LanguageLabelKey = Parameters<ReturnType<typeof useI18n>["t"]>[0];

const languageOptions: Array<{
  value: AppLanguage;
  labelKey: LanguageLabelKey;
}> = [
  { value: "en", labelKey: "settings.language.english" },
  { value: "zh", labelKey: "settings.language.chinese" },
];

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <span className="mr-2">{t("settings.language")}</span>
      <div className="flex items-center gap-1">
        {languageOptions.map((option) => {
          const selected = language === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "hover:bg-input hover:text-primary-accent inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs",
                selected ? "text-primary-accent" : "text-muted-foreground",
              )}
              onClick={(event) => {
                event.preventDefault();
                setLanguage(option.value);
              }}
            >
              {selected ? <Check className="h-3 w-3" /> : null}
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

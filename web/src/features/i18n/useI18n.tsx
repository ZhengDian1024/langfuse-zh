import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  translate,
  type AppLanguage,
  type MessageKey,
} from "@/src/features/i18n/messages";

export type { AppLanguage, MessageKey } from "@/src/features/i18n/messages";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (
    key: MessageKey,
    defaultMessageOrValues?: string | Record<string, string>,
    values?: Record<string, string>,
  ) => string;
};

const LANGUAGE_STORAGE_KEY = "langfuse-language";

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLanguage && isAppLanguage(storedLanguage)) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (
      key: MessageKey,
      defaultMessageOrValues?: string | Record<string, string>,
      values?: Record<string, string>,
    ) => translate(key, defaultMessageOrValues, values, language),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}

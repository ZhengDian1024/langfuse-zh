import enMessages from "../../../i18n/en.json";
import zhMessages from "../../../i18n/zh.json";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

const i18nMessages = {
  en: enMessages,
  zh: zhMessages,
};

export type AppLanguage = keyof typeof i18nMessages;
export type MessageKey = keyof (typeof i18nMessages)["en"];

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey) => string;
};

const LANGUAGE_STORAGE_KEY = "langfuse-language";
const DEFAULT_LANGUAGE: AppLanguage = "en";

const I18nContext = createContext<I18nContextValue | null>(null);

const isAppLanguage = (language: string): language is AppLanguage =>
  language in i18nMessages;

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
    (key: MessageKey) => i18nMessages[language][key] ?? i18nMessages.en[key],
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

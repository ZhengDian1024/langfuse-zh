import enMessages from "../../../i18n/en.json";
import zhMessages from "../../../i18n/zh.json";

export const i18nMessages = {
  en: enMessages,
  zh: zhMessages,
};

export type AppLanguage = keyof typeof i18nMessages;
export type MessageKey = keyof (typeof i18nMessages)["en"];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const isAppLanguage = (language: string): language is AppLanguage =>
  language in i18nMessages;

export const translate = (
  key: MessageKey,
  defaultMessageOrValues?: string | Record<string, string>,
  maybeValues?: Record<string, string>,
  language: AppLanguage = DEFAULT_LANGUAGE,
) => {
  const defaultMessage =
    typeof defaultMessageOrValues === "string" ? defaultMessageOrValues : undefined;
  const values =
    typeof defaultMessageOrValues === "object"
      ? defaultMessageOrValues
      : maybeValues;
  const message = i18nMessages[language][key] ?? defaultMessage ?? i18nMessages.en[key];

  if (!values) return message;

  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    message,
  );
};

import { translations } from "@/lib/i18n/translations";

export const localeCookieName = "locale";
export const locales = ["bg", "en"] as const;
export type Locale = (typeof locales)[number];

const getNestedValue = (obj: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

export const getTranslator = (locale: Locale) => {
  const table = translations[locale] ?? translations.bg;
  return (key: string, vars?: Record<string, string | number>) => {
    const raw = getNestedValue(table as Record<string, unknown>, key);
    const value = typeof raw === "string" ? raw : key;
    if (!vars) return value;
    return Object.entries(vars).reduce(
      (text, [token, replace]) =>
        text.replaceAll(`{{${token}}}`, String(replace)),
      value,
    );
  };
};

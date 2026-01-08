import { cookies } from "next/headers";
import { Locale, localeCookieName, locales, getTranslator } from "@/lib/i18n";

export const getLocaleFromCookies = (): Locale => {
  const store = cookies();
  const cookie = store.get(localeCookieName)?.value;
  if (cookie && locales.includes(cookie as Locale)) {
    return cookie as Locale;
  }
  return "bg";
};

export const getServerTranslator = () => {
  const locale = getLocaleFromCookies();
  return { locale, t: getTranslator(locale) };
};

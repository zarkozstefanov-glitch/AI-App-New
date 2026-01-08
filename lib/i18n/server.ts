import { cookies } from "next/headers";
import { Locale, localeCookieName, locales, getTranslator } from "@/lib/i18n";

// Правим функцията асинхронна, за да изчакаме cookies()
export const getLocaleFromCookies = async (): Promise<Locale> => {
  const store = await cookies(); 
  const cookie = store.get(localeCookieName)?.value;
  
  if (cookie && locales.includes(cookie as Locale)) {
    return cookie as Locale;
  }
  
  return "bg";
};

// Тази функция също става асинхронна, защото вика горната
export const getServerTranslator = async () => {
  const locale = await getLocaleFromCookies();
  return { locale, t: getTranslator(locale) };
};
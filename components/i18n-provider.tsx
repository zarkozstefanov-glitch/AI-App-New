"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Locale, locales, localeCookieName, getTranslator } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof getTranslator>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const readCookieLocale = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${localeCookieName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bg");

  useEffect(() => {
    const stored = localStorage.getItem(localeCookieName);
    const cookie = readCookieLocale();
    const preferred =
      (stored && locales.includes(stored as Locale) && stored) ||
      (cookie && locales.includes(cookie as Locale) && cookie) ||
      "bg";
    setLocaleState(preferred as Locale);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    localStorage.setItem(localeCookieName, nextLocale);
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000`;
  }, []);

  const t = useMemo(() => getTranslator(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};

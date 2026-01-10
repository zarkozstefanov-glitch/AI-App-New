"use client";

import { useI18n } from "@/components/i18n-provider";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow">
      <div>
        <p className="text-sm font-semibold text-slate-900">{t("settings.language")}</p>
        <p className="text-xs text-slate-500">BG / EN</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/30 px-1 py-1">
        <button
          type="button"
          onClick={() => setLocale("bg")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            locale === "bg" ? "bg-blue-600 text-white" : "text-slate-600"
          }`}
        >
          BG
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            locale === "en" ? "bg-blue-600 text-white" : "text-slate-600"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}

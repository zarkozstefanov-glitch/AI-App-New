import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import { translations } from "@/lib/i18n/translations";

export default function FaqPage() {
  const { t, locale } = getServerTranslator();
  const faqs = translations[locale].faq.items;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8 sm:px-8">
      <div className="glass rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold text-slate-900">{t("faq.title")}</h1>
        <div className="mt-6 space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <p className="text-sm font-semibold text-slate-900">{item.q}</p>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}

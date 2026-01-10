import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

// 1. Правим функцията асинхронна
export default async function ContactPage() {
  
  // 2. Добавяме await тук
  const { t } = await getServerTranslator(); 

  return (
    // ... останалият JSX код си остава същият
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-8 sm:px-8">
      <div className="glass rounded-3xl border border-white/40 bg-white/20 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("contact.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t("contact.subtitle")}
        </p>

        <form className="mt-6 grid gap-4">
          <label className="text-sm text-slate-700">
            {t("contact.name")}
            <input
              className="mt-2 w-full rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-slate-900 outline-none"
              placeholder={t("contact.namePlaceholder")}
            />
          </label>
          <label className="text-sm text-slate-700">
            {t("contact.email")}
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-slate-900 outline-none"
              placeholder="name@email.com"
            />
          </label>
          <label className="text-sm text-slate-700">
            {t("contact.topic")}
            <input
              className="mt-2 w-full rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-slate-900 outline-none"
              placeholder={t("contact.topicPlaceholder")}
            />
          </label>
          <label className="text-sm text-slate-700">
            {t("contact.message")}
            <textarea
              className="mt-2 min-h-[140px] w-full rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-slate-900 outline-none"
              placeholder={t("contact.messagePlaceholder")}
            />
          </label>
          <button
            type="button"
            className="w-fit rounded-full bg-white/30 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/40"
          >
            {t("contact.send")}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-white/40 bg-white/20 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/40"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}

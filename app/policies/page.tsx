import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import { translations } from "@/lib/i18n/translations";

// 1. Направи компонента async
export default async function PoliciesPage() {
  
  // 2. Добави await тук
  const { t, locale } = await getServerTranslator();

  // Сега вече 'locale' е текст, а не Promise, и това ще работи:
  const sections = translations[locale].policies.sections;
  
  // ...
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8 sm:px-8">
      <div className="glass rounded-3xl border border-white/40 bg-white/20 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold text-slate-900">{t("policies.title")}</h1>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <section>
            <h2 className="text-slate-900 font-semibold">{sections[0]}</h2>
            <p className="mt-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non
              risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing
              nec, ultricies sed, dolor.
            </p>
          </section>
          <section>
            <h2 className="text-slate-900 font-semibold">{sections[1]}</h2>
            <p className="mt-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              luctus egestas leo, vitae facilisis felis fermentum sed.
            </p>
          </section>
          <section>
            <h2 className="text-slate-900 font-semibold">{sections[2]}</h2>
            <p className="mt-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              nec odio. Praesent libero. Sed cursus ante dapibus diam.
            </p>
          </section>
          <section>
            <h2 className="text-slate-900 font-semibold">{sections[3]}</h2>
            <p className="mt-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
              nibh. Aenean quam. In scelerisque sem at dolor.
            </p>
          </section>
        </div>
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

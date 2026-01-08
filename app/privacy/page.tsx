import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import { translations } from "@/lib/i18n/translations";

// Промени:
export default async function PrivacyPage() {
  const { t, locale } = await getServerTranslator();
  // Увери се, че locale вече е стринг тук
  const sections = translations[locale].privacy.sections;
  
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8 sm:px-8">
      <div className="glass rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold text-slate-900">{t("privacy.title")}</h1>
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
          className="mt-6 inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}

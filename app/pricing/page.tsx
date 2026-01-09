import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AuthModalHost, AuthOpenButton } from "@/components/auth/auth-modal";

const features = [
  "Всички AI функции",
  "Пълен достъп до анализи",
  "Неограничени транзакции",
  "Приоритетна поддръжка",
];

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900">
      <header className="border-b border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-white/20">
              <Image
                src="/novologo.png"
                alt="Logo"
                width={128}
                height={44}
                className="h-full w-full object-cover scale-240 brightness-0 invert"
                priority
              />
            </span>
          </Link>
          <AuthOpenButton className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20">
            Вход / Регистрация
          </AuthOpenButton>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-12 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Планове
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Пробвай премиум без риск.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Започни с 1 месец безплатно и отключи всички AI функции още днес.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div id="pricing-trial" className="scroll-mt-24">
            <Card className="relative overflow-hidden border border-indigo-200/70 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-white/80 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.25)] backdrop-blur-sm">
              <div className="absolute right-6 top-6 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Free
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100 drop-shadow-sm">
                Trial
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                1 месец БЕЗПЛАТНО
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Без карта. Без ангажименти.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="relative overflow-hidden border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 p-6 shadow-[0_20px_60px_rgba(59,130,246,0.2)] backdrop-blur-sm">
            <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-400/30 blur-2xl" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                Premium
              </p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-600">
                Най-популярен
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              4.49 EUR / месец
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              След пробния период продължаваш с пълен достъп.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                    <Check className="h-3 w-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <AuthOpenButton className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5 hover:bg-blue-700">
              Започни безплатно
            </AuthOpenButton>
          </Card>
        </div>
      </main>
      <footer className="border-t border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-white/80 sm:flex-row sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-white/20">
              <Image
                src="/novologo.png"
                alt="Logo"
                width={160}
                height={48}
                className="h-full w-full object-cover scale-240 brightness-0 invert"
                priority
              />
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 uppercase tracking-[0.2em]">
            <Link href="/contact" className="hover:text-white">
              Контакти
            </Link>
            <Link href="/faq" className="hover:text-white">
              Често задавани въпроси
            </Link>
            <Link href="/policies" className="hover:text-white">
              Политики
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Поверителност
            </Link>
          </div>
        </div>
      </footer>
      <AuthModalHost />
    </div>
  );
}

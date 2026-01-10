"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type AccountSummary, useAccounts } from "@/components/accounts/accounts-context";
import { fromCents } from "@/lib/currency";
import NumberTicker from "@/components/ui/number-ticker";
import IncomeModal from "@/components/accounts/income-modal";
import PageHeader from "@/components/page-header";
import { useI18n } from "@/components/i18n-provider";
import { formatAccountLabel } from "@/lib/accounts";

type AccountHeaderProps = {
  demoAccounts?: AccountSummary[];
  hideIncomeAction?: boolean;
};

export default function AccountHeader({
  demoAccounts,
  hideIncomeAction = false,
}: AccountHeaderProps) {
  const { accounts, refreshAccounts } = useAccounts();
  const accountsSource = demoAccounts ?? accounts;
  const isDemo = Boolean(demoAccounts);
  const [showIncome, setShowIncome] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const { t, locale } = useI18n();
  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  useEffect(() => {
    if (demoAccounts) return;
    const handler = () => refreshAccounts();
    window.addEventListener("transactions:changed", handler);
    return () => {
      window.removeEventListener("transactions:changed", handler);
    };
  }, [refreshAccounts, demoAccounts]);

  const sorted = useMemo(
    () =>
      [...accountsSource].sort((a, b) => {
        const order = { cash: 0, bank: 1, savings: 2 } as Record<string, number>;
        return (order[a.kind] ?? 99) - (order[b.kind] ?? 99);
      }),
    [accountsSource],
  );
  const totals = useMemo(
    () =>
      accountsSource.reduce(
        (acc, account) => ({
          eurCents: acc.eurCents + account.balanceEurCents,
          bgnCents: acc.bgnCents + account.balanceBgnCents,
        }),
        { eurCents: 0, bgnCents: 0 },
      ),
    [accountsSource],
  );

  const headerCardClass = isDemo
    ? "rounded-[2rem] border border-white/40 bg-white/40 p-6 shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:shadow-neon-strong"
    : "rounded-[2rem] border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-3xl animate-float transition hover:-translate-y-0.5 hover:shadow-neon-strong";
  const accountCardBase =
    "w-full rounded-2xl border border-white/40 border-t-2 bg-white/40 p-5 text-left shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:shadow-neon-strong lg:h-[120px] lg:px-10 lg:py-6";
  const accountCardBaseLive =
    "w-full rounded-2xl border border-white/40 border-t-2 bg-white/20 p-5 text-left shadow-glow backdrop-blur-3xl transition hover:-translate-y-0.5 hover:shadow-neon-strong lg:h-[120px] lg:px-10 lg:py-6";
  const demoAccountColors: Record<
    AccountSummary["kind"],
    { accent: string; text: string }
  > = {
    cash: { accent: "#60A5FA", text: "#2563EB" },
    bank: { accent: "#3B82F6", text: "#1E40AF" },
    savings: { accent: "#A855F7", text: "#7C3AED" },
  };

  useEffect(() => {
    if (!isDemo || !carouselRef.current) return;
    const container = carouselRef.current;
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const items = container.querySelectorAll<HTMLElement>("[data-carousel-item]");
        if (!items.length) return;
        const first = items[0];
        const second = items[1];
        const gap = second ? second.offsetLeft - first.offsetLeft - first.offsetWidth : 0;
        const itemWidth = first.offsetWidth + gap;
        const index = Math.round(container.scrollLeft / itemWidth);
        setActiveCard(Math.max(0, Math.min(index, items.length - 1)));
      });
    };
    handler();
    container.addEventListener("scroll", handler, { passive: true });
    return () => {
      container.removeEventListener("scroll", handler);
      cancelAnimationFrame(raf);
    };
  }, [isDemo, sorted.length]);

  return (
    <section className="space-y-4">
      <div className={headerCardClass}>
        <PageHeader
          label={t("dashboard.overview")}
          title={t("dashboard.accounts")}
          subtitle={t("dashboard.profiles")}
          action={
            <div className="flex flex-col items-end gap-1 text-right">
              {!hideIncomeAction && (
                <button
                  type="button"
                  onClick={() => setShowIncome(true)}
                  className="rounded-full border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  {t("dashboard.addIncome")}
                </button>
              )}
              <span className="text-[10px] font-medium text-slate-500 lg:text-xs">
                {t("dashboard.totalBalance")}
              </span>
              <div className="flex flex-col items-end gap-1 whitespace-nowrap text-[10px] font-medium text-slate-500 lg:text-sm lg:font-semibold">
                <span>€{amountFormatter.format(fromCents(totals.eurCents))}</span>
                <span>BGN {amountFormatter.format(fromCents(totals.bgnCents))}</span>
              </div>
            </div>
          }
        />
      </div>

      {isDemo ? (
        <div className="mt-6 space-y-3">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto px-2 pb-2 -mx-2 snap-x snap-mandatory scrollbar-hide touch-pan-x lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {sorted.map((account) => {
              const colors = demoAccountColors[account.kind];
              return (
              <div
                key={account.id}
                data-carousel-item
                className={`${accountCardBase} relative min-w-[260px] snap-center pl-5 overflow-visible lg:min-w-0`}
                style={{ borderTopColor: colors.accent }}
              >
                <span
                  className="pointer-events-none absolute left-0.5 top-4 bottom-4 z-10 w-1.5 rounded-full shadow-glow"
                  style={{ backgroundColor: colors.accent }}
                  aria-hidden
                />
                <div className="flex w-full items-stretch gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p
                        className="text-[14px] font-bold lg:text-[18px] leading-tight whitespace-normal"
                        style={{ color: colors.text }}
                      >
                        {account.kind === "cash"
                          ? t("accounts.cash")
                          : account.kind === "bank"
                            ? t("accounts.bank")
                            : t("accounts.savings")}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-500">
                        {formatAccountLabel(account, locale)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center text-right">
                      <p
                        className="text-[20px] font-extrabold lg:text-[24px] drop-shadow-[0_4px_12px_rgba(30,64,175,0.15)]"
                        style={{ color: colors.text }}
                      >
                        €
                        <NumberTicker
                          value={fromCents(account.balanceEurCents)}
                          format={(val) => amountFormatter.format(val)}
                        />
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 lg:text-[14px]">
                        BGN{" "}
                        <NumberTicker
                          value={fromCents(account.balanceBgnCents)}
                          format={(val) => amountFormatter.format(val)}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 lg:hidden">
            {sorted.map((account, index) => (
              <span
                key={account.id}
                className={`h-2 w-2 rounded-full transition ${
                  activeCard === index ? "bg-indigo-500" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-y-4 md:grid-cols-3 md:gap-4">
          {sorted.map((account) => {
            const colors = demoAccountColors[account.kind];
            return (
            <div key={account.id} className={accountCardBaseLive}>
              <div className="flex w-full items-center gap-4">
                <span
                  className="h-10 w-1 rounded-full shadow-glow lg:w-2"
                  style={{ backgroundColor: colors.accent }}
                  aria-hidden
                />
                <div className="flex flex-1 items-center justify-between">
                  <div className="flex flex-col justify-center">
                    <p
                      className="text-[16px] font-bold lg:text-[20px]"
                      style={{ color: colors.text }}
                    >
                      {account.kind === "cash"
                        ? t("accounts.cash")
                        : account.kind === "bank"
                          ? t("accounts.bank")
                          : t("accounts.savings")}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                      {formatAccountLabel(account, locale)}
                    </p>
                  </div>
                  <div className="ml-auto flex flex-col items-end justify-center text-right">
                    <p
                      className="text-[20px] font-extrabold lg:text-[24px]"
                      style={{ color: colors.text }}
                    >
                      €{amountFormatter.format(fromCents(account.balanceEurCents))}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 lg:text-[14px]">
                      BGN {amountFormatter.format(fromCents(account.balanceBgnCents))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {!demoAccounts && (
        <IncomeModal
          open={showIncome}
          onClose={() => setShowIncome(false)}
          onCreated={refreshAccounts}
        />
      )}
    </section>
  );
}

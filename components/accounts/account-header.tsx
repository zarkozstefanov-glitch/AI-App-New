"use client";

import { useEffect, useMemo, useState } from "react";
import { type AccountSummary, useAccounts } from "@/components/accounts/accounts-context";
import { fromCents } from "@/lib/currency";
import { Landmark, PiggyBank, Wallet } from "lucide-react";
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
    ? "rounded-[2rem] border border-white/20 bg-white/40 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-lg transition hover:shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
    : "rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm";
  const accountCardBase = isDemo
    ? "w-full rounded-2xl border border-white/20 bg-white/40 p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg transition hover:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] lg:h-[120px] lg:px-10 lg:py-6"
    : "w-full rounded-2xl border border-blue-100/50 border-t-2 bg-blue-50/30 p-5 text-left shadow-sm shadow-indigo-500/5 lg:h-[120px] lg:px-10 lg:py-6";

  const summaryCards = isDemo
    ? [
        {
          id: "total",
          title: t("dashboard.totalBalance"),
          label: "Обща наличност",
          eurCents: totals.eurCents,
          bgnCents: totals.bgnCents,
          icon: Wallet,
          highlight: true,
        },
        ...sorted.map((account) => ({
          id: account.id,
          title:
            account.kind === "cash"
              ? t("accounts.cash")
              : account.kind === "bank"
                ? t("accounts.bank")
                : t("accounts.savings"),
          label: formatAccountLabel(account, locale),
          eurCents: account.balanceEurCents,
          bgnCents: account.balanceBgnCents,
          icon: account.kind === "cash" ? Wallet : account.kind === "bank" ? Landmark : PiggyBank,
          highlight: false,
        })),
      ]
    : [];

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
              <span className="text-[10px] font-medium text-slate-500">
                {t("dashboard.totalBalance")}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                €{amountFormatter.format(fromCents(totals.eurCents))} · BGN{" "}
                {amountFormatter.format(fromCents(totals.bgnCents))}
              </span>
            </div>
          }
        />
      </div>

      {isDemo ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`${accountCardBase} ${
                  card.highlight
                    ? "ring-1 ring-indigo-200/60 shadow-[0_20px_50px_rgba(79,70,229,0.2)]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {card.label}
                    </p>
                  <p className="mt-2 text-[18px] font-semibold text-slate-800">
                    €
                    <NumberTicker
                      value={fromCents(card.eurCents)}
                      format={(val) => amountFormatter.format(val)}
                    />
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    BGN{" "}
                    <NumberTicker
                      value={fromCents(card.bgnCents)}
                      format={(val) => amountFormatter.format(val)}
                    />
                  </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-y-4 md:grid-cols-3 md:gap-4">
          {sorted.map((account) => (
            <div
              key={account.id}
              className={`${accountCardBase} ${
                account.kind === "cash"
                  ? "border-t-emerald-400"
                  : account.kind === "bank"
                    ? "border-t-blue-400"
                    : "border-t-purple-400"
              }`}
            >
              <div className="flex w-full items-center gap-4">
                <span
                  className={`h-10 w-1 rounded-full lg:w-2 ${
                    account.kind === "cash"
                      ? "bg-emerald-400"
                      : account.kind === "bank"
                        ? "bg-blue-400"
                        : "bg-purple-400"
                  }`}
                  aria-hidden
                />
                <div className="flex flex-1 items-center justify-between">
                  <div className="flex flex-col justify-center">
                    <p className="text-[16px] font-bold text-slate-800 lg:text-[20px]">
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
                    <p className="text-[20px] font-extrabold text-blue-700 lg:text-[24px]">
                      €{amountFormatter.format(fromCents(account.balanceEurCents))}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 lg:text-[14px]">
                      BGN {amountFormatter.format(fromCents(account.balanceBgnCents))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

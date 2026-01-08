"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccounts } from "@/components/accounts/accounts-context";
import { fromCents } from "@/lib/currency";
import IncomeModal from "@/components/accounts/income-modal";
import PageHeader from "@/components/page-header";
import { useI18n } from "@/components/i18n-provider";
import { formatAccountLabel } from "@/lib/accounts";

export default function AccountHeader() {
  const { accounts, refreshAccounts } = useAccounts();
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
    const handler = () => refreshAccounts();
    window.addEventListener("transactions:changed", handler);
    return () => {
      window.removeEventListener("transactions:changed", handler);
    };
  }, [refreshAccounts]);

  const sorted = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const order = { cash: 0, bank: 1, savings: 2 } as Record<string, number>;
        return (order[a.kind] ?? 99) - (order[b.kind] ?? 99);
      }),
    [accounts],
  );
  const totals = useMemo(
    () =>
      accounts.reduce(
        (acc, account) => ({
          eurCents: acc.eurCents + account.balanceEurCents,
          bgnCents: acc.bgnCents + account.balanceBgnCents,
        }),
        { eurCents: 0, bgnCents: 0 },
      ),
    [accounts],
  );

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <PageHeader
          label={t("dashboard.overview")}
          title={t("dashboard.accounts")}
          subtitle={t("dashboard.profiles")}
          action={
            <div className="flex flex-col items-end gap-1 text-right">
              <button
                type="button"
                onClick={() => setShowIncome(true)}
                className="rounded-full border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                {t("dashboard.addIncome")}
              </button>
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

      <div className="mt-6 grid gap-y-4 md:grid-cols-3 md:gap-4">
        {sorted.map((account) => (
          <div
            key={account.id}
            className={`w-full rounded-2xl border border-blue-100/50 border-t-2 bg-blue-50/30 p-5 text-left shadow-sm shadow-indigo-500/5 lg:h-[120px] lg:px-10 lg:py-6 ${
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

      <IncomeModal
        open={showIncome}
        onClose={() => setShowIncome(false)}
        onCreated={refreshAccounts}
      />
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatMoney } from "@/lib/currency";
import { useI18n } from "@/components/i18n-provider";

type TransactionItem = {
  id: string;
  merchantName: string | null;
  category: string;
  transactionDate: string;
  totalEurCents: number;
  totalBgnCents: number;
  transactionType: string;
  isFixed: boolean;
};

export default function AccountHistory() {
  const { currentAccountId } = useAccounts();
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAccountId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ accountId: currentAccountId });
      const res = await fetch(`/api/transactions?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const items = (json.data ?? []) as TransactionItem[];
        if (active) setRows(items.slice(0, 6));
      }
      if (active) setLoading(false);
    };
    const handler = () => load();
    window.addEventListener("transactions:changed", handler);
    load();
    return () => {
      active = false;
      window.removeEventListener("transactions:changed", handler);
    };
  }, [currentAccountId]);

  if (!currentAccountId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t("accounts.accountHistory")}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {t("accounts.recentTransactions")}
          </h3>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-slate-600">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          {t("accounts.noAccountTransactions")}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {tx.merchantName || t("accounts.unknownSource")}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(tx.transactionDate).toLocaleDateString(
                    locale === "en" ? "en-US" : "bg-BG",
                  )}{" "}
                  ·{" "}
                  {tx.transactionType === "income"
                    ? t("transactions.income")
                    : tx.transactionType === "transfer"
                      ? t("transactions.transfer")
                      : t("transactions.expense")}{" "}
                  {tx.isFixed ? t("accounts.fixed") : t("accounts.variable")}
                </p>
              </div>
              <div className="text-right font-semibold text-slate-900">
                {formatMoney(tx.totalEurCents, tx.totalBgnCents)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

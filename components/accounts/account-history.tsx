"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAccounts } from "@/components/accounts/accounts-context";
import TransactionListItem from "@/components/transactions/transaction-list-item";
import { getCategoryLabel, getRecurringLabelForName } from "@/lib/category-ui";
import { useI18n } from "@/components/i18n-provider";

export type TransactionItem = {
  id: string;
  merchantName: string | null;
  category: string;
  transactionDate: string;
  totalEurCents: number;
  totalBgnCents: number;
  transactionType: string;
  isFixed: boolean;
};

type AccountHistoryProps = {
  demoRows?: TransactionItem[];
  headerLabel?: string;
  headerTitle?: string;
  showViewAll?: boolean;
  uiForCategory?: (category: string) => { backgroundColor: string; textColor: string };
  demoMode?: boolean;
};

export default function AccountHistory({
  demoRows,
  headerLabel,
  headerTitle,
  showViewAll = true,
  uiForCategory,
  demoMode = false,
}: AccountHistoryProps) {
  const { currentAccountId } = useAccounts();
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoRows) {
      setRows(demoRows);
      setLoading(false);
      return;
    }
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
  }, [currentAccountId, demoRows]);

  if (!currentAccountId && !demoRows) return null;

  const cardClassName = demoMode
    ? "rounded-2xl border border-white/20 bg-white/40 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-lg transition hover:shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
    : "rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-md";

  return (
    <section className={cardClassName}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {headerLabel ?? t("accounts.accountHistory")}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {headerTitle ?? t("accounts.recentTransactions")}
          </h3>
        </div>
        {showViewAll && (
          <Link
            href="/transactions"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            {t("dashboard.viewAll")}
          </Link>
        )}
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-slate-600">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          {t("accounts.noAccountTransactions")}
        </p>
      ) : (
        <div className="mt-4 text-sm">
          {rows.map((tx) => {
            const merchantLabel = tx.isFixed
              ? getRecurringLabelForName(tx.merchantName, locale)
              : tx.merchantName;
            const dateLabel = tx.transactionDate
              ? format(new Date(tx.transactionDate), "dd.MM.yyyy")
              : t("common.noDate");
            const categoryLabel = getCategoryLabel(tx.category, locale);
            return (
              <TransactionListItem
                key={tx.id}
                title={merchantLabel || t("accounts.unknownSource")}
                subtitle={`${categoryLabel} • ${dateLabel}`}
                categoryName={tx.category}
                uiOverride={uiForCategory?.(tx.category)}
                transactionType={
                  tx.transactionType as "income" | "expense" | "transfer"
                }
                isFixed={tx.isFixed}
                transactionDate={tx.transactionDate}
                amountEurCents={tx.totalEurCents}
                amountBgnCents={tx.totalBgnCents}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

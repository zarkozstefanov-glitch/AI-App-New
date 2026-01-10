"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import TransactionListItem from "@/components/transactions/transaction-list-item";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { getCategoryLabel, getRecurringLabelForName } from "@/lib/category-ui";
import { ChevronRight, History } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type TransactionRow = {
  id: string;
  merchantName: string | null;
  transactionDate: string | null;
  totalEurCents: number;
  totalBgnCents: number;
  category: string;
  categoryConfidence: number;
  overallConfidence: number;
  sourceType: string;
  originalImageUrl?: string | null;
  transactionType: "income" | "expense" | "transfer";
  accountId: string;
  transferAccountId?: string | null;
  isFixed: boolean;
  isEdited?: boolean;
};

export default function RecentTransactions() {
  const { t, locale } = useI18n();
  const { accounts } = useAccounts();
  const accountLabelById = new Map(
    accounts.map((account) => [account.id, formatAccountLabel(account, locale)]),
  );
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/transactions?limit=7", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const items = (json.data ?? []) as TransactionRow[];
        if (active) setRows(items);
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
  }, []);

  return (
    <section className="w-full overflow-hidden rounded-3xl border border-white/40 bg-white/20 shadow-glow backdrop-blur-3xl animate-float">
      <div className="flex w-full items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t("transactions.historyLabel")}
          </p>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <History className="h-4 w-4 text-slate-500" />
            {t("dashboard.lastOperations")}
          </h3>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          {t("dashboard.viewAll")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {loading ? (
        <p className="px-4 pb-4 text-sm text-slate-600">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-600">
          {t("dashboard.noRecent")}
        </p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto text-sm scrollbar-hide">
          {rows.map((row) => {
            const merchantLabel = row.isFixed
              ? getRecurringLabelForName(row.merchantName, locale)
              : row.merchantName;
            return (
              <TransactionListItem
                key={row.id}
                title={merchantLabel || t("transactions.unknownMerchant")}
                subtitle={`${
                  row.transactionType === "transfer"
                    ? `${accountLabelById.get(row.accountId) ?? t("transactions.fromAccount")} → ${
                        accountLabelById.get(row.transferAccountId ?? "") ??
                        t("transactions.toAccount")
                      }`
                    : getCategoryLabel(row.category, locale)
                } • ${
                  row.transactionDate
                    ? format(new Date(row.transactionDate), "dd.MM.yyyy HH:mm")
                    : t("common.noDate")
                }`}
                meta={
                  row.sourceType === "manual"
                    ? t("transactions.manualEntry")
                    : t("transactions.confidence", {
                        category: (row.categoryConfidence * 100).toFixed(0),
                        overall: (row.overallConfidence * 100).toFixed(0),
                      })
                }
                categoryName={row.category}
                imageUrl={row.originalImageUrl}
                transactionType={row.transactionType}
                isFixed={row.isFixed}
                transactionDate={row.transactionDate}
                amountEurCents={row.totalEurCents}
                amountBgnCents={row.totalBgnCents}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

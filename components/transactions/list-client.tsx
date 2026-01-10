"use client";
/* eslint-disable react-hooks/static-components */

import { useEffect, useMemo, useRef, useState } from "react";
import { categoryConfig } from "@/lib/categories";
import { recurringGroups } from "@/lib/recurring";
import { safeFetchJson } from "@/lib/safe-fetch";
import { formatMoney, fromCents } from "@/lib/currency";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronRight, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import {
  getCategoryIcon,
  getCategoryLabel,
  getCategoryUI,
  getRecurringLabelForName,
} from "@/lib/category-ui";
import { useI18n } from "@/components/i18n-provider";
import { translations } from "@/lib/i18n/translations";

type Transaction = {
  id: string;
  merchantName: string | null;
  transactionDate: string | null;
  totalBgnCents: number;
  totalEurCents: number;
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
  notes?: string | null;
};

type TransactionRowProps = {
  tx: Transaction;
  amountFormatter: Intl.NumberFormat;
  categoryLabel: string;
  actions?: React.ReactNode;
};

const TransactionRow = ({
  tx,
  amountFormatter,
  categoryLabel,
  actions,
}: TransactionRowProps) => {
  const { t, locale } = useI18n();
  const [now] = useState(() => Date.now());
  const Icon = useMemo(() => getCategoryIcon(tx.category), [tx.category]);
  const ui = getCategoryUI(tx.category);
  const eurCents = Math.abs(tx.totalEurCents);
  const bgnCents = Math.abs(tx.totalBgnCents);
  const dateLabel = tx.transactionDate
    ? format(new Date(tx.transactionDate), "dd.MM.yyyy HH:mm")
    : t("common.noDate");
  const rawMerchantLabel = tx.isFixed
    ? getRecurringLabelForName(tx.merchantName, locale)
    : tx.merchantName;
  const merchantLabel =
    tx.transactionType === "transfer" &&
    (!rawMerchantLabel || ["transfer", "transfers"].includes(rawMerchantLabel.trim().toLowerCase()))
      ? t("transactions.transfer")
      : rawMerchantLabel;
  const isFuture =
    !!tx.transactionDate && new Date(tx.transactionDate).getTime() > now;
  const statusLabel =
    tx.transactionType === "income"
      ? t("transactions.statusIncome")
      : tx.transactionType === "transfer"
        ? t("transactions.statusTransfer")
        : tx.transactionType === "expense"
          ? tx.isFixed
            ? t("transactions.statusFixedExpense")
            : t("transactions.statusExpense")
          : t("transactions.statusExpense");
  const statusTone = isFuture ? "text-violet-400" : "text-violet-600";
  const amountTone = isFuture
    ? "text-slate-400"
    : tx.transactionType === "income"
      ? "text-emerald-500"
      : tx.transactionType === "expense"
        ? "text-rose-600"
        : "text-sky-500";
  const titleTone = isFuture ? "text-slate-400" : "text-slate-800";
  const categoryTone = isFuture ? "text-slate-400" : "text-slate-500";
  const metaTone = isFuture ? "text-slate-400" : "text-slate-400";
  const editTone = isFuture ? "text-slate-400" : "text-slate-500";

  return (
    <div className="flex w-full items-center justify-between border-b border-white/30 px-4 py-4 last:border-0">
      <div className="flex shrink-0 items-center justify-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl md:h-14 md:w-14"
          style={{ backgroundColor: ui.backgroundColor }}
        >
          <Icon className="h-4 w-4 md:h-6 md:w-6" style={{ color: ui.textColor }} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3">
        <p className={`truncate text-[13px] font-bold md:text-[17px] ${titleTone}`}>
          {merchantLabel?.trim() || t("transactions.unknownMerchant")}
        </p>
        <span className={`text-[10px] ${categoryTone}`}>{categoryLabel}</span>
        <div className={`flex flex-col text-[10px] leading-tight ${metaTone}`}>
          <span className="truncate">{dateLabel}</span>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap pr-2 text-right">
        <span className={`text-[14px] font-bold md:text-[18px] ${amountTone}`}>
          €{amountFormatter.format(fromCents(eurCents))}
        </span>
        <span
          className={`text-[10px] md:text-[12px] ${
            isFuture ? "text-slate-400" : "text-slate-500"
          }`}
        >
          BGN {amountFormatter.format(fromCents(bgnCents))}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${statusTone}`}>
          {statusLabel}
        </span>
        {tx.isEdited && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${editTone}`}>
            {t("transactions.edited")}
          </span>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </div>
  );
};

export default function ListClient() {
  const { accounts } = useAccounts();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const getCurrentMonthRange = () => {
    const now = new Date();
    return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    };
  };

  const [filters, setFilters] = useState(() => ({
    ...getCurrentMonthRange(),
    search: "",
    accountId: "",
    operationType: "",
    entryMethod: "",
    category: "",
  }));
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const order = { cash: 0, bank: 1, savings: 2 } as Record<string, number>;
        return (order[a.kind] ?? 99) - (order[b.kind] ?? 99);
      }),
    [accounts],
  );
  const accountLabelById = useMemo(
    () =>
      new Map(
        accounts.map((account) => [account.id, formatAccountLabel(account, locale)]),
      ),
    [accounts, locale],
  );
  const labelForCategory = (value: string) => getCategoryLabel(value, locale);
  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const incomeCategories = translations[locale].categories.income;
  const fixedCategories = useMemo(
    () =>
      recurringGroups.map((group) => ({
        value: group.value,
        label: locale === "en" ? group.labelEn : group.label,
      })),
    [locale],
  );
  const expenseCategories = useMemo(
    () =>
      Object.entries(categoryConfig).map(([key, meta]) => ({
        value: key,
        label: locale === "en" ? meta.labelEn : meta.label,
      })),
    [locale],
  );
  const categoryOptionsForType = useMemo(() => {
    if (filters.operationType === "income") {
      return incomeCategories.map((item) => ({ value: item, label: item }));
    }
    if (filters.operationType === "expense") {
      if (filters.entryMethod === "fixed") return fixedCategories;
      if (filters.entryMethod === "manual" || filters.entryMethod === "ai") {
        return expenseCategories;
      }
    }
    return [];
  }, [
    filters.operationType,
    filters.entryMethod,
    fixedCategories,
    expenseCategories,
    incomeCategories,
  ]);

  const fetchData = async (nextFilters?: typeof filters) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const activeFilters = nextFilters ?? filters;
    if (activeFilters.from) {
      params.set("from", activeFilters.from);
    }
    if (activeFilters.to) {
      params.set("to", activeFilters.to);
    }
    const res = await safeFetchJson<{ ok: true; data: Transaction[] }>(
      `/api/transactions?${params.toString()}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      const translated = t(res.error);
      setError(translated !== res.error ? translated : res.error);
      setTransactions([]);
      setLoading(false);
      return;
    }
    setTransactions(res.data.data);
    setLoading(false);
  };

  const handleFilter = (event?: React.FormEvent) => {
    event?.preventDefault();
    fetchData({
      from: filters.from,
      to: filters.to,
      search: filters.search,
      accountId: filters.accountId,
      operationType: filters.operationType,
      entryMethod: filters.entryMethod,
      category: filters.category,
    });
  };

  useEffect(() => {
    fetchData(filters);
    const handler = () => fetchData(filtersRef.current);
    window.addEventListener("transactions:changed", handler);
    return () => {
      window.removeEventListener("transactions:changed", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filters.accountId && tx.accountId !== filters.accountId) return false;
      if (filters.operationType && tx.transactionType !== filters.operationType)
        return false;
      if (filters.entryMethod === "manual") {
        if (tx.sourceType !== "manual" || tx.isFixed) return false;
      } else if (filters.entryMethod === "ai") {
        if (tx.sourceType !== "receipt" || tx.isFixed) return false;
      } else if (filters.entryMethod === "fixed") {
        if (!tx.isFixed) return false;
      }
      if (filters.category && tx.category !== filters.category) return false;
      if (search) {
        const merchant = (tx.merchantName ?? "").toLowerCase();
        const notes = (tx.notes ?? "").toLowerCase();
        if (!merchant.includes(search) && !notes.includes(search)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { eurCents: number; bgnCents: number }>();
    for (const tx of filteredTransactions) {
      if (tx.transactionType !== "expense") continue;
      const current = map.get(tx.category) ?? { eurCents: 0, bgnCents: 0 };
      current.eurCents += tx.totalEurCents;
      current.bgnCents += tx.totalBgnCents;
      map.set(tx.category, current);
    }
    return Array.from(map.entries())
      .map(([category, totals]) => ({ category, ...totals }))
      .sort((a, b) => b.eurCents - a.eurCents);
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        sortDate: Date | null;
        items: Transaction[];
        totalEurCents: number;
        totalBgnCents: number;
      }
    >();

    for (const tx of filteredTransactions) {
      const date = tx.transactionDate ? new Date(tx.transactionDate) : null;
      const key = date ? format(date, "yyyy-MM-dd") : "no-date";

      const group = groups.get(key) || {
        label: date ? format(date, "dd.MM.yyyy") : t("common.noDate"),
        sortDate: date,
        items: [],
        totalEurCents: 0,
        totalBgnCents: 0,
      };

      group.items.push(tx);
      group.totalEurCents += tx.totalEurCents;
      group.totalBgnCents += tx.totalBgnCents;
      groups.set(key, group);
    }

    return Array.from(groups.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => {
        if (!a.sortDate) return 1;
        if (!b.sortDate) return -1;
        return b.sortDate.getTime() - a.sortDate.getTime();
      });
  }, [filteredTransactions, t]);

  return (
    <div className="w-full space-y-4">
      <form
        onSubmit={handleFilter}
        className="w-full rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow backdrop-blur-3xl lg:p-6"
      >
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:col-span-2 lg:col-span-2">
            <label className="text-xs text-slate-600">
              {t("transactions.fromDate")}
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-white/40 bg-white/30 px-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
            <label className="text-xs text-slate-600">
              {t("transactions.toDate")}
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-white/40 bg-white/30 px-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
          </div>
          <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-1">
            {t("transactions.accountFilter")}
            <select
              value={filters.accountId}
              onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
              className="mt-1 h-9 w-full rounded-xl border border-white/40 bg-white/30 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
            >
              <option value="">{t("common.all")}</option>
              {sortedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {formatAccountLabel(acc, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-1">
            {t("transactions.typeOperation")}
            <select
              value={filters.operationType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  operationType: e.target.value,
                  entryMethod: "",
                  category: "",
                }))
              }
              className="mt-1 h-9 w-full rounded-xl border border-white/40 bg-white/30 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
            >
              <option value="">{t("common.all")}</option>
              <option value="income">{t("transactions.income")}</option>
              <option value="expense">{t("transactions.expense")}</option>
              <option value="transfer">{t("transactions.transfer")}</option>
            </select>
          </label>
          {filters.operationType === "expense" && (
            <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-1">
            {t("transactions.entryMethod")}
              <select
                value={filters.entryMethod}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    entryMethod: e.target.value,
                    category: "",
                  }))
                }
                className="mt-1 h-9 w-full rounded-xl border border-white/40 bg-white/30 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                <option value="">{t("common.all")}</option>
                <option value="manual">{t("transactions.manual")}</option>
                <option value="ai">{t("transactions.ai")}</option>
                <option value="fixed">{t("transactions.fixed")}</option>
              </select>
            </label>
          )}
          {(filters.operationType === "income" ||
            (filters.operationType === "expense" &&
              (filters.entryMethod === "manual" ||
                filters.entryMethod === "ai" ||
                filters.entryMethod === "fixed"))) && (
            <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-1">
              {filters.operationType === "income"
                ? t("transactions.incomeCategory")
                : filters.entryMethod === "fixed"
                  ? t("transactions.fixedCategory")
                  : t("transactions.expenseCategory")}
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
                className="mt-1 h-9 w-full rounded-xl border border-white/40 bg-white/30 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                <option value="">{t("common.all")}</option>
                {categoryOptionsForType.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-2">
            {t("transactions.search")}
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder={t("transactions.searchPlaceholder")}
              className="mt-1 h-9 w-full rounded-xl border border-white/40 bg-white/30 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              const range = getCurrentMonthRange();
              const cleared = {
                ...range,
                category: "",
                search: "",
                accountId: "",
                operationType: "",
                entryMethod: "",
              };
              setFilters(cleared);
              fetchData(cleared);
            }}
            className="flex-1 rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/40 sm:flex-none"
          >
            {t("common.clear")}
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-white/40 sm:flex-none"
          >
            {t("common.filter")}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-sm text-slate-700 shadow-glow backdrop-blur-3xl">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("common.loading")}
        </div>
      ) : (
        <div className="grid gap-3">
          {categoryTotals.length > 0 && (
            <div className="rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow backdrop-blur-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("transactions.amountCategoryTitle")}
              </p>
              <div className="mt-3 md:hidden">
                <button
                  type="button"
                  onClick={() => setShowCategoryFilters((open) => !open)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/30 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                >
                  <Filter className="h-4 w-4 text-slate-600" />
                  {t("transactions.filterByCategory")}
                </button>
                {showCategoryFilters && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/40 bg-white/30 p-2">
                    {categoryTotals.map((cat) => (
                      <button
                        key={cat.category}
                        onClick={() => {
                          const next = { ...filters, category: cat.category };
                          setFilters(next);
                          fetchData(next);
                          setShowCategoryFilters(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-white/40"
                      >
                        <span className="text-slate-900">
                          {labelForCategory(cat.category)}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(cat.eurCents, cat.bgnCents)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 hidden gap-2 md:grid md:grid-cols-2 lg:grid-cols-3">
                {categoryTotals.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      const next = { ...filters, category: cat.category };
                      setFilters(next);
                      fetchData(next);
                    }}
                    className="flex items-center justify-between rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-xs text-slate-700 hover:bg-white/40"
                  >
                    <span className="text-slate-900">
                      {labelForCategory(cat.category)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(cat.eurCents, cat.bgnCents)}
                    </span>
                  </button>
                  ))}
              </div>
            </div>
          )}
          {groupedTransactions.map((group) => {
            const items = group.items;
            return (
              <div key={group.key} className="space-y-3">
                <div className="px-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-white/40 bg-white/20 shadow-glow backdrop-blur-3xl sm:max-w-none">
                  {items.map((tx) => {
                      return (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          amountFormatter={amountFormatter}
                          categoryLabel={
                            tx.transactionType === "transfer"
                              ? `${accountLabelById.get(tx.accountId) ?? t("transactions.fromAccount")} → ${
                                  accountLabelById.get(tx.transferAccountId ?? "") ??
                                  t("transactions.toAccount")
                                }`
                              : getCategoryLabel(tx.category, locale)
                          }
                          actions={
                            <Link
                              href={`/transactions/${tx.id}`}
                              prefetch={false}
                              className="rounded-full border border-white/40 bg-white/30 p-1 text-slate-600 transition hover:bg-white/40"
                              aria-label={t("common.details")}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          }
                        />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!filteredTransactions.length && (
            <div className="rounded-xl border border-dashed border-white/40 bg-white/20 p-6 text-center text-sm text-slate-600 shadow-glow backdrop-blur-3xl">
              {t("transactions.noTransactions")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

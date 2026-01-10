"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { safeFetchJson } from "@/lib/safe-fetch";
import { convertCents, formatMoney, toCents } from "@/lib/currency";
import { getCategoryOptionsForLocale, type CategoryKey } from "@/lib/categories";
import { recurringGroups, getRecurringGroupLabel, getRecurringItemLabel } from "@/lib/recurring";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { useI18n } from "@/components/i18n-provider";

type RecurringTemplate = {
  id: string;
  name: string;
  amount: number;
  category: string;
  subCategory: string;
  paymentDay: number;
  accountId?: string | null;
  note?: string | null;
};

type ManualTransactionFormProps = {
  templateId?: string | null;
  fixedOnly?: boolean;
};

export default function ManualTransactionForm({
  templateId,
  fixedOnly = false,
}: ManualTransactionFormProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const today = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );
  const fixedOptions = useMemo(
    () =>
      recurringGroups.map((group) => ({
        value: group.value,
        label: getRecurringGroupLabel(group, locale),
      })),
    [locale],
  );
  const [form, setForm] = useState({
    date: today,
    merchantName: "",
    category: fixedOnly ? fixedOptions[0]?.value ?? "other" : "other",
    subCategory: fixedOnly ? recurringGroups[0]?.items?.[0] ?? "" : "",
    amount: "",
    currency: "EUR",
    notes: "",
    accountId: "",
  });
  const subCategoryOptions = useMemo(() => {
    const group = recurringGroups.find((item) => item.value === form.category);
    return group?.items ?? [];
  }, [form.category]);
  const { accounts, currentAccountId } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");
  useEffect(() => {
    if (currentAccountId && !form.accountId) {
      setForm((current) => ({ ...current, accountId: currentAccountId }));
    }
  }, [currentAccountId, form.accountId]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      category: fixedOnly ? fixedOptions[0]?.value ?? "other" : "other",
      subCategory: fixedOnly ? recurringGroups[0]?.items?.[0] ?? "" : "",
    }));
  }, [fixedOnly, fixedOptions]);

  useEffect(() => {
    if (!fixedOnly) return;
    setForm((current) => ({
      ...current,
      subCategory: subCategoryOptions[0] ?? "",
    }));
  }, [fixedOnly, subCategoryOptions]);

  useEffect(() => {
    if (!templateId) return;
    const load = async () => {
      const res = await safeFetchJson<{ ok: true; data: RecurringTemplate }>(
        `/api/recurring/${templateId}`,
      );
      if (!res.ok) return;
      setForm((current) => ({
        ...current,
        merchantName: res.data.data.name,
        amount: res.data.data.amount.toString(),
        notes: res.data.data.note ?? "",
        accountId: res.data.data.accountId ?? current.accountId,
        category: res.data.data.subCategory ?? current.category,
        subCategory: res.data.data.name ?? current.subCategory,
      }));
    };
    load();
  }, [templateId]);

  const preview = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount)) return null;
    const cents = toCents(amount);
    return convertCents(cents, form.currency);
  }, [form.amount, form.currency]);

  const save = async () => {
    setLoading(true);
    setMessage("");
    setStatus("");
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage(t("transactions.invalidAmount"));
      setStatus("error");
      setLoading(false);
      return;
    }
    if (!form.accountId) {
      setMessage(t("transactions.pickAccount"));
      setStatus("error");
      setLoading(false);
      return;
    }

    const response = await safeFetchJson("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date || null,
        accountId: form.accountId,
        transactionType: "expense",
        isFixed: fixedOnly,
        merchant: fixedOnly ? form.subCategory : form.merchantName,
        category: form.category,
        amount,
        currency: form.currency,
        note: form.notes || undefined,
      }),
    });

    if (!response.ok) {
      const translated = t(response.error);
      setMessage(translated !== response.error ? translated : response.error);
      setStatus("error");
      setLoading(false);
      return;
    }

    setMessage(t("transactions.expenseSaved"));
    setStatus("success");
    setLoading(false);
    window.dispatchEvent(new CustomEvent("transactions:changed"));
    router.push("/transactions");
    router.refresh();
  };

  return (
    <div className="w-full max-w-full box-border space-y-2 overflow-x-hidden">
      <div className="grid w-full max-w-full gap-2 lg:grid-cols-2 lg:auto-rows-fr lg:gap-4">
        <div className="w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.amount")}
          </p>
          <div className="flex min-h-[44px] h-auto flex-nowrap items-center rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 box-border sm:min-h-[52px] sm:px-4">
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="flex-1 border-none bg-transparent text-left text-[13px] font-bold text-slate-900 leading-tight outline-none"
            />
            <span className="mx-2 h-4 w-px bg-white/30 sm:mx-3 sm:h-5" />
            <div className="relative ml-1 flex items-center">
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="appearance-none bg-transparent pr-3 text-[13px] font-bold text-slate-700 leading-tight whitespace-normal break-words outline-none"
              >
                <option value="EUR">EUR</option>
                <option value="BGN">BGN</option>
              </select>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-indigo-600">
                ⌄
              </span>
            </div>
          </div>
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.category")}
          </p>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value as CategoryKey }))
            }
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:min-h-[52px] sm:px-6"
          >
            {(fixedOnly ? fixedOptions : getCategoryOptionsForLocale(locale)).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {fixedOnly ? (
          <div className="h-full w-full max-w-full -mt-2 rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 lg:mt-0 box-border">
            <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
              {t("transactions.subCategory")}
            </p>
            <select
              value={form.subCategory}
              onChange={(e) =>
                setForm((f) => ({ ...f, subCategory: e.target.value }))
              }
              className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:min-h-[52px] sm:px-6"
            >
              {subCategoryOptions.map((item) => (
                <option key={item} value={item}>
                  {getRecurringItemLabel(
                    recurringGroups.find((group) => group.value === form.category) ??
                      recurringGroups[0],
                    item,
                    locale,
                  )}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
            <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
              {t("transactions.merchant")}
            </p>
            <input
              value={form.merchantName}
              onChange={(e) =>
                setForm((f) => ({ ...f, merchantName: e.target.value }))
              }
              className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:min-h-[52px] sm:px-6"
            />
          </div>
        )}

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.account")}
          </p>
          <select
            value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:min-h-[52px] sm:px-6"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {formatAccountLabel(acc, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.date")}
          </p>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:min-h-[52px] sm:px-6"
          />
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.note")}
          </p>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:h-auto sm:px-6 sm:py-3"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      )}
      <button
        onClick={save}
        disabled={loading}
        className="mx-auto mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 px-12 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-60 lg:w-1/2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("transactions.saveTransaction")}
      </button>
      {preview && (
        <p className="text-xs text-slate-600">
          {formatMoney(preview.eurCents, preview.bgnCents)}
        </p>
      )}
    </div>
  );
}

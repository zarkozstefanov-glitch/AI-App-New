"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { safeFetchJson } from "@/lib/safe-fetch";
import { useI18n } from "@/components/i18n-provider";
import { translations } from "@/lib/i18n/translations";

type IncomeCategory =
  (typeof translations.bg.categories.income)[number] |
  (typeof translations.en.categories.income)[number];

export default function IncomeForm() {
  const router = useRouter();
  const { accounts, currentAccountId } = useAccounts();
  const { t, locale } = useI18n();
  const incomeCategories = useMemo(
    () => translations[locale].categories.income,
    [locale],
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");

  const [form, setForm] = useState<{
    date: string;
    accountId: string;
    category: IncomeCategory;
    source: string;
    amount: string;
    currency: string;
    note: string;
  }>({
    date: today,
    accountId: currentAccountId ?? "",
    category: incomeCategories[0],
    source: "",
    amount: "",
    currency: "EUR",
    note: "",
  });

  useEffect(() => {
    if (!incomeCategories.length) return;
    setForm((current) =>
      (incomeCategories as readonly IncomeCategory[]).includes(current.category)
        ? current
        : { ...current, category: incomeCategories[0] },
    );
  }, [incomeCategories]);

  useEffect(() => {
    if (currentAccountId && !form.accountId) {
      setForm((current) => ({ ...current, accountId: currentAccountId }));
    }
  }, [currentAccountId, form.accountId]);

  const submit = async () => {
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
        transactionType: "income",
        isFixed: false,
        merchant: form.source || form.category,
        category: form.category,
        amount,
        currency: form.currency,
        note: form.note || undefined,
      }),
    });

    if (!response.ok) {
      const translated = t(response.error);
      setMessage(translated !== response.error ? translated : response.error);
      setStatus("error");
      setLoading(false);
      return;
    }

    setMessage(t("transactions.incomeSaved"));
    setStatus("success");
    setLoading(false);
    window.dispatchEvent(new CustomEvent("transactions:changed"));
    router.push("/transactions");
    router.refresh();
  };

  return (
    <div className="w-full max-w-full box-border overflow-x-hidden space-y-2">
      <div className="grid w-full max-w-full gap-2 lg:grid-cols-2 lg:auto-rows-fr lg:gap-4">
        <div className="w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.amount")}
          </p>
          <div className="flex min-h-[44px] h-auto flex-nowrap items-center rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 box-border sm:h-[52px] sm:px-4">
            <div className="relative mr-2 flex items-center">
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
            <span className="mx-2 h-4 w-px bg-white/30 sm:mx-3 sm:h-5" />
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="flex-1 border-none bg-transparent text-left text-[13px] font-bold text-slate-900 leading-tight outline-none"
            />
          </div>
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.category")}
          </p>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value as IncomeCategory,
              }))
            }
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:h-[52px] sm:px-6"
          >
            {(incomeCategories ?? []).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.merchant")}
          </p>
          <input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder={t("transactions.sourcePlaceholder")}
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:h-[52px] sm:px-6"
          />
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.account")}
          </p>
          <select
            value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:h-[52px] sm:px-6"
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
            className="mt-1.5 min-h-[44px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 text-center text-[13px] text-slate-700 leading-tight whitespace-normal break-words outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 box-border sm:h-[52px] sm:px-6"
          />
        </div>

        <div className="h-full w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.note")}
          </p>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
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
        onClick={submit}
        disabled={loading}
        className="mx-auto mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 px-12 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-60 lg:w-1/2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("transactions.saveIncome")}
      </button>
    </div>
  );
}

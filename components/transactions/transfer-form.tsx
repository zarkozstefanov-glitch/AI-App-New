"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { useI18n } from "@/components/i18n-provider";

export default function TransferForm() {
  const { accounts } = useAccounts();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fromAccountId: accounts[0]?.id ?? "",
    toAccountId: accounts[1]?.id ?? "",
    amount: "",
    currency: "EUR",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (accounts.length === 0) return;
    setForm((current) => ({
      ...current,
      fromAccountId: current.fromAccountId || accounts[0]?.id || "",
      toAccountId: current.toAccountId || accounts[1]?.id || accounts[0]?.id || "",
    }));
  }, [accounts]);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount)) {
      setMessage(t("transactions.invalidAmount"));
      setLoading(false);
      return;
    }
    if (!form.fromAccountId || !form.toAccountId) {
      setMessage(t("transactions.pickAccounts"));
      setLoading(false);
      return;
    }
    if (form.fromAccountId === form.toAccountId) {
      setMessage(t("transactions.differentAccounts"));
      setLoading(false);
      return;
    }
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount,
        currency: form.currency,
        date: form.date,
      }),
    });
    if (!res.ok) {
      setMessage(t("transactions.transferError"));
      setLoading(false);
      return;
    }
    setMessage(t("transactions.transferSaved"));
    setLoading(false);
    window.dispatchEvent(new CustomEvent("transactions:changed"));
  };

  return (
    <div className="w-full max-w-full box-border overflow-x-hidden space-y-2">
      <div className="grid w-full max-w-full gap-2 lg:grid-cols-2 lg:auto-rows-fr lg:gap-4">
        <div className="w-full max-w-full rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-center shadow-glow backdrop-blur-3xl sm:p-5 box-border">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400 inline-flex items-center justify-center rounded-md bg-white/30 px-2 py-0.5 mx-auto">
            {t("transactions.amount")}
          </p>
          <div className="flex min-h-[44px] h-auto flex-nowrap items-center rounded-xl border border-white/40 bg-white/30 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1 box-border sm:h-[52px] sm:px-4">
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
            {t("transactions.fromAccount")}
          </p>
          <select
            value={form.fromAccountId}
            onChange={(e) => setForm((f) => ({ ...f, fromAccountId: e.target.value }))}
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
            {t("transactions.toAccount")}
          </p>
          <select
            value={form.toAccountId}
            onChange={(e) => setForm((f) => ({ ...f, toAccountId: e.target.value }))}
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
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="mx-auto mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 px-12 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-60 lg:w-1/2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("transactions.saveTransfer")}
      </button>
    </div>
  );
}

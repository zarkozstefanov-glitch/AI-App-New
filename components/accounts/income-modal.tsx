"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { useI18n } from "@/components/i18n-provider";
import { translations } from "@/lib/i18n/translations";

type IncomeCategory =
  (typeof translations.bg.categories.income)[number] |
  (typeof translations.en.categories.income)[number];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function IncomeModal({ open, onClose, onCreated }: Props) {
  const { accounts, currentAccountId } = useAccounts();
  const { t, locale } = useI18n();
  const incomeCategories = translations[locale].categories.income;
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

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
    currency: "BGN",
    note: "",
  });

  useEffect(() => {
    if (currentAccountId && !form.accountId) {
      setForm((current) => ({ ...current, accountId: currentAccountId }));
    }
  }, [currentAccountId, form.accountId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (!form.accountId || !form.amount) {
      setLoading(false);
      return;
    }
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        accountId: form.accountId,
        transactionType: "income",
        isFixed: false,
        merchant: form.source || form.category,
        category: form.category,
        amount: Number(form.amount),
        currency: form.currency,
        paymentMethod: "income",
        note: form.note || null,
      }),
    });
    setLoading(false);
    onCreated?.();
    onClose();
    window.dispatchEvent(new CustomEvent("transactions:changed"));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("transactions.income")}
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("dashboard.addIncome").replace("+ ", "")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 p-2 text-slate-500 hover:bg-white/60"
          >
            <X size={16} />
          </button>
        </div>
        <form className="mt-3 space-y-2" onSubmit={submit}>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block">{t("transactions.date")}</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
            />
          </label>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block">{t("transactions.account")}</span>
            <select
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {formatAccountLabel(acc, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block">{t("transactions.category")}</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as IncomeCategory,
                }))
              }
              className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
            >
              {incomeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block">{t("transactions.merchant")}</span>
            <input
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder={t("transactions.sourcePlaceholder")}
              className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="text-xs text-slate-600">
              <span className="mb-1 block">{t("transactions.amount")}</span>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
              />
            </label>
            <label className="text-xs text-slate-600">
              <span className="mb-1 block">{t("upload.currency")}</span>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="h-[38px] w-full rounded-lg border border-white/40 bg-white/30 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
              >
                <option value="BGN">BGN</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block">{t("transactions.note")}</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="min-h-[64px] w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400/60 focus:bg-white/60"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-white/60 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("profile.save")}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

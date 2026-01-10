"use client";

import { useMemo, useState } from "react";
import { Loader2, AtSign } from "lucide-react";
import { convertCents, formatMoney, toCents } from "@/lib/currency";
import { useI18n } from "@/components/i18n-provider";

type Props = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  monthlyBudgetGoal?: number | null;
};

export default function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
  monthlyBudgetGoal,
}: Props) {
  const [form, setForm] = useState({
    firstName,
    lastName,
    phone,
    monthlyBudgetGoal: monthlyBudgetGoal ?? "",
    budgetCurrency: "BGN",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { t } = useI18n();

  const budgetPreview = useMemo(() => {
    const amount = Number(form.monthlyBudgetGoal);
    if (!form.monthlyBudgetGoal || Number.isNaN(amount)) return null;
    const cents = toCents(amount);
    return convertCents(cents, form.budgetCurrency);
  }, [form.monthlyBudgetGoal, form.budgetCurrency]);

  const save = async () => {
    setLoading(true);
    setMessage("");
    const totals = budgetPreview;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyBudgetGoal: form.monthlyBudgetGoal
          ? totals
            ? totals.bgnCents / 100
            : Number(form.monthlyBudgetGoal)
          : null,
      }),
    });
    if (res.ok) {
      setMessage(t("profile.saved"));
    } else {
      setMessage(t("profile.saveError"));
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-3xl">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <label className="text-sm text-slate-700">
          {t("profile.firstName")}
          <input
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
          />
        </label>
        <label className="text-sm text-slate-700">
          {t("profile.lastName")}
          <input
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
          />
        </label>
        <label className="text-sm text-slate-700">
          {t("profile.phone")}
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
          />
        </label>
        <label className="text-sm text-slate-500">
          {t("profile.email")}
          <div className="relative mt-1">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={email}
              readOnly
              disabled
              className="w-full rounded-lg border border-white/40 bg-white/30 px-9 py-2 text-slate-700"
            />
          </div>
        </label>
        <label className="text-sm text-slate-700">
          {t("profile.budget")}
          <input
            type="number"
            value={form.monthlyBudgetGoal}
            onChange={(e) =>
              setForm((f) => ({ ...f, monthlyBudgetGoal: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
          />
        </label>
        <label className="text-sm text-slate-700">
          {t("profile.currency")}
          <select
            value={form.budgetCurrency}
            onChange={(e) => setForm((f) => ({ ...f, budgetCurrency: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
          >
            <option value="BGN">BGN</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
      </div>
      {Number(form.monthlyBudgetGoal) > 0 && !Number.isNaN(Number(form.monthlyBudgetGoal)) && (
        <p className="mt-3 text-xs text-slate-600">
          {budgetPreview
            ? formatMoney(budgetPreview.eurCents, budgetPreview.bgnCents)
            : null}
        </p>
      )}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      <button
        onClick={save}
        disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-200/70 bg-gradient-to-r from-cyan-200 to-blue-200 px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_8px_20px_rgba(14,116,144,0.15)] disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("profile.save")}
      </button>
    </div>
  );
}

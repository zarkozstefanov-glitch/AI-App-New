"use client";

import { useEffect, useState, useTransition } from "react";
import { categoryConfig } from "@/lib/categories";
import { format } from "date-fns";
import { formatMoney, fromCents } from "@/lib/currency";
import { ArrowLeft, Loader2, RotateCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { editTransactionAction } from "@/app/actions/transactions";
import { useI18n } from "@/components/i18n-provider";

type LineItem = {
  id: string;
  name: string | null;
  quantity: number | null;
  priceOriginalCents: number | null;
  priceBgnCents: number | null;
  priceEurCents: number | null;
};

type Transaction = {
  id: string;
  accountId: string;
  merchantName: string | null;
  transactionDate: string | null;
  totalBgnCents: number;
  totalEurCents: number;
  currencyOriginal: string;
  totalOriginalCents: number;
  category: string;
  categoryConfidence: number;
  overallConfidence: number;
  transactionType: string;
  isFixed: boolean;
  isEdited?: boolean;
  paymentMethod: string | null;
  notes: string | null;
  originalImageUrl: string | null;
  sourceType: string;
  aiExtractedJson?: unknown;
  lineItems: LineItem[];
};

type TransactionHistory = {
  id: string;
  oldData: {
    accountId?: string;
    transactionType?: string;
    merchantName?: string | null;
    category?: string;
    isFixed?: boolean;
    notes?: string | null;
    transactionDate?: string;
    totalOriginalCents?: number;
    currencyOriginal?: string;
  };
  createdAt: string;
};

export default function DetailClient({ transaction }: { transaction: Transaction }) {
  const { accounts } = useAccounts();
  const { t, locale } = useI18n();
  const [form, setForm] = useState({
    accountId: transaction.accountId,
    merchantName: transaction.merchantName ?? "",
    transactionDate: transaction.transactionDate
      ? transaction.transactionDate.slice(0, 16)
      : "",
    category: transaction.category,
    notes: transaction.notes ?? "",
    totalOriginal: fromCents(transaction.totalOriginalCents),
    currencyOriginal: transaction.currencyOriginal,
    transactionType: transaction.transactionType ?? "expense",
    isFixed: transaction.isFixed ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  const save = async () => {
    setMessage("");
    if (!form.accountId) {
      setMessage(t("transactions.pickAccount"));
      return;
    }
    startTransition(async () => {
      try {
        await editTransactionAction(transaction.id, {
          ...form,
          transactionDate: form.transactionDate || null,
          totalOriginal: Number(form.totalOriginal),
        });
        setMessage(t("profile.saved"));
        window.dispatchEvent(new CustomEvent("transactions:changed"));
        router.refresh();
      } catch {
        setMessage(t("profile.saveError"));
      }
    });
  };

  const rerun = async () => {
    setLoading(true);
    setMessage("");
    await fetch(`/api/transactions/${transaction.id}/rerun`, { method: "POST" });
    setMessage(t("upload.saved"));
    setLoading(false);
    router.refresh();
  };

  const remove = async () => {
    setLoading(true);
    await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
    window.dispatchEvent(new CustomEvent("transactions:changed"));
    router.push("/transactions");
    router.refresh();
  };

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      const res = await fetch(`/api/transactions/${transaction.id}/history`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (active) setHistory(json.data ?? []);
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, [transaction.id]);

  return (
    <div className="rounded-2xl border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-md">
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("transactionDetail.back")}
      </button>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">
              {t("transactionDetail.account")}
              <select
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {formatAccountLabel(acc, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.type")}
              <select
                value={form.transactionType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transactionType: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                <option value="expense">{t("transactions.expense")}</option>
                <option value="income">{t("transactions.income")}</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.merchant")}
              <input
                value={form.merchantName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, merchantName: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.dateTime")}
              <input
                type="datetime-local"
                value={form.transactionDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transactionDate: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.category")}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                {!categoryConfig[form.category as keyof typeof categoryConfig] && (
                  <option value={form.category}>{form.category}</option>
                )}
                {Object.entries(categoryConfig).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {locale === "en" ? meta.labelEn : meta.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                {transaction.sourceType === "manual"
                  ? t("transactions.manualEntry")
                  : t("transactions.confidence", {
                      category: (transaction.categoryConfidence * 100).toFixed(0),
                      overall: (transaction.overallConfidence * 100).toFixed(0),
                    })}
              </p>
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.expenseType")}
              <select
                value={form.isFixed ? "fixed" : "variable"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isFixed: e.target.value === "fixed" }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                <option value="variable">{t("transactions.variable")}</option>
                <option value="fixed">{t("transactions.fixed")}</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.total")}
              <input
                type="number"
                value={form.totalOriginal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, totalOriginal: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
            <label className="text-sm text-slate-700">
              {t("transactionDetail.currency")}
              <select
                value={form.currencyOriginal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currencyOriginal: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              >
                <option value="BGN">BGN</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <label className="text-sm text-slate-700">
            {t("transactionDetail.note")}
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
            />
          </label>
          {message && (
            <p
              className={`text-sm ${
                message === t("profile.saveError") ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={loading || isPending}
              className="flex items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-200/70 px-4 py-2 text-xs font-semibold text-emerald-900 shadow-[0_6px_16px_rgba(16,185,129,0.15)]"
            >
              {(loading || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save size={14} /> {t("transactionDetail.save")}
            </button>
            {transaction.originalImageUrl && (
              <button
                onClick={rerun}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-white/70 px-4 py-2 text-xs font-semibold text-slate-900"
              >
                <RotateCw size={14} /> {t("transactionDetail.rerunAi")}
              </button>
            )}
            <button
              onClick={remove}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-700"
            >
              <Trash2 size={14} /> {t("transactionDetail.delete")}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("transactionDetail.amountLabel")}
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatMoney(transaction.totalEurCents, transaction.totalBgnCents)}
            </p>
            <p className="text-xs text-slate-500">
              {transaction.transactionDate
                ? format(new Date(transaction.transactionDate), "dd.MM.yyyy HH:mm")
                : t("common.noDate")}
            </p>
            {transaction.isEdited && (
              <span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-700">
                {t("transactionDetail.edited")}
              </span>
            )}
          </div>
          {transaction.originalImageUrl && (
            <div className="rounded-2xl border border-white/40 bg-white/20 p-3 shadow-glow">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("transactionDetail.image")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transaction.originalImageUrl}
                alt="Receipt"
                className="mt-2 w-full rounded-lg border border-white/40"
              />
            </div>
          )}
          {transaction.lineItems?.length ? (
            <div className="rounded-2xl border border-white/40 bg-white/20 p-4 text-sm text-slate-700 shadow-glow">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("transactionDetail.items")}
              </p>
              <div className="mt-2 space-y-2">
                {transaction.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.name ?? t("transactionDetail.item")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("transactionDetail.quantity", { count: item.quantity ?? 1 })}
                      </p>
                    </div>
                    {item.priceEurCents !== null && item.priceBgnCents !== null && (
                      <p className="font-semibold text-cyan-700">
                        {formatMoney(item.priceEurCents, item.priceBgnCents)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div id="history" className="mt-6 rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">
            {t("transactionDetail.history")}
          </h4>
          <span className="text-xs text-slate-500">
            {t("transactionDetail.records", { count: history.length })}
          </span>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">{t("transactionDetail.noHistory")}</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-white/40 bg-white/30 px-3 py-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString(
                      locale === "en" ? "en-US" : "bg-BG",
                    )}{" "}
                    {new Date(entry.createdAt).toLocaleTimeString(
                      locale === "en" ? "en-US" : "bg-BG",
                      {
                      hour: "2-digit",
                      minute: "2-digit",
                      },
                    )}
                  </span>
                  <span className="rounded-full border border-white/40 bg-white/30 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {t("transactionDetail.snapshot")}
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-600">
                  <p>
                    {t("transactionDetail.amountLabel")}:{" "}
                    {entry.oldData.totalOriginalCents != null
                      ? `${(entry.oldData.totalOriginalCents / 100).toFixed(2)} ${
                          entry.oldData.currencyOriginal ?? ""
                        }`
                      : "—"}
                  </p>
                  <p>
                    {t("transactionDetail.category")}: {entry.oldData.category ?? "—"}
                  </p>
                  <p>
                    {t("transactionDetail.typeLabel")}:{" "}
                    {entry.oldData.transactionType === "income"
                      ? t("transactions.income")
                      : entry.oldData.transactionType === "transfer"
                        ? t("transactions.transfer")
                        : t("transactions.expense")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

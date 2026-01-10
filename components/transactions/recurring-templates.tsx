"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeFetchJson } from "@/lib/safe-fetch";
import {
  recurringGroups,
  recurringCategoryDefault,
  getRecurringGroupLabel,
  getRecurringItemLabel,
} from "@/lib/recurring";
import { formatMoney, toCents, bgnCentsToEurCents } from "@/lib/currency";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { useI18n } from "@/components/i18n-provider";

type RecurringTemplate = {
  id: string;
  accountId?: string | null;
  name: string;
  amount: number;
  category: string;
  subCategory: string;
  paymentDay: number;
  note?: string | null;
  isActive: boolean;
  status?: "paid" | "unpaid";
};

type RecurringTemplatesProps = {
  showForm?: boolean;
  title?: string;
  editAction?: "inline" | "navigate";
};

export default function RecurringTemplates({
  showForm = true,
  title,
  editAction = "inline",
}: RecurringTemplatesProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recurringId = searchParams.get("recurringId");
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "" | "saving" | "saved" | "error"
  >("");
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autoSavePrimed = useRef(false);
  const [form, setForm] = useState({
    accountId: "",
    name: recurringGroups[0]?.items?.[0] ?? "",
    amount: "",
    subCategory: recurringGroups[0]?.value ?? "",
    paymentDay: "1",
    note: "",
    isActive: true,
  });
  const { accounts, currentAccountId } = useAccounts();

  const currentGroup = useMemo(
    () =>
      recurringGroups.find((group) => group.value === form.subCategory) ??
      recurringGroups[0],
    [form.subCategory],
  );

  const groupItems = useMemo(() => currentGroup?.items ?? [], [currentGroup]);

  const recurringTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of recurringGroups) {
      map.set(group.value, 0);
    }
    for (const template of templates) {
      if (!template.isActive) continue;
      const current = map.get(template.subCategory) ?? 0;
      map.set(template.subCategory, current + template.amount);
    }
    return Array.from(map.entries())
      .map(([value, amount]) => ({
        value,
        amount,
        group: recurringGroups.find((group) => group.value === value) ?? recurringGroups[0],
      }))
      .filter((entry) => entry.amount > 0);
  }, [templates]);

  const startEdit = (template: RecurringTemplate) => {
    const matchedGroup =
      recurringGroups.find((group) => group.value === template.subCategory) ??
      recurringGroups[0];
    setEditingId(template.id);
    setForm({
      accountId: template.accountId ?? currentAccountId ?? "",
      name: template.name,
      amount: template.amount.toString(),
      subCategory: matchedGroup?.value ?? template.subCategory,
      paymentDay: template.paymentDay.toString(),
      note: template.note ?? "",
      isActive: template.isActive,
    });
    setAutoSaveStatus("");
    autoSavePrimed.current = false;
  };

  const load = async () => {
    setLoading(true);
    const res = await safeFetchJson<{ ok: true; data: RecurringTemplate[] }>(
      "/api/recurring",
    );
    if (res.ok) {
      setTemplates(res.data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (currentAccountId && !form.accountId) {
      setForm((current) => ({ ...current, accountId: currentAccountId }));
    }
    if (!recurringId) return;
    const loadTemplate = async () => {
      const res = await safeFetchJson<{ ok: true; data: RecurringTemplate }>(
        `/api/recurring/${recurringId}`,
      );
      if (!res.ok) return;
      const matchedGroup =
        recurringGroups.find(
          (group) => group.value === res.data.data.subCategory,
        ) ?? recurringGroups[0];
      setEditingId(res.data.data.id);
      setForm({
        accountId: res.data.data.accountId ?? currentAccountId ?? "",
        name: res.data.data.name,
        amount: res.data.data.amount.toString(),
        subCategory: matchedGroup?.value ?? res.data.data.subCategory,
        paymentDay: res.data.data.paymentDay.toString(),
        note: res.data.data.note ?? "",
        isActive: res.data.data.isActive,
      });
      autoSavePrimed.current = false;
      setAutoSaveStatus("");
    };
    loadTemplate();
  }, [recurringId, currentAccountId, form.accountId]);

  useEffect(() => {
    if (!editingId) return;
    if (!autoSavePrimed.current) {
      autoSavePrimed.current = true;
      return;
    }
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount)) return;
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      const res = await safeFetchJson(`/api/recurring/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: form.accountId,
          name: form.name,
          amount,
          category: recurringCategoryDefault,
          subCategory: form.subCategory,
          paymentDay: Number(form.paymentDay),
          note: form.note || undefined,
          isActive: form.isActive,
        }),
      });
      if (res.ok) {
        setAutoSaveStatus("saved");
        await load();
        window.dispatchEvent(new CustomEvent("recurring:changed"));
      } else {
        setAutoSaveStatus("error");
      }
    }, 600);
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [
    editingId,
    form.amount,
    form.paymentDay,
    form.note,
    form.name,
    form.subCategory,
    form.accountId,
    form.isActive,
  ]);

  const submit = async () => {
    setSaving(true);
    setMessage("");
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount)) {
      setMessage(t("transactions.invalidAmount"));
      setSaving(false);
      return;
    }
    if (!form.accountId) {
      setMessage(t("transactions.pickAccount"));
      setSaving(false);
      return;
    }
    const payload = {
      accountId: form.accountId,
      name: form.name,
      amount,
      category: recurringCategoryDefault,
      subCategory: form.subCategory,
      paymentDay: Number(form.paymentDay),
      note: form.note || undefined,
      isActive: form.isActive,
    };
    const res = await safeFetchJson(
      editingId ? `/api/recurring/${editingId}` : "/api/recurring",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const translated = t(res.error);
      setMessage(translated !== res.error ? translated : res.error);
      setSaving(false);
      return;
    }
    setEditingId(null);
    setForm((current) => ({
      ...current,
      amount: "",
      note: "",
      paymentDay: "1",
      isActive: true,
    }));
    await load();
    window.dispatchEvent(new CustomEvent("recurring:changed"));
    setSaving(false);
  };

  const toggle = async (template: RecurringTemplate) => {
    await safeFetchJson(`/api/recurring/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    await load();
    window.dispatchEvent(new CustomEvent("recurring:changed"));
  };

  const remove = async (id: string) => {
    await safeFetchJson(`/api/recurring/${id}`, { method: "DELETE" });
    await load();
    window.dispatchEvent(new CustomEvent("recurring:changed"));
  };

  const resolvedTitle = title ?? t("recurring.title");

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="glass rounded-3xl border border-white/40 bg-white/20 p-6 shadow-glow">
          <h3 className="text-lg font-semibold text-slate-900">
            {t("recurring.newTitle")}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            {t("recurring.account")}
            <select
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {formatAccountLabel(acc, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            {t("recurring.group")}
            <select
              value={form.subCategory}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  subCategory: e.target.value,
                  name:
                    recurringGroups.find((group) => group.value === e.target.value)
                      ?.items?.[0] ?? "",
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            >
              {recurringGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {getRecurringGroupLabel(group, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            {t("recurring.expense")}
            <select
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            >
              {groupItems.map((item) => (
                <option key={item} value={item}>
                  {currentGroup
                    ? getRecurringItemLabel(currentGroup, item, locale)
                    : item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            {t("recurring.amountBgn")}
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-700">
            {t("recurring.paymentDay")}
            <input
              type="number"
              min={1}
              max={31}
              value={form.paymentDay}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentDay: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            {t("recurring.note")}
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900"
            />
          </label>
        </div>
        {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!editingId && (
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/70 bg-gradient-to-r from-cyan-200 to-blue-200 px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_8px_20px_rgba(14,116,144,0.15)] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              {t("recurring.save")}
            </button>
          )}
          {editingId && (
            <span className="text-xs text-slate-600">
              {autoSaveStatus === "saving"
                ? t("recurring.saving")
                : autoSaveStatus === "saved"
                  ? t("recurring.saved")
                  : autoSaveStatus === "error"
                    ? t("recurring.saveError")
                    : t("recurring.autoSave")}
            </span>
          )}
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setAutoSaveStatus("");
                setForm({
                  accountId: currentAccountId ?? "",
                  name: recurringGroups[0]?.items?.[0] ?? "",
                  amount: "",
                  subCategory: recurringGroups[0]?.value ?? "",
                  paymentDay: "1",
                  note: "",
                  isActive: true,
                });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              <X size={16} />
              {t("recurring.cancel")}
            </button>
          )}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/40 bg-white/20 p-6 shadow-glow">
        <h3 className="text-lg font-semibold text-slate-900">{resolvedTitle}</h3>
        {recurringTotals.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recurringTotals.map(({ value, amount, group }) => {
              const Icon = group.icon;
              const bgnCents = toCents(amount);
              const eurCents = bgnCentsToEurCents(bgnCents);
              return (
                <div
                  key={value}
                className="flex items-center justify-between rounded-2xl bg-white/30 px-3 py-2 text-xs text-slate-700"
                >
                  <span className="flex items-center gap-2 text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
                      <Icon className="h-4 w-4 text-slate-900" />
                    </span>
                    {getRecurringGroupLabel(group, locale)}
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold text-slate-900">
                      {formatMoney(eurCents, bgnCents)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            {t("recurring.noActive")}
          </p>
        )}
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("recurring.loading")}
          </div>
        ) : templates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            {t("recurring.none")}
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/20 px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <p className="text-slate-900">
                    {(() => {
                      const group =
                        recurringGroups.find(
                          (entry) => entry.value === template.subCategory,
                        ) ?? recurringGroups[0];
                      const groupLabel = group
                        ? getRecurringGroupLabel(group, locale)
                        : template.subCategory;
                      const itemLabel = group
                        ? getRecurringItemLabel(group, template.name, locale)
                        : template.name;
                      return `${groupLabel} · ${itemLabel}`;
                    })()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("recurring.dayPrefix")} {template.paymentDay} ·{" "}
                    {formatMoney(
                      bgnCentsToEurCents(toCents(template.amount)),
                      toCents(template.amount),
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                      template.status === "paid"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-amber-500/15 text-amber-700"
                    }`}
                  >
                    {template.status === "paid"
                      ? t("recurring.paid")
                      : t("recurring.unpaid")}
                  </span>
                  <button
                    onClick={() => {
                      if (editAction === "navigate") {
                        router.push(
                          `/transactions?recurringId=${template.id}#recurring`,
                        );
                        return;
                      }
                      startEdit(template);
                    }}
                    className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-slate-900"
                  >
                    {t("recurring.edit")}
                  </button>
                  <button
                    onClick={() => toggle(template)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      template.isActive
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-white/30 text-slate-700"
                    }`}
                  >
                    {template.isActive ? t("recurring.active") : t("recurring.paused")}
                  </button>
                  <button
                    onClick={() => remove(template.id)}
                    className="rounded-full bg-rose-500/15 p-2 text-rose-700"
                    aria-label={t("recurring.delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

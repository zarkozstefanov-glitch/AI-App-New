"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { safeFetchJson } from "@/lib/safe-fetch";
import { recurringGroups, getRecurringGroupLabel } from "@/lib/recurring";
import { categoryConfig } from "@/lib/categories";
import TransactionListItem from "@/components/transactions/transaction-list-item";
import { getCategoryLabel, getRecurringLabelForName } from "@/lib/category-ui";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type UpcomingPayment = {
  id: string;
  category: string;
  merchantName: string | null;
  transactionDate: string | null;
  totalEurCents: number;
  totalBgnCents: number;
  transactionType: "income" | "expense" | "transfer";
  isFixed: boolean;
};

type UpcomingPaymentsProps = {
  title?: string;
  showEdit?: boolean;
  onlyUnpaid?: boolean;
  demoPayments?: UpcomingPayment[];
  uiForCategory?: (category: string) => { backgroundColor: string; textColor: string };
  demoMode?: boolean;
  badgeLabel?: string;
};

export default function UpcomingPayments({
  title,
  showEdit = true,
  onlyUnpaid = false,
  demoPayments,
  uiForCategory,
  demoMode = false,
  badgeLabel,
}: UpcomingPaymentsProps) {
  const { t, locale } = useI18n();
  const resolvedTitle = title ?? t("dashboard.upcomingTitle");
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const recurringLabelMap = useMemo(() => {
    const map = new Map<string, { label: string; icon: LucideIcon; color: string }>();
    for (const group of recurringGroups) {
      map.set(group.value, {
        label: getRecurringGroupLabel(group, locale),
        icon: group.icon,
        color: "from-slate-500/60 to-slate-700/60",
      });
    }
    return map;
  }, [locale]);

  useEffect(() => {
    if (demoPayments) {
      setPayments(demoPayments);
      setLoading(false);
      return;
    }
    const load = async () => {
      const res = await safeFetchJson<{ ok: true; data: UpcomingPayment[] }>(
        "/api/transactions/upcoming",
      );
      if (res.ok) {
        setPayments(res.data.data);
      }
      setLoading(false);
    };
    load();
  }, [demoPayments, onlyUnpaid]);
  const metaForPayment = (payment: UpcomingPayment) => {
    const direct =
      categoryConfig[payment.category as keyof typeof categoryConfig] ||
      recurringLabelMap.get(payment.category);
    if (direct) return direct;
    const groupMatch = recurringGroups.find(
      (group) =>
        group.items.includes(payment.category) ||
        (payment.merchantName ? group.items.includes(payment.merchantName) : false),
    );
    if (groupMatch) {
      return {
        label: getRecurringGroupLabel(groupMatch, locale),
        icon: groupMatch.icon,
        color: "from-slate-500/60 to-slate-700/60",
      };
    }
    return categoryConfig.other;
  };

  const cardClassName = demoMode
    ? "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/40 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg transition hover:shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
    : "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm";

  return (
    <section className={cardClassName}>
      <div className="flex items-center justify-between px-4 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{resolvedTitle}</h3>
        <span className="text-xs text-slate-500">{t("dashboard.nextSevenDays")}</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 px-4 pb-4 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
        </div>
      ) : payments.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-600">
          {t("dashboard.noUpcoming")}
        </p>
      ) : (
        <div className="flex flex-1 flex-col text-sm">
          {payments.map((payment) => {
            const meta = metaForPayment(payment);
            const merchantLabel = payment.isFixed
              ? getRecurringLabelForName(payment.merchantName, locale)
              : payment.merchantName;
            const label =
              merchantLabel?.trim() ||
              getCategoryLabel(payment.category, locale) ||
              t("dashboard.upcoming");
            return (
              <TransactionListItem
                key={payment.id}
                title={label}
                subtitle={`${payment.transactionDate ? new Date(payment.transactionDate).toLocaleDateString(locale === "en" ? "en-US" : "bg-BG") : t("common.noDate")} · ${
                  payment.transactionType === "income"
                    ? t("transactions.income")
                    : t("transactions.expense")
                }`}
                categoryName={payment.category}
                icon={meta.icon}
                uiOverride={uiForCategory?.(payment.category)}
                transactionType={payment.transactionType}
                isFixed={payment.isFixed}
                transactionDate={payment.transactionDate}
                amountEurCents={payment.totalEurCents}
                amountBgnCents={payment.totalBgnCents}
                actions={
                  showEdit ? (
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-900 md:px-3 md:text-xs">
                      {t("dashboard.upcoming")}
                    </span>
                  ) : badgeLabel ? (
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-semibold text-indigo-600 md:px-3 md:text-xs">
                      {badgeLabel}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { fromCents } from "@/lib/currency";
import { getCategoryIcon, getCategoryUI } from "@/lib/category-ui";
import { useI18n } from "@/components/i18n-provider";

type TransactionListItemProps = {
  title: string;
  subtitle?: string;
  stackedSubtitle?: { primary: string; secondary: string };
  meta?: string;
  categoryName: string;
  icon?: LucideIcon;
  imageUrl?: string | null;
  badges?: React.ReactNode;
  transactionType?: "income" | "expense" | "transfer";
  isFixed?: boolean;
  isEdited?: boolean;
  statusLabelOverride?: string;
  transactionDate?: string | null;
  amountEurCents?: number | null;
  amountBgnCents?: number | null;
  actions?: React.ReactNode;
  className?: string;
};

export default function TransactionListItem({
  title,
  subtitle,
  stackedSubtitle,
  meta,
  categoryName,
  icon,
  imageUrl,
  badges,
  transactionType,
  isFixed,
  isEdited,
  statusLabelOverride,
  transactionDate,
  amountEurCents,
  amountBgnCents,
  actions,
  className,
}: TransactionListItemProps) {
  const { t } = useI18n();
  const Icon = icon ?? getCategoryIcon(categoryName);
  const ui = getCategoryUI(categoryName);
  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );
  const isFuture =
    !!transactionDate && new Date(transactionDate).getTime() > Date.now();
  const statusLabel =
    statusLabelOverride ??
    (transactionType === "income"
      ? t("transactions.statusIncome")
      : transactionType === "transfer"
        ? t("transactions.statusTransfer")
        : transactionType === "expense"
          ? isFixed
            ? t("transactions.statusFixedExpense")
            : t("transactions.statusExpense")
          : t("transactions.statusExpense"));
  const statusTone = isFuture
    ? "text-slate-400"
    : transactionType === "income"
      ? "text-emerald-500"
      : transactionType === "expense"
        ? "text-rose-600"
        : transactionType === "transfer"
          ? "text-sky-500"
          : "text-slate-900";
  const amountTone = isFuture ? "text-slate-400" : statusTone;
  const titleTone = isFuture ? "text-slate-400" : "text-slate-900";
  const eurCents = amountEurCents != null ? Math.abs(amountEurCents) : null;
  const bgnCents = amountBgnCents != null ? Math.abs(amountBgnCents) : null;

  return (
    <div
      className={`box-border flex w-full flex-nowrap items-center justify-between overflow-hidden border-b border-slate-100 px-3 py-4 transition-colors hover:bg-slate-50 last:border-0 md:px-4 lg:px-6 ${
        className ?? ""
      }`}
    >
      <div className="flex shrink-0 w-10 items-center justify-center md:w-12">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-3xl md:h-14 md:w-14"
          style={{ backgroundColor: ui.backgroundColor }}
        >
          <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: ui.textColor }} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 md:px-5">
        <p className={`truncate text-[13px] font-semibold md:text-[17px] ${titleTone}`}>
          {title}
        </p>
        {stackedSubtitle ? (
          <div className="flex flex-col text-[10px] text-slate-400 md:text-xs">
            <span className="truncate">
              {stackedSubtitle.primary}
              {badges && <span className="ml-2 inline-flex text-[9px] md:text-[10px]">{badges}</span>}
            </span>
            <span className="truncate">{stackedSubtitle.secondary}</span>
          </div>
        ) : (
          <p className="truncate text-[10px] text-slate-400 md:text-xs">
            {subtitle}
            {badges && <span className="ml-2 inline-flex text-[9px] md:text-[10px]">{badges}</span>}
          </p>
        )}
      </div>
      <div className="flex shrink-0 w-28 flex-col justify-center text-right md:w-36">
        {eurCents != null && bgnCents != null && (
          <>
            <span className={`whitespace-nowrap text-[14px] font-bold md:text-[18px] ${amountTone}`}>
              €{amountFormatter.format(fromCents(eurCents))}
            </span>
            <span
              className={`whitespace-nowrap text-[9px] md:text-[12px] ${
                isFuture ? "text-slate-400" : "text-slate-500"
              }`}
            >
              BGN {amountFormatter.format(fromCents(bgnCents))}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${statusTone}`}
            >
              {statusLabel}
              {isEdited ? ` • ${t("transactions.edited")}` : ""}
            </span>
          </>
        )}
        {actions}
      </div>
    </div>
  );
}

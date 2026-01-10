"use client";
/* eslint-disable react-hooks/static-components */

import { useMemo, useState } from "react";
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
  uiOverride?: { backgroundColor: string; textColor: string };
  imageUrl?: string | null;
  badges?: React.ReactNode;
  transactionType?: "income" | "expense" | "transfer";
  isFixed?: boolean;
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
  uiOverride,
  imageUrl,
  badges,
  transactionType,
  isFixed,
  transactionDate,
  amountEurCents,
  amountBgnCents,
  actions,
  className,
}: TransactionListItemProps) {
  const { t } = useI18n();
  const Icon = useMemo(
    () => icon ?? getCategoryIcon(categoryName),
    [icon, categoryName],
  );
  const ui = uiOverride ?? getCategoryUI(categoryName);
  void meta;
  void imageUrl;
  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );
  const [now] = useState(() => Date.now());
  const isFuture =
    !!transactionDate && new Date(transactionDate).getTime() > now;
  const transferTone = isFuture ? "text-sky-400" : "text-sky-600";
  const incomeTone = isFuture ? "text-emerald-400" : "text-emerald-600";
  const expenseTone = isFixed
    ? isFuture
      ? "text-slate-400"
      : "text-rose-600"
    : isFuture
      ? "text-rose-400"
      : "text-rose-600";
  const statusTone =
    transactionType === "income"
      ? incomeTone
      : transactionType === "transfer"
        ? transferTone
        : expenseTone;
  const amountTone = statusTone;
  const titleTone = isFuture ? "text-slate-400" : "text-slate-900";
  const eurCents = amountEurCents != null ? Math.abs(amountEurCents) : null;
  const bgnCents = amountBgnCents != null ? Math.abs(amountBgnCents) : null;
  const displayTitle =
    transactionType === "transfer" &&
    ["transfer", "transfers"].includes(title.trim().toLowerCase())
      ? t("transactions.transfer")
      : title;

  return (
    <div
      className={`box-border grid w-full min-w-0 grid-cols-[36px_1fr_auto] items-center gap-2 overflow-hidden border-b border-white/30 px-2 py-2 transition-colors hover:bg-white/20 last:border-0 md:grid-cols-[48px_1fr_auto] md:gap-3 md:px-4 ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-2xl shadow-glow md:h-11 md:w-11"
          style={{ backgroundColor: ui.backgroundColor }}
        >
          <Icon className="h-4.5 w-4.5 md:h-5 md:w-5" style={{ color: ui.textColor }} />
        </div>
      </div>
      <div className="min-w-0">
        <p className={`truncate text-[13px] font-semibold md:text-[16px] ${titleTone}`}>
          {displayTitle}
        </p>
        {stackedSubtitle ? (
          <div className="flex flex-col text-[10px] text-slate-400 md:text-xs">
            <span className="truncate">{stackedSubtitle.primary}</span>
            <span className="truncate">{stackedSubtitle.secondary}</span>
          </div>
        ) : (
          <p className="truncate text-[10px] text-slate-400 md:text-xs">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 whitespace-nowrap text-right">
        {actions && <div className="mb-1 flex items-center justify-center">{actions}</div>}
        {eurCents != null && bgnCents != null && (
          <div className="flex flex-col items-end gap-0.5 text-right">
            <div className="flex items-center gap-2 text-[11px] md:text-[12px]">
              <span className={`font-bold ${amountTone}`}>
                €{amountFormatter.format(fromCents(eurCents))}
              </span>
              <span className={amountTone}>
                BGN {amountFormatter.format(fromCents(bgnCents))}
              </span>
            </div>
          </div>
        )}
        {badges && !actions && (
          <span className="text-[9px] font-semibold text-slate-500">{badges}</span>
        )}
      </div>
    </div>
  );
}

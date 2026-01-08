"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import { categoryConfig } from "@/lib/categories";
import { recurringGroups, getRecurringGroupLabel } from "@/lib/recurring";
import { formatMoney, fromCents } from "@/lib/currency";
import UpcomingPayments from "@/components/dashboard/upcoming-payments";
import { Loader2, Store, TrendingUp } from "lucide-react";
import TransactionListItem from "@/components/transactions/transaction-list-item";
import { getCategoryUI, getCategoryLabel } from "@/lib/category-ui";
import { useI18n } from "@/components/i18n-provider";

type Summary = {
  totals: { eurCents: number; bgnCents: number };
  monthlyBudget: { eurCents: number | null; bgnCents: number | null };
  remainingBudget: { eurCents: number | null; bgnCents: number | null };
  projectedTotal: { eurCents: number; bgnCents: number };
  toSave: { eurCents: number | null; bgnCents: number | null };
  remainingDaysInMonth: number;
  byCategory: { category: string; eurCents: number; bgnCents: number; count: number }[];
  topMerchants: { merchant: string; eurCents: number; bgnCents: number }[];
};

type SeriesPoint = {
  date: string;
  eurCents: number;
  bgnCents: number;
};

const glassCard =
  "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-md";

type CategoryLegendItem = {
  category: string;
  eurCents: number;
  bgnCents: number;
  count: number;
};

type CategoryLegendProps = {
  items: CategoryLegendItem[];
  activeCategory: string | null;
  onActivate: (category: string) => void;
  labelForCategory: (value: string) => string;
  iconForCategory: (value: string) => any;
  formatPrimaryAmount: (cents: number | null) => string;
  formatSecondaryAmount: (cents: number | null) => string;
  totalEurCents: number;
};

const CategoryLegend = ({
  items,
  activeCategory,
  onActivate,
  labelForCategory,
  iconForCategory,
  formatPrimaryAmount,
  formatSecondaryAmount,
  totalEurCents,
}: CategoryLegendProps) => {
  const hasOverflow = items.length > 3;
  return (
    <div className="mt-6 -mx-4 px-4">
      <div className="relative">
        <div className="max-h-[240px] overflow-y-auto pr-1 scroll-smooth">
          {items.map((cat, index) => {
        const ui = getCategoryUI(cat.category);
        const label = labelForCategory(cat.category);
        const Icon = iconForCategory(cat.category);
        const percent =
          totalEurCents > 0 ? Math.round((cat.eurCents / totalEurCents) * 100) : 0;
        const isActive = activeCategory === cat.category;
        return (
          <button
            key={cat.category}
            type="button"
            onClick={() => onActivate(cat.category)}
            onMouseEnter={() => onActivate(cat.category)}
            className={`flex w-full items-center justify-between border-b border-slate-100 px-2 py-4 text-left transition last:border-0 ${
              isActive ? "bg-slate-50/80" : "bg-transparent"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">
                {index + 1}.
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: ui.backgroundColor }}
              >
                <Icon className="h-5 w-5" style={{ color: ui.textColor }} aria-hidden />
              </span>
              <span className="min-w-0 text-sm font-bold text-slate-900">
                {label}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 text-right">
              <span className="text-sm font-bold text-slate-900">
                {formatPrimaryAmount(cat.eurCents)}
              </span>
              <span className="text-[10px] text-slate-400">
                {percent}% · {formatSecondaryAmount(cat.bgnCents)}
              </span>
            </span>
          </button>
        );
          })}
        </div>
        {hasOverflow && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-white" />
        )}
      </div>
    </div>
  );
};

type AnalyticsViewProps = {
  summary: Summary;
  activeCategory: string | null;
  onActivateCategory: (category: string | null) => void;
  labelForCategory: (value: string) => string;
  iconForCategory: (value: string) => any;
  formatPrimaryAmount: (cents: number | null) => string;
  formatSecondaryAmount: (cents: number | null) => string;
};

const AnalyticsView = ({
  summary,
  activeCategory,
  onActivateCategory,
  labelForCategory,
  iconForCategory,
  formatPrimaryAmount,
  formatSecondaryAmount,
}: AnalyticsViewProps) => {
  const sortedCategories = [...summary.byCategory].sort(
    (a, b) => b.eurCents - a.eurCents,
  );
  const totalEurCents = sortedCategories.reduce(
    (total, item) => total + item.eurCents,
    0,
  );

  return (
    <>
      <div className="flex h-56 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={summary.byCategory.map((c) => ({
                name: labelForCategory(c.category),
                value: c.eurCents,
                key: c.category,
                bgnCents: c.bgnCents,
                category: c.category,
                strokeColor: getCategoryUI(c.category).textColor,
                fillColor: getCategoryUI(c.category).backgroundColor,
              }))}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              {/* @ts-expect-error - activeIndex is a valid prop, but the types are wrong */}
              activeIndex={summary.byCategory.findIndex(
                (c) => c.category === activeCategory,
              )}
              activeShape={(props) => (
                <Sector
                  {...props}
                  outerRadius={(props.outerRadius ?? 0) + 8}
                />
              )}
              onClick={(data) =>
                onActivateCategory(data?.payload?.category ?? null)
              }
              onMouseEnter={(data) =>
                onActivateCategory(data?.payload?.category ?? null)
              }
            >
              {summary.byCategory.map((c) => {
                const ui = getCategoryUI(c.category);
                return (
                  <Cell
                    key={c.category}
                    fill={ui.backgroundColor}
                    stroke={ui.textColor}
                    strokeWidth={2}
                  />
                );
              })}
            </Pie>
            {activeCategory && (() => {
              const label = labelForCategory(activeCategory);
              const words = label.split(/\s+/).filter(Boolean);
              const fontSize = words.length > 2 ? 10 : 12;
              const lineHeight = fontSize + 2;
              const firstDy = -((words.length - 1) * lineHeight) / 2;
              return (
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fontWeight={600}
                  fill={getCategoryUI(activeCategory).textColor}
                >
                  {words.map((word, index) => (
                    <tspan key={`${word}-${index}`} x="50%" dy={index === 0 ? firstDy : lineHeight}>
                      {word}
                    </tspan>
                  ))}
                </text>
              );
            })()}
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid rgba(148,163,184,0.35)",
                color: "#0f172a",
              }}
              labelStyle={{ color: "#0f172a" }}
              itemStyle={{ color: "#0f172a" }}
              wrapperStyle={{ color: "#0f172a" }}
              formatter={(_value, _name, entry: { payload?: { name?: string; bgnCents?: number } } | undefined) => {
                const name = entry?.payload?.name ?? "";
                const bgnCents = entry?.payload?.bgnCents ?? 0;
                const eurCents = Number(entry?.payload?.value ?? 0);
                return [formatMoney(eurCents, bgnCents), name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <CategoryLegend
        items={sortedCategories}
        activeCategory={activeCategory}
        onActivate={(category) => onActivateCategory(category)}
        labelForCategory={labelForCategory}
        iconForCategory={iconForCategory}
        formatPrimaryAmount={(cents) => formatPrimaryAmount(cents)}
        formatSecondaryAmount={(cents) => formatSecondaryAmount(cents)}
        totalEurCents={totalEurCents}
      />
    </>
  );
};

export default function AnalyticsClient() {
  const { t, locale } = useI18n();
  const range: "month" = "month";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const toInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = toInputDate(now);
    return { from: start, to: end };
  };

  const [filters, setFilters] = useState(() => getCurrentMonthRange());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const recurringLabelMap = useMemo(() => {
    const map = new Map<string, { label: string; icon: any }>();
    for (const group of recurringGroups) {
      map.set(group.value, { label: getRecurringGroupLabel(group, locale), icon: group.icon });
    }
    return map;
  }, [locale]);

  const labelForCategory = (value: string) => getCategoryLabel(value, locale);

  const iconForCategory = (value: string) =>
    categoryConfig[value as keyof typeof categoryConfig]?.icon ||
    recurringLabelMap.get(value)?.icon ||
    categoryConfig.other.icon;

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const formatPrimaryAmount = (cents: number | null) =>
    cents == null ? "—" : `€${amountFormatter.format(fromCents(cents))}`;

  const formatSecondaryAmount = (cents: number | null) =>
    cents == null ? "—" : `BGN ${amountFormatter.format(fromCents(cents))}`;

  const budgetState = summary?.monthlyBudget?.eurCents
    ? (() => {
        const goal = summary.monthlyBudget.eurCents;
        const projection = summary.projectedTotal.eurCents ?? 0;
        const percent = goal > 0 ? (projection / goal) * 100 : null;
        if (percent == null) return { className: "text-emerald-600", over: false };
        if (percent < 80) return { className: "text-emerald-600", over: false };
        if (percent <= 100) return { className: "text-amber-600", over: false };
        return { className: "text-rose-600", over: true };
      })()
    : { className: "text-emerald-600", over: false };

  const formatPrimaryAmountWithAccent = (
    cents: number | null,
    accentClassName: string,
  ) => {
    if (cents == null) return "—";
    return (
      <span className={`flex items-baseline gap-1 ${accentClassName}`}>
        <span>€</span>
        <span>{amountFormatter.format(fromCents(cents))}</span>
      </span>
    );
  };

  const dailyLimitBgnCents =
    summary?.remainingBudget?.bgnCents != null && summary.remainingDaysInMonth > 0
      ? Math.floor(summary.remainingBudget.bgnCents / summary.remainingDaysInMonth)
      : null;
  const dailyLimitEurCents =
    dailyLimitBgnCents != null ? Math.round(dailyLimitBgnCents / 1.95583) : null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ range });
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const [summaryRes, seriesRes] = await Promise.all([
        fetch(`/api/analytics/summary?${params.toString()}`, { cache: "no-store" }),
        fetch(`/api/analytics/timeseries?${params.toString()}`, { cache: "no-store" }),
      ]);

      if (!summaryRes.ok || !seriesRes.ok) {
        const text = await summaryRes.text().catch(() => "");
        setError(t("common.loadError"));
        console.error("Analytics error", summaryRes.status, text);
        setLoading(false);
        return;
      }
      const summaryJson = await summaryRes.json();
      const seriesJson = await seriesRes.json();
      if (summaryJson.ok === false || seriesJson.ok === false) {
        setError(t("common.loadError"));
        setLoading(false);
        return;
      }
      setSummary(summaryJson);
      setSeries(seriesJson.data ?? []);
      setLoading(false);
    };
    load();
  }, [range, filters, refreshToken]);

  useEffect(() => {
    setRefreshToken((token) => token + 1);
  }, [filters.from, filters.to]);

  useEffect(() => {
    const now = new Date();
    setFilters({
      from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toInputDate(now),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => setRefreshToken((value) => value + 1);
    window.addEventListener("transactions:changed", handler);
    window.addEventListener("recurring:changed", handler);
    return () => {
      window.removeEventListener("transactions:changed", handler);
      window.removeEventListener("recurring:changed", handler);
    };
  }, []);

  const toSaveAccent =
    summary?.toSave?.bgnCents != null && summary.toSave.bgnCents >= 0
      ? "text-emerald-600"
      : "text-rose-600";

  const toSaveGlow =
    summary?.toSave?.bgnCents != null && summary.toSave.bgnCents >= 0
      ? "shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
      : "shadow-[0_10px_30px_rgba(244,63,94,0.15)]";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t("dashboard.overview")}
          </p>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {t("dashboard.cashFlow")}
          </h2>
        </div>
      </div>

      <form className={glassCard}>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-600">
              {t("dashboard.fromDate")}
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
            <label className="text-xs text-slate-600">
              {t("dashboard.toDate")}
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white"
              />
            </label>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-slate-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading || (!summary && !error) ? (
        <div className={`${glassCard} flex items-center gap-3 text-sm text-slate-700`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("common.loadingAnalytics")}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <div className={`${glassCard} h-full p-3 sm:p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.totalForPeriod")}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {formatPrimaryAmount(summary.totals.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatSecondaryAmount(summary.totals.bgnCents)}
              </p>
            </div>
            <div className={`${glassCard} h-full p-3 sm:p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.monthBudget")}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {formatPrimaryAmount(summary.monthlyBudget.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatSecondaryAmount(summary.monthlyBudget.bgnCents)}
              </p>
            </div>
            <div className={`${glassCard} h-full p-3 sm:p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.remaining")}
              </p>
              <h3 className={`mt-2 text-xl font-semibold ${budgetState.className}`}>
                {formatPrimaryAmount(summary.remainingBudget.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatSecondaryAmount(summary.remainingBudget.bgnCents)}
              </p>
              {budgetState.over && (
                <span className="mt-2 inline-flex rounded-full bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-700">
                  {t("dashboard.overBudget")}
                </span>
              )}
            </div>
            <div className={`${glassCard} h-full p-3 sm:p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.forecast")}
              </p>
              <h3 className={`mt-2 text-xl font-semibold ${budgetState.className}`}>
                {formatPrimaryAmount(summary.projectedTotal.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatSecondaryAmount(summary.projectedTotal.bgnCents)}
              </p>
            </div>
            <div
              className={`${glassCard} ${toSaveGlow} h-full p-3 sm:p-4`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.toSave")}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {formatPrimaryAmountWithAccent(
                  summary?.toSave?.eurCents ?? null,
                  toSaveAccent,
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatSecondaryAmount(summary?.toSave?.bgnCents ?? null)}
              </p>
            </div>
            <div className={`${glassCard} h-full p-3 sm:p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t("dashboard.dailyLimit")}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {formatPrimaryAmount(dailyLimitEurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {dailyLimitBgnCents == null
                  ? "—"
                  : `${formatSecondaryAmount(dailyLimitBgnCents)} ${t("dashboard.perDay")}`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className={`flex min-h-[320px] flex-col ${glassCard} lg:col-span-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("dashboard.trend")}
                </h3>
                <TrendingUp className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="mt-4 flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.4)" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: "#64748b" }}
                      tickFormatter={(value) => `€${(Number(value) / 100).toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid rgba(148,163,184,0.35)",
                        color: "#0f172a",
                      }}
                      labelStyle={{ color: "#0f172a" }}
                      formatter={(_value, _name, entry) => {
                        const payload = entry?.payload as SeriesPoint | undefined;
                        if (!payload) return ["", ""];
                        return [
                          formatMoney(payload.eurCents, payload.bgnCents),
                          t("dashboard.amountLabel"),
                        ];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eurCents"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0ea5e9" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`${glassCard} lg:col-span-2`}>
              <h3 className="text-lg font-semibold text-slate-900">
                {t("dashboard.categories")}
              </h3>
              <div className="mt-4 flex flex-col gap-4">
                {summary.byCategory.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-500">
                    {t("dashboard.noData")}
                  </div>
                ) : (
                  <AnalyticsView
                    summary={summary}
                    activeCategory={activeCategory}
                    onActivateCategory={setActiveCategory}
                    labelForCategory={labelForCategory}
                    iconForCategory={iconForCategory}
                    formatPrimaryAmount={formatPrimaryAmount}
                    formatSecondaryAmount={formatSecondaryAmount}
                  />
                )}
                </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <UpcomingPayments
                title={t("dashboard.upcomingPaymentsTitle")}
                showEdit={false}
                onlyUnpaid
              />
            </div>
            <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
              <div className="px-4 py-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("dashboard.topMerchants")}
                </h3>
              </div>
              <div className="text-sm">
                {summary.topMerchants.length === 0 ? (
                  <div className="flex items-center justify-center px-4 pb-4 text-sm text-slate-500">
                    {t("dashboard.noData")}
                  </div>
                ) : (
                  <div className="max-h-[264px] overflow-y-auto px-4 scrollbar-hide touch-scroll">
                    {summary.topMerchants.slice(0, 5).map((m, index) => {
                      const merchantLabel = m.merchant?.trim()
                        ? m.merchant
                        : t("transactions.unknownMerchant");
                      return (
                      <TransactionListItem
                        key={`${m.merchant || "unknown"}-${index}`}
                        title={merchantLabel}
                        subtitle={t("dashboard.categoryLabel")}
                        categoryName={merchantLabel}
                        icon={Store}
                        transactionType="expense"
                        amountEurCents={m.eurCents}
                        amountBgnCents={m.bgnCents}
                        className="px-0"
                      />
                    );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

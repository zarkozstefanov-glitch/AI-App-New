"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
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
} from "recharts";
import AccountHistory, { type TransactionItem } from "@/components/accounts/account-history";
import type { SeriesPoint, Summary } from "@/components/dashboard/analytics-client";
import type { AccountSummary } from "@/components/accounts/accounts-context";
import { formatMoney, fromCents } from "@/lib/currency";
import { getCategoryIcon, getCategoryLabel, getCategoryUI } from "@/lib/category-ui";
import { useI18n } from "@/components/i18n-provider";
import NumberTicker from "@/components/ui/number-ticker";

type DemoCategoryUi = { backgroundColor: string; textColor: string };
type DemoCategoryUiMap = Record<string, DemoCategoryUi>;

type LandingDemoGridProps = {
  demoAccounts: AccountSummary[];
  demoSummary: Summary;
  demoSeries: SeriesPoint[];
  demoFilters: { from: string; to: string };
  demoTopMerchants: Array<{
    merchant: string;
    eurCents: number;
    bgnCents: number;
    categoryLabel: string;
    categoryKey: string;
  }>;
  demoCategoryPalette: DemoCategoryUi[];
  demoUpcomingPayments: Array<{
    id: string;
    category: string;
    merchantName: string | null;
    transactionDate: string | null;
    totalEurCents: number;
    totalBgnCents: number;
    transactionType: "income" | "expense" | "transfer";
    isFixed: boolean;
  }>;
  demoRecentTransactions: TransactionItem[];
  demoCategoryUi: DemoCategoryUiMap;
};

export default function LandingDemoGrid({
  demoSummary,
  demoSeries,
  demoFilters,
  demoTopMerchants,
  demoCategoryPalette,
  demoUpcomingPayments,
  demoRecentTransactions,
  demoCategoryUi,
}: LandingDemoGridProps) {
  const { locale, t } = useI18n();
  const uiForCategory = useCallback(
    (category: string) => demoCategoryUi[category] ?? demoCategoryUi.other,
    [demoCategoryUi],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardsOrder, setCardsOrder] = useState([
    "pulse",
    "ai-magic",
    "merchants",
    "payments",
  ]);
  const categoryItems = useMemo(
    () =>
      demoSummary.byCategory.map((item) => ({
        ...item,
        label: getCategoryLabel(item.category, locale),
      })),
    [demoSummary.byCategory, locale],
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const renderPrimaryAmount = (cents: number | null) => {
    if (cents == null) return "—";
    return (
      <span className="flex items-baseline gap-1">
        <span>€</span>
        <NumberTicker value={fromCents(cents)} format={(val) => amountFormatter.format(val)} />
      </span>
    );
  };

  const renderSecondaryAmount = (cents: number | null) => {
    if (cents == null) return "—";
    return (
      <span>
        BGN{" "}
        <NumberTicker value={fromCents(cents)} format={(val) => amountFormatter.format(val)} />
      </span>
    );
  };

  const dailyLimitBgnCents =
    demoSummary.remainingBudget.bgnCents != null && demoSummary.remainingDaysInMonth > 0
      ? Math.floor(
          (demoSummary.remainingBudget.bgnCents - demoSummary.upcomingFixedBgnCents) /
            demoSummary.remainingDaysInMonth,
        )
      : null;
  const dailyLimitEurCents =
    dailyLimitBgnCents != null ? Math.round(dailyLimitBgnCents / 1.95583) : null;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  const cards = useMemo(
    () => [
    {
      id: "pulse",
      title: t("landing.demo.pulseTitle"),
      renderMain: (
        <div className="flex h-full w-full flex-col min-w-0">
          <div className="flex-1 h-[260px] w-full min-w-0 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
              <LineChart data={demoSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                <XAxis dataKey="date" stroke="#64748b" />
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
                      t("landing.demo.amountLabel"),
                    ];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="eurCents"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#93c5fd" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {demoFilters.from} — {demoFilters.to}
          </p>
        </div>
      ),
      renderPreview: (
        <div className="h-[140px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={160} minHeight={140}>
            <LineChart data={demoSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Line type="monotone" dataKey="eurCents" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "ai-magic",
      title: t("landing.demo.categoriesTitle"),
      renderMain: (
        <div className="flex h-full flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 items-center justify-center w-full min-w-0">
            <div className="relative h-[260px] w-full min-w-0 sm:h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={200}
                minHeight={220}
                key="ai-magic-main"
              >
                <PieChart>
                  <Pie
                    data={categoryItems}
                    dataKey="eurCents"
                    innerRadius={isDesktop ? 82 : 70}
                    outerRadius={isDesktop ? 118 : 100}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                    cornerRadius={10}
                    labelLine={false}
                    onMouseEnter={(data) => setActiveCategoryId(data?.payload?.category ?? null)}
                    onMouseLeave={() => setActiveCategoryId(null)}
                    onClick={(data) => setActiveCategoryId(data?.payload?.category ?? null)}
                  >
                    {categoryItems.map((entry, index) => {
                      const isActive = activeCategoryId === entry.category;
                      const isDimmed = activeCategoryId && !isActive;
                      return (
                        <Cell
                          key={entry.category}
                          fill={
                            demoCategoryPalette[index % demoCategoryPalette.length]?.backgroundColor ??
                            "#6366f1"
                          }
                          stroke="white"
                          strokeWidth={2}
                          opacity={isDimmed ? 0.3 : 1}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid rgba(148,163,184,0.35)",
                      color: "#0f172a",
                      fontSize: "11px",
                    }}
                    labelStyle={{ fontSize: "10px" }}
                    formatter={(value, _name, entry) => {
                      const bgnCents =
                        (entry?.payload as { bgnCents?: number } | undefined)?.bgnCents ?? 0;
                      const numericValue = typeof value === "number" ? value : Number(value);
                      return [
                        formatMoney(numericValue, bgnCents),
                        t("landing.demo.amountLabel"),
                      ] as [string, string];
                    }}
                    labelFormatter={() => ""}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-xl font-semibold tracking-[0.03em] text-[#1E40AF] drop-shadow-[0_6px_16px_rgba(30,64,175,0.15)]">
                  €
                  <NumberTicker
                    value={fromCents(
                      activeCategoryId
                        ? categoryItems.find((item) => item.category === activeCategoryId)?.eurCents ?? 0
                        : categoryItems.reduce((sum, item) => sum + item.eurCents, 0),
                    )}
                    format={(val) => val.toFixed(2)}
                  />
                </div>
                <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Общо разходи
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex h-full flex-col justify-center gap-2 text-xs text-slate-600">
              {categoryItems.map((item, index) => {
                const percent =
                  categoryItems.reduce((sum, entry) => sum + entry.eurCents, 0) > 0
                    ? Math.round(
                        (item.eurCents /
                          categoryItems.reduce((sum, entry) => sum + entry.eurCents, 0)) *
                          100,
                      )
                    : 0;
                const badgeColor =
                  demoCategoryPalette[index % demoCategoryPalette.length]?.backgroundColor ?? "#6366f1";
                return (
                  <button
                    key={item.category}
                    type="button"
                    onMouseEnter={() => setActiveCategoryId(item.category)}
                    onMouseLeave={() => setActiveCategoryId(null)}
                    className="flex w-full items-center justify-between gap-3 rounded-full border border-white/40 bg-white/40 px-3 py-2 text-left text-slate-700 shadow-glow transition hover:scale-[1.05] hover:shadow-neon-strong"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: badgeColor }}
                      />
                      <span className="text-base font-semibold text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-base font-semibold text-slate-700">
                      {percent}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
      renderPreview: (
        <div className="h-[140px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={160} minHeight={140}>
            <PieChart>
              <Pie
                data={categoryItems}
                dataKey="eurCents"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
              >
                {categoryItems.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={
                      demoCategoryPalette[index % demoCategoryPalette.length]?.backgroundColor ??
                      "#6366f1"
                    }
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "merchants",
      title: t("landing.demo.merchantsTitle"),
      renderMain: (
        <div className="flex h-full flex-col gap-3">
          <div className="flex-1 max-h-[180px] space-y-3 overflow-y-auto pr-1 scrollbar-hide">
            {demoTopMerchants.slice(0, 3).map((merchant) => (
              <div
                key={merchant.merchant}
                className="flex items-center justify-between rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm text-slate-700 shadow-glow transition hover:shadow-neon-strong"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: getCategoryUI(merchant.categoryKey).backgroundColor }}
                    >
                      {(() => {
                        const Icon = getCategoryIcon(merchant.categoryKey);
                        return <Icon className="h-4 w-4" style={{ color: getCategoryUI(merchant.categoryKey).textColor }} />;
                      })()}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{merchant.merchant}</p>
                      <p className="text-xs text-slate-500">{merchant.categoryLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {formatMoney(merchant.eurCents, merchant.bgnCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      renderPreview: (
        <div className="h-full min-h-[140px] space-y-2">
          {demoTopMerchants.slice(0, 2).map((merchant) => {
            const ui = getCategoryUI(merchant.categoryKey);
            const Icon = getCategoryIcon(merchant.categoryKey);
            return (
              <div
                key={merchant.merchant}
                className="flex items-center justify-between rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-xs text-slate-700 shadow-glow"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ backgroundColor: ui.backgroundColor }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: ui.textColor }} />
                  </span>
                  <span className="font-semibold text-slate-800">{merchant.merchant}</span>
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "payments",
      title: t("landing.demo.paymentsTitle"),
      renderMain: (
        <div className="flex h-full flex-col gap-3">
          <div className="flex-1 space-y-3 overflow-auto">
            {demoUpcomingPayments.slice(0, 3).map((payment) => {
              const ui = uiForCategory(payment.category);
              const Icon = getCategoryIcon(payment.category);
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm text-slate-700 shadow-glow transition hover:shadow-neon-strong"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: ui.backgroundColor }}
                    >
                      <Icon className="h-4 w-4" style={{ color: ui.textColor }} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {payment.merchantName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.transactionDate
                          ? new Date(payment.transactionDate).toLocaleDateString(
                              locale === "en" ? "en-US" : "bg-BG",
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {formatMoney(payment.totalEurCents, payment.totalBgnCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
      renderPreview: (
        <div className="h-full min-h-[140px] space-y-2">
          {demoUpcomingPayments.slice(0, 2).map((payment) => {
            const ui = uiForCategory(payment.category);
            const Icon = getCategoryIcon(payment.category);
            return (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-xs text-slate-700 shadow-glow"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ backgroundColor: ui.backgroundColor }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: ui.textColor }} />
                  </span>
                  <span className="font-semibold text-slate-800">
                    {payment.merchantName ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    ],
    [
      activeCategoryId,
      categoryItems,
      demoCategoryPalette,
      demoFilters.from,
      demoFilters.to,
      demoSeries,
      demoTopMerchants,
      demoUpcomingPayments,
      locale,
      t,
      uiForCategory,
      isDesktop,
    ],
  );

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const threshold = 60;
    if (info.offset.x < -threshold || info.velocity.x < -500) {
      setActiveIndex((current) => Math.min(current + 1, cards.length - 1));
      return;
    }
    if (info.offset.x > threshold || info.velocity.x > 500) {
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
  };

  const cardMap = useMemo(
    () =>
      cards.reduce<Record<string, (typeof cards)[number]>>((acc, card) => {
        acc[card.id] = card;
        return acc;
      }, {}),
    [cards],
  );

  const orderedCards = cardsOrder.map((id) => cardMap[id]).filter(Boolean);
  const activeCard = orderedCards[0];
  const previewCards = orderedCards.slice(1);

  const handleSwap = (clickedId: string) => {
    setCardsOrder((current) => {
      if (current[0] === clickedId) return current;
      const next = current.filter((id) => id !== clickedId);
      return [clickedId, ...next];
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.totalForPeriod")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(demoSummary.totals.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {renderSecondaryAmount(demoSummary.totals.bgnCents)}
              </p>
              </div>
            </div>
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.monthBudget")}
                </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(demoSummary.monthlyBudget.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {renderSecondaryAmount(demoSummary.monthlyBudget.bgnCents)}
              </p>
              </div>
            </div>
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.remaining")}
                </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(demoSummary.remainingBudget.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {renderSecondaryAmount(demoSummary.remainingBudget.bgnCents)}
              </p>
              </div>
            </div>
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.forecast")}
                </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(demoSummary.projectedTotal.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {renderSecondaryAmount(demoSummary.projectedTotal.bgnCents)}
              </p>
              </div>
            </div>
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.toSave")}
                </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(demoSummary.toSave.eurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {renderSecondaryAmount(demoSummary.toSave.bgnCents)}
              </p>
              </div>
            </div>
            <div className="w-full">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-3 shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {t("dashboard.dailyLimit")}
                </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {renderPrimaryAmount(dailyLimitEurCents)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {dailyLimitBgnCents == null
                  ? "—"
                  : (
                      <span>
                        {renderSecondaryAmount(dailyLimitBgnCents)} {t("dashboard.perDay")}
                      </span>
                    )}
              </p>
              </div>
            </div>
          </div>
        </div>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-4 shadow-glow backdrop-blur-xl md:p-6">
          {isDesktop === null ? (
            <div className="min-h-[380px] w-full" />
          ) : isDesktop ? (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-[3fr_1fr] gap-4">
              <motion.div
                key={`main-${activeCard.id}`}
                layout
                layoutId={`card-${activeCard.id}`}
                transition={{ type: "spring", stiffness: 350, damping: 30, mass: 1 }}
                className="relative h-full min-h-[380px] min-w-0 rounded-[2rem] border border-white/40 bg-white/40 p-5 text-left shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong animate-neon-pulse"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-200/20 via-transparent to-cyan-200/20" />
                <span className="absolute right-5 top-5 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  DEMO
                </span>
                <h3 className="pr-16 text-lg font-semibold text-slate-800">
                  {activeCard.title}
                </h3>
                <motion.div
                  key={`${activeCard.id}-main`}
                  className="mt-4 h-full"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeCard.renderMain}
                </motion.div>
              </motion.div>
              <div className="flex flex-col gap-3">
                {previewCards.map((card) => (
                  <motion.button
                    key={`sidebar-${card.id}`}
                    type="button"
                    onClick={() => handleSwap(card.id)}
                    layout
                    layoutId={`card-${card.id}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 1 }}
                    className="relative h-full min-h-[140px] min-w-0 rounded-[2rem] border border-white/40 bg-white/40 p-4 text-left shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong"
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-200/10 via-transparent to-cyan-200/10" />
                    <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-500 shadow-glow">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="absolute right-4 top-4 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                      DEMO
                    </span>
                    <h4 className="pr-12 pl-10 text-sm font-semibold leading-tight text-slate-800">
                      {card.title}
                    </h4>
                    <motion.div
                      key={`${card.id}-sidebar`}
                      className="mt-3 h-full"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {card.renderPreview}
                    </motion.div>
                  </motion.button>
                ))}
              </div>
              </div>
            </AnimatePresence>
          ) : (
            <>
              <motion.div
                className="flex w-full touch-pan-y will-change-transform"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={{ x: `${-activeIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 28 }}
              >
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setActiveIndex(index);
                      }
                    }}
                    className="w-full shrink-0 px-2"
                    animate={{ scale: activeIndex === index ? 1 : 0.98 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative h-full min-h-[360px] rounded-3xl border border-white/40 bg-white/40 p-4 text-left shadow-glow backdrop-blur-xl transition-transform hover:scale-[1.05] hover:shadow-neon-strong">
                      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-200/20 via-transparent to-cyan-200/20" />
                      <span className="absolute right-4 top-4 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        DEMO
                      </span>
                      <h3 className="pr-16 text-base font-semibold text-slate-800 sm:text-lg">
                        {card.title}
                      </h3>
                      <motion.div key={`${card.id}-main`} className="mt-4 h-full">
                        {card.renderMain}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <div className="flex items-center justify-center gap-2">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 w-2 rounded-full transition ${
                      activeIndex === index ? "bg-indigo-500" : "bg-slate-300"
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div id="last-operations">
        <AccountHistory
          demoRows={demoRecentTransactions}
          headerLabel={t("landing.demo.historyLabel")}
          headerTitle={t("landing.demo.historyTitle")}
          showViewAll={false}
          uiForCategory={uiForCategory}
          demoMode
        />
      </div>
    </div>
  );
}

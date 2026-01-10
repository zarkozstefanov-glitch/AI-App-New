import Image from "next/image";
import LandingHeader from "@/components/landing/landing-header";
import LandingDemoGrid from "@/components/landing/landing-demo-grid";
import AccountHeader from "@/components/accounts/account-header";
import type { Summary, SeriesPoint } from "@/components/dashboard/analytics-client";
import type { TransactionItem } from "@/components/accounts/account-history";
import ChangeCalculator from "@/components/change/change-calculator";
import { AuthModalHost, AuthOpenButton } from "@/components/auth/auth-modal";
import Footer from "@/components/footer";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCategoryLabel } from "@/lib/category-ui";
import { bgnCentsToEurCents } from "@/lib/currency";
import { Camera, Check, CheckCircle, Plane, ShieldCheck, Sparkles } from "lucide-react";
import DynamicBackground from "@/components/landing/dynamic-background";
import type { AccountSummary } from "@/components/accounts/accounts-context";
import type { CategoryKey } from "@/lib/categories";

type ScanField = {
  label: string;
  value: string;
};

type DemoTransaction = {
  id: string;
  merchantName: string;
  category: CategoryKey;
  transactionDate: string;
  bgnCents: number;
};

type DemoUpcomingPayment = {
  id: string;
  merchantName: string;
  category: CategoryKey;
  transactionDate: string;
  bgnCents: number;
};

export default async function AuthPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }
  const { locale, t } = await getServerTranslator();

  const demoNow = new Date("2026-01-09T12:00:00Z");
  const eurCentsToBgnCentsLocal = (eurCents: number) =>
    Math.round(eurCents * 1.95583);
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const mockData = {
    budgetBgnCents: 200000,
    accounts: [
      {
        id: "demo-cash",
        name: "Cash",
        kind: "cash",
        currency: "EUR",
        balanceEurCents: 5000,
        balanceBgnCents: eurCentsToBgnCentsLocal(5000),
      },
      {
        id: "demo-bank",
        name: "Bank account",
        kind: "bank",
        currency: "EUR",
        balanceEurCents: 124000,
        balanceBgnCents: eurCentsToBgnCentsLocal(124000),
      },
      {
        id: "demo-savings",
        name: "Savings",
        kind: "savings",
        currency: "EUR",
        balanceEurCents: 500000,
        balanceBgnCents: eurCentsToBgnCentsLocal(500000),
      },
    ] satisfies AccountSummary[],
    transactions: [
      {
        id: "demo-1",
        merchantName: "Billa",
        category: "food_supermarket",
        transactionDate: "2026-01-01",
        bgnCents: 1800,
      },
      {
        id: "demo-2",
        merchantName: "Shell",
        category: "transport",
        transactionDate: "2026-01-03",
        bgnCents: 1200,
      },
      {
        id: "demo-3",
        merchantName: "IKEA",
        category: "home_bills",
        transactionDate: "2026-01-05",
        bgnCents: 2600,
      },
      {
        id: "demo-4",
        merchantName: "Fantastico",
        category: "food_supermarket",
        transactionDate: "2026-01-07",
        bgnCents: 900,
      },
      {
        id: "demo-5",
        merchantName: "Amazon",
        category: "other",
        transactionDate: "2026-01-09",
        bgnCents: 1500,
      },
    ] satisfies DemoTransaction[],
    upcomingPayments: [
      {
        id: "up-1",
        merchantName: "Наем",
        category: "home_bills",
        transactionDate: "2026-01-15",
        bgnCents: 65000,
      },
      {
        id: "up-2",
        merchantName: "Netflix",
        category: "subscriptions",
        transactionDate: "2026-01-20",
        bgnCents: 2599,
      },
      {
        id: "up-3",
        merchantName: "iCloud",
        category: "subscriptions",
        transactionDate: "2026-01-23",
        bgnCents: 599,
      },
    ] satisfies DemoUpcomingPayment[],
  };

  const demoBudgetBgnCents = mockData.budgetBgnCents;
  const demoAccounts = mockData.accounts;
  const demoTransactions = mockData.transactions;
  const demoUpcomingPayments = mockData.upcomingPayments;
  const spentToDateBgnCents = demoTransactions
    .filter((tx) => new Date(tx.transactionDate) <= demoNow)
    .reduce((sum, tx) => sum + tx.bgnCents, 0);
  const totalSpentBgnCents = demoTransactions.reduce(
    (sum, tx) => sum + tx.bgnCents,
    0,
  );
  const remainingBgnCents = Math.max(demoBudgetBgnCents - spentToDateBgnCents, 0);
  const upcomingFixedBgnCents = demoUpcomingPayments
    .filter((payment) => new Date(payment.transactionDate) >= startOfDay(demoNow))
    .reduce((sum, payment) => sum + payment.bgnCents, 0);
  const totalDaysInMonth = Math.max(
    1,
    Math.floor(
      (startOfDay(endOfMonth(demoNow)).getTime() -
        startOfDay(startOfMonth(demoNow)).getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1,
  );
  const elapsedDaysInMonth = Math.max(1, demoNow.getDate());
  const remainingDaysInMonth = Math.max(0, totalDaysInMonth - elapsedDaysInMonth);
  const averageDailyVariableBgn = spentToDateBgnCents / elapsedDaysInMonth;
  const projectedBgnCents =
    Math.round(averageDailyVariableBgn * remainingDaysInMonth) +
    spentToDateBgnCents +
    upcomingFixedBgnCents;
  const toSaveBgnCents = Math.max(demoBudgetBgnCents - projectedBgnCents, 0);

  const categoryTotals = new Map<
    CategoryKey,
    { bgnCents: number; count: number }
  >();
  for (const tx of demoTransactions) {
    const current = categoryTotals.get(tx.category) ?? { bgnCents: 0, count: 0 };
    current.bgnCents += tx.bgnCents;
    current.count += 1;
    categoryTotals.set(tx.category, current);
  }
  const demoByCategory = Array.from(categoryTotals.entries()).map(
    ([category, totals]) => ({
      category,
      bgnCents: totals.bgnCents,
      eurCents: bgnCentsToEurCents(totals.bgnCents),
      count: totals.count,
    }),
  );

  const merchantTotals = new Map<
    string,
    { bgnCents: number; category: CategoryKey }
  >();
  for (const tx of demoTransactions) {
    const current = merchantTotals.get(tx.merchantName) ?? {
      bgnCents: 0,
      category: tx.category,
    };
    current.bgnCents += tx.bgnCents;
    current.category = tx.category;
    merchantTotals.set(tx.merchantName, current);
  }
  const sortedMerchants = Array.from(merchantTotals.entries())
    .map(([merchant, data]) => ({
      merchant,
      bgnCents: data.bgnCents,
      category: data.category,
    }))
    .sort((a, b) => b.bgnCents - a.bgnCents);

  const demoSummary: Summary = {
    totals: {
      bgnCents: totalSpentBgnCents,
      eurCents: bgnCentsToEurCents(totalSpentBgnCents),
    },
    monthlyBudget: {
      bgnCents: demoBudgetBgnCents,
      eurCents: bgnCentsToEurCents(demoBudgetBgnCents),
    },
    remainingBudget: {
      bgnCents: remainingBgnCents,
      eurCents: bgnCentsToEurCents(remainingBgnCents),
    },
    upcomingFixedBgnCents,
    projectedTotal: {
      bgnCents: projectedBgnCents,
      eurCents: bgnCentsToEurCents(projectedBgnCents),
    },
    toSave: {
      bgnCents: toSaveBgnCents,
      eurCents: bgnCentsToEurCents(toSaveBgnCents),
    },
    remainingDaysInMonth,
    byCategory: demoByCategory,
    topMerchants: sortedMerchants.map((item) => ({
      merchant: item.merchant,
      bgnCents: item.bgnCents,
      eurCents: bgnCentsToEurCents(item.bgnCents),
    })),
  };

  const formatDemoDate = (value: string) => {
    const [, month, day] = value.split("-");
    return `${day}.${month}`;
  };

  const sortedDemoTransactions = [...demoTransactions].sort((a, b) =>
    a.transactionDate.localeCompare(b.transactionDate),
  );
  const demoSeries: SeriesPoint[] = sortedDemoTransactions.reduce<SeriesPoint[]>(
    (acc, tx) => {
      const previous = acc.at(-1)?.bgnCents ?? 0;
      const runningTotal = previous + tx.bgnCents;
      acc.push({
        date: formatDemoDate(tx.transactionDate),
        bgnCents: runningTotal,
        eurCents: bgnCentsToEurCents(runningTotal),
      });
      return acc;
    },
    [],
  );

  const scanFields: ScanField[] = [
    { label: t("landing.scan.fieldMerchant"), value: t("landing.scan.demoMerchant") },
    { label: t("landing.scan.fieldAmount"), value: t("landing.scan.demoAmount") },
    { label: t("landing.scan.fieldCategory"), value: t("landing.scan.demoCategory") },
    { label: t("landing.scan.fieldDate"), value: t("landing.scan.demoDate") },
  ];
  const demoFilters = {
    from: startOfMonth(demoNow).toISOString().slice(0, 10),
    to: demoNow.toISOString().slice(0, 10),
  };

  const demoCategoryPalette = [
    { backgroundColor: "#93c5fd", textColor: "#1e40af" },
    { backgroundColor: "#f9a8d4", textColor: "#9d174d" },
    { backgroundColor: "#5eead4", textColor: "#0f766e" },
    { backgroundColor: "#fde68a", textColor: "#a16207" },
  ];

  const demoTopMerchants = sortedMerchants.map((item) => ({
    merchant: item.merchant,
    bgnCents: item.bgnCents,
    eurCents: bgnCentsToEurCents(item.bgnCents),
    categoryLabel: getCategoryLabel(item.category, locale),
    categoryKey: item.category,
  }));

  const demoRecentTransactions: TransactionItem[] = [...demoTransactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .map((tx) => ({
      id: tx.id,
      merchantName: tx.merchantName,
      category: tx.category,
      transactionDate: tx.transactionDate,
      totalEurCents: bgnCentsToEurCents(tx.bgnCents),
      totalBgnCents: tx.bgnCents,
      transactionType: "expense",
      isFixed: false,
    }));

  const demoUpcomingPaymentsRows = mockData.upcomingPayments.map((payment) => ({
    id: payment.id,
    category: payment.category,
    merchantName:
      payment.id === "up-1"
        ? t("landing.demo.upcomingRent")
        : payment.id === "up-2"
          ? t("landing.demo.upcomingNetflix")
          : t("landing.demo.upcomingIcloud"),
    transactionDate: payment.transactionDate,
    totalEurCents: bgnCentsToEurCents(payment.bgnCents),
    totalBgnCents: payment.bgnCents,
    transactionType: "expense" as const,
    isFixed: true,
  }));

  const demoCategoryUi: Record<CategoryKey, { backgroundColor: string; textColor: string }> = {
    food_supermarket: { backgroundColor: "#e0e7ff", textColor: "#4338ca" },
    restaurants_cafe: { backgroundColor: "#dbeafe", textColor: "#1d4ed8" },
    transport: { backgroundColor: "#e0e7ff", textColor: "#3730a3" },
    home_bills: { backgroundColor: "#ede9fe", textColor: "#6d28d9" },
    clothing: { backgroundColor: "#dbeafe", textColor: "#1e40af" },
    subscriptions: { backgroundColor: "#ede9fe", textColor: "#5b21b6" },
    entertainment: { backgroundColor: "#dbeafe", textColor: "#1d4ed8" },
    health: { backgroundColor: "#e0e7ff", textColor: "#4338ca" },
    alcohol: { backgroundColor: "#ede9fe", textColor: "#6d28d9" },
    tobacco: { backgroundColor: "#dbeafe", textColor: "#1e3a8a" },
    beauty: { backgroundColor: "#ede9fe", textColor: "#6d28d9" },
    gifts: { backgroundColor: "#e0e7ff", textColor: "#4338ca" },
    other: { backgroundColor: "#e0f2fe", textColor: "#0369a1" },
  };

  const benefitCards = [
    {
      title: t("landing.benefits.title1"),
      desc: t("landing.benefits.desc1"),
      icon: Plane,
    },
    {
      title: t("landing.benefits.title2"),
      desc: t("landing.benefits.desc2"),
      icon: Sparkles,
    },
    {
      title: t("landing.benefits.title3"),
      desc: t("landing.benefits.desc3"),
      icon: ShieldCheck,
    },
  ];

  const steps = [
    {
      icon: Camera,
      text: t("landing.steps.step1"),
      iconClass: "text-sky-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    },
    {
      icon: Sparkles,
      text: t("landing.steps.step2"),
      iconClass: "text-pink-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    },
    {
      icon: CheckCircle,
      text: t("landing.steps.step3"),
      iconClass: "text-teal-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    },
  ];


  return (
    <div className="ethereal-canvas relative min-h-[100dvh] bg-transparent text-slate-800">
      <DynamicBackground />

      <LandingHeader />

      <main className="relative pt-20">
        <section className="relative overflow-hidden pb-8 pt-4 sm:pb-12">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-6 text-center lg:text-left">
                <h1 className="text-4xl font-bold leading-tight text-[#1E40AF] sm:text-5xl lg:text-6xl">
                  {t("landing.hero.title")}
                </h1>
                <p className="mx-auto max-w-xl text-sm text-[#1E293B] sm:text-base lg:mx-0">
                  {t("landing.hero.subtitle")}
                </p>
                <div className="flex flex-nowrap items-center justify-center gap-2 lg:justify-start">
                  <AuthOpenButton className="rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 px-4 py-2 text-xs font-semibold text-slate-800 shadow-glow transition hover:-translate-y-0.5 hover:scale-[1.05] hover:shadow-neon-strong sm:px-7 sm:py-3 sm:text-sm">
                    {t("landing.hero.ctaPrimary")}
                  </AuthOpenButton>
                  <a
                    href="#dashboard-demo"
                    className="rounded-full border border-blue-200/60 bg-white/40 px-4 py-2 text-xs font-semibold text-[#1E40AF] shadow-glow backdrop-blur-xl transition hover:-translate-y-0.5 hover:scale-[1.05] hover:shadow-neon-strong sm:px-6 sm:py-3 sm:text-sm"
                  >
                    {t("landing.hero.ctaSecondary")}
                  </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 lg:justify-start">
                  <span className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-3 py-1 backdrop-blur-2xl shadow-glow animate-float">
                    {t("landing.hero.badgeNoRegistration")}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-3 py-1 backdrop-blur-2xl shadow-glow animate-float"
                    style={{ animationDelay: "0.4s" }}
                  >
                    {t("landing.hero.badgeBulgarian")}
                  </span>
                </div>
              </div>

              <div
                className="relative ml-auto w-full max-w-md rounded-[32px] border border-white/40 bg-white/50 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-3xl animate-float animate-glass-pulse transition hover:-translate-y-0.5 hover:scale-[1.03] sm:p-8"
                style={{ animationDelay: "0.6s" }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-sky-200/30 via-transparent to-pink-200/30" />
                <div className="relative space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                    {t("landing.explore.label")}
                  </p>
                  <h2 className="text-2xl font-semibold text-[#1E40AF] sm:text-3xl">
                    {t("landing.explore.title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#1E293B] sm:text-base">
                    {t("landing.explore.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ai-scan" className="relative overflow-hidden pb-12 pt-6">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[36px] border border-white/40 bg-white/40 p-6 shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:shadow-neon-strong">
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="space-y-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                    {t("landing.problem.label")}
                  </p>
                  <h2 className="text-2xl font-semibold text-[#1E40AF] sm:text-3xl">
                    {t("landing.problem.title")}
                  </h2>
                  <ul className="space-y-3 text-sm text-[#1E293B] sm:text-base">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 text-indigo-600" />
                      {t("landing.problem.bullet1")}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 text-indigo-600" />
                      {t("landing.problem.bullet2")}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 text-indigo-600" />
                      {t("landing.problem.bullet3")}
                    </li>
                  </ul>
                </div>

                <div className="rounded-[28px] border border-white/40 bg-white/40 p-5 shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:shadow-neon-strong">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                    {t("landing.scan.label")}
                  </p>
                  <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {t("landing.scan.before")}
                      </p>
                      <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-glow backdrop-blur-xl">
                        <Image
                          src="/receipt-demo.svg"
                          alt="Receipt preview"
                          width={320}
                          height={420}
                          className="h-56 w-full object-contain opacity-90"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                        {t("landing.scan.aiData")}
                      </p>
                      <div className="space-y-3 rounded-2xl border border-white/60 bg-white/40 p-4 text-sm text-[#1E293B] shadow-glow backdrop-blur-xl">
                        {scanFields.map((field) => (
                          <div
                            key={field.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs uppercase tracking-[0.2em] text-[#0EA5E9]">
                              {field.label}
                            </span>
                            <span className="font-semibold text-[#1E40AF]">
                              {field.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden pb-12">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {benefitCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-[28px] border border-white/40 bg-white/40 p-6 text-sm text-[#1E293B] shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:shadow-neon-strong"
                  >
                    <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-[#0EA5E9] shadow-glow">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-[#1E40AF]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[#1E293B]">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden pb-12 pt-2">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                {t("landing.steps.label")}
              </p>
              <h2 className="text-2xl font-semibold text-[#1E40AF] sm:text-3xl">
                {t("landing.steps.title")}
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 justify-items-center">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.text}
                    className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/40 bg-white/40 p-8 text-center text-sm text-[#1E293B] shadow-glow backdrop-blur-xl transition hover:scale-[1.05] hover:bg-white/40 hover:shadow-neon-strong"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 transition hover:scale-125 ${step.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mx-auto w-full max-w-[280px] text-center font-medium text-[#1E293B]">
                      {step.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-full border border-white/40 bg-white/40 px-6 py-3 text-center text-sm font-semibold text-[#1E293B] shadow-glow backdrop-blur-xl transition hover:scale-[1.02]">
            🚀{" "}
            <span className="bg-gradient-to-r from-blue-700 to-cyan-400 bg-clip-text text-transparent">
              1,000+
            </span>{" "}
            {t("landing.socialProof")}
          </div>
        </section>

        <section className="relative overflow-hidden pb-3 pt-2">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AccountHeader demoAccounts={demoAccounts} hideIncomeAction />
          </div>
        </section>

        <section id="dashboard-demo" className="relative overflow-hidden py-8">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <LandingDemoGrid
                demoAccounts={demoAccounts}
                demoSummary={demoSummary}
                demoSeries={demoSeries}
                demoFilters={demoFilters}
                demoTopMerchants={demoTopMerchants}
                demoCategoryPalette={demoCategoryPalette}
                demoUpcomingPayments={demoUpcomingPaymentsRows}
                demoRecentTransactions={demoRecentTransactions}
                demoCategoryUi={demoCategoryUi}
              />
            </div>
          </div>
        </section>

        <section id="change-demo" className="relative overflow-hidden pb-12 pt-2">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                {t("landing.change.label")}
              </p>
              <h2 className="text-2xl font-semibold text-[#1E40AF] sm:text-3xl">
                {t("landing.change.title")}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[#1E293B] sm:text-base">
                {t("landing.change.subtitle")}
              </p>
          </div>
          <ChangeCalculator
            mode="embed"
          />
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden pb-20 pt-2">
          <div className="pointer-events-none absolute inset-0 diagonal-clip diagonal-flow" />
          <div className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                {t("landing.pricing.label")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#1E40AF] sm:text-3xl">
                {t("landing.pricing.title")}
              </h2>
              <p className="mt-3 text-sm text-[#1E293B] sm:text-base">
                {t("landing.pricing.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div
                id="pricing-trial"
                className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-6 shadow-glow backdrop-blur-xl transition hover:scale-[1.03] hover:shadow-neon-strong"
              >
                <div className="absolute right-6 top-6 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {t("landing.pricing.badgeFree")}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9] drop-shadow-sm">
                  {t("landing.pricing.badgeTrial")}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-[#1E40AF]">
                  {t("landing.pricing.trialTitle")}
                </h3>
                <p className="mt-2 text-sm text-[#1E293B]">
                  {t("landing.pricing.trialSubtitle")}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[#1E293B]">
                  {[
                    t("landing.pricing.feature1"),
                    t("landing.pricing.feature2"),
                    t("landing.pricing.feature3"),
                    t("landing.pricing.feature4"),
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-glow">
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-6 shadow-glow backdrop-blur-xl transition hover:scale-[1.03] hover:shadow-neon-strong">
              <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-sky-300/40 blur-2xl" />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0EA5E9]">
                  {t("landing.pricing.premiumLabel")}
                </p>
                <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold text-indigo-500">
                  {t("landing.pricing.popular")}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-[#1E40AF]">
                {t("landing.pricing.premiumTitle")}
              </h3>
              <p className="mt-2 text-sm text-[#1E293B]">
                {t("landing.pricing.premiumSubtitle")}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#1E293B]">
                {[
                  t("landing.pricing.feature1"),
                  t("landing.pricing.feature2"),
                  t("landing.pricing.feature3"),
                  t("landing.pricing.feature4"),
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-glow">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-center">
            <AuthOpenButton className="inline-flex w-full max-w-md items-center justify-center rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-neon-strong">
              {t("landing.pricing.cta")}
            </AuthOpenButton>
          </div>
          </div>
        </section>
      </main>

      <Footer className="mt-6" />
      <AuthModalHost />
    </div>
  );
}

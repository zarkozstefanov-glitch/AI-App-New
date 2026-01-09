import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/landing/landing-header";
import LandingDemoGrid from "@/components/landing/landing-demo-grid";
import AccountHeader from "@/components/accounts/account-header";
import type { Summary, SeriesPoint } from "@/components/dashboard/analytics-client";
import type { TransactionItem } from "@/components/accounts/account-history";
import ChangeCalculator from "@/components/change/change-calculator";
import { AuthModalHost, AuthOpenButton } from "@/components/auth/auth-modal";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  Camera,
  Check,
  PencilLine,
  Save,
  Sparkles,
} from "lucide-react";
import type { AccountSummary } from "@/components/accounts/accounts-context";
import type { CategoryKey } from "@/lib/categories";

type WorkflowStep = {
  title: string;
  description: string;
  icon: typeof Camera;
};

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
  await getServerTranslator();

  const eurCentsToBgnCents = (eurCents: number) =>
    Math.round(eurCents * 1.95583);
  const bgnCentsToEurCents = (bgnCents: number) =>
    Math.round(bgnCents / 1.95583);

  const mockData = {
    budgetBgnCents: 150000,
    accounts: [
      {
        id: "demo-cash",
        name: "Кеш",
        kind: "cash",
        currency: "EUR",
        balanceEurCents: 5000,
        balanceBgnCents: eurCentsToBgnCents(5000),
      },
      {
        id: "demo-bank",
        name: "Основна банка",
        kind: "bank",
        currency: "EUR",
        balanceEurCents: 124000,
        balanceBgnCents: eurCentsToBgnCents(124000),
      },
      {
        id: "demo-savings",
        name: "Спестявания",
        kind: "savings",
        currency: "EUR",
        balanceEurCents: 500000,
        balanceBgnCents: eurCentsToBgnCents(500000),
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

  const demoAccounts = mockData.accounts;
  const demoTransactions = mockData.transactions;
  const totalSpentBgnCents = demoTransactions.reduce(
    (sum, tx) => sum + tx.bgnCents,
    0,
  );
  const remainingBgnCents = Math.max(mockData.budgetBgnCents - totalSpentBgnCents, 0);

  const categoryLabelMap: Record<CategoryKey, string> = {
    food_supermarket: "Храна",
    restaurants_cafe: "Храна",
    transport: "Транспорт",
    home_bills: "Дом",
    clothing: "Дрехи",
    subscriptions: "Абонаменти",
    entertainment: "Забавления",
    health: "Здраве",
    alcohol: "Алкохол",
    tobacco: "Тютюн",
    beauty: "Козметика",
    gifts: "Подаръци",
    other: "Онлайн",
  };

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
      bgnCents: mockData.budgetBgnCents,
      eurCents: bgnCentsToEurCents(mockData.budgetBgnCents),
    },
    remainingBudget: {
      bgnCents: remainingBgnCents,
      eurCents: bgnCentsToEurCents(remainingBgnCents),
    },
    projectedTotal: {
      bgnCents: totalSpentBgnCents,
      eurCents: bgnCentsToEurCents(totalSpentBgnCents),
    },
    toSave: {
      bgnCents: remainingBgnCents,
      eurCents: bgnCentsToEurCents(remainingBgnCents),
    },
    remainingDaysInMonth: 22,
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

  const workflowSteps: WorkflowStep[] = [
    {
      title: "1. Качи",
      description: "Снимка или скрийншот от банки и касови бележки.",
      icon: Camera,
    },
    {
      title: "2. AI",
      description: "AI открива търговец, сума, дата и валута.",
      icon: Sparkles,
    },
    {
      title: "3. Редакция",
      description: "Бърза проверка и корекция при нужда.",
      icon: PencilLine,
    },
    {
      title: "4. Запис",
      description: "Запазваш и виждаш ефект в таблото веднага.",
      icon: Save,
    },
  ];

  const scanFields: ScanField[] = [
    { label: "Търговец", value: "Магазин 1" },
    { label: "Сума", value: "42.50 BGN" },
    { label: "Категория", value: "Food" },
    { label: "Дата", value: "12.01.2025" },
  ];
  const demoFilters = {
    from: "2026-01-01",
    to: "2026-01-09",
  };

  const demoCategoryPalette = [
    { backgroundColor: "#2563eb", textColor: "#1e3a8a" },
    { backgroundColor: "#7c3aed", textColor: "#4c1d95" },
    { backgroundColor: "#22d3ee", textColor: "#0e7490" },
    { backgroundColor: "#6366f1", textColor: "#3730a3" },
  ];

  const demoTopMerchants = sortedMerchants.map((item) => ({
    merchant: item.merchant,
    bgnCents: item.bgnCents,
    eurCents: bgnCentsToEurCents(item.bgnCents),
    categoryLabel: categoryLabelMap[item.category],
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

  const demoUpcomingPayments = mockData.upcomingPayments.map((payment) => ({
    id: payment.id,
    category: payment.category,
    merchantName: payment.merchantName,
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


  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl motion-safe:animate-float" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl motion-safe:animate-float-slow" />
      </div>

      <LandingHeader />

      <main className="relative pt-16">
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm backdrop-blur">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600"
                  aria-hidden
                />
                Freemium Demo
              </div>
              <h1 className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl lg:text-6xl">
                Финансите ти, визуализирани нагледно.
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base">
                Разгледай как AI автоматизира всичко вместо теб. Без ангажименти.
              </p>
              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href="#dashboard-demo"
                  className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:-translate-y-0.5 hover:brightness-110 motion-safe:animate-pulse"
                >
                  Изпробвай демо таблото
                </a>
                <AuthOpenButton className="rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
                  Вход / Регистрация
                </AuthOpenButton>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <Check className="h-3 w-3 text-indigo-500" />
                  Без регистрация
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <Check className="h-3 w-3 text-indigo-500" />
                  Изцяло на български
                </span>
              </div>
            </div>
            <div className="lg:ml-auto lg:max-w-xl">
              <div className="rounded-[32px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-sky-500/20 p-[1px]">
                <div className="space-y-3 rounded-[31px] border border-white/20 bg-white/40 p-6 text-center shadow-[0_20px_50px_rgba(79,70,229,0.15)] backdrop-blur-lg lg:text-right">
                  <p className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-xs font-semibold uppercase tracking-[0.3em] text-transparent">
                    Разгледай Интелекта
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                    Демо табло с реалистични данни в реално време.
                  </h2>
                  <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base lg:ml-auto">
                    Виж как нашият AI превръща хаоса от касови бележки в чиста
                    статистика. Разгледай ключовите панели с автоматизирани метрики,
                    динамични графики и интелигентно управление на сметки.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <AccountHeader demoAccounts={demoAccounts} hideIncomeAction />
        </section>

        <section
          id="dashboard-demo"
          className="mx-auto max-w-7xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8"
        >
          <div id="history-demo" className="space-y-8">
            <LandingDemoGrid
              demoAccounts={demoAccounts}
              demoSummary={demoSummary}
              demoSeries={demoSeries}
              demoFilters={demoFilters}
              demoTopMerchants={demoTopMerchants}
              demoCategoryPalette={demoCategoryPalette}
              demoUpcomingPayments={demoUpcomingPayments}
              demoRecentTransactions={demoRecentTransactions}
              demoCategoryUi={demoCategoryUi}
            />
          </div>
        </section>

        <section
          id="change-demo"
          className="mx-auto max-w-7xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8"
        >
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Ресто
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Демонстрация на калкулатора.
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              Виж автоматичния разчет с примерни стойности за плащане.
            </p>
          </div>
          <ChangeCalculator
            mode="embed"
            readOnly
            demoValues={{
              billEur: "21.73",
              paidBgn: "50.00",
              paidEur: "0.00",
            }}
          />
        </section>

        <section
          id="ai-scan"
          className="mx-auto max-w-7xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Interactive AI Scan
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Виж AI сканирането в действие.
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              Симулирана транзакция с преди/след и ясно разграфени стъпки.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Преди
                  </p>
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                    <Image
                      src="/receipt-demo.svg"
                      alt="Receipt preview"
                      width={320}
                      height={420}
                      className="h-56 w-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    AI Данни ✨
                  </p>
                  <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-slate-600">
                    {scanFields.map((field) => (
                      <div
                        key={field.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {field.label}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Стъпки
                </p>
                <div className="mt-4 grid gap-3">
                  {workflowSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {step.title}
                          </p>
                          <p className="text-xs text-slate-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto max-w-7xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Планове
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Пробвай премиум без риск.
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Започни с 1 месец безплатно и отключи всички AI функции още днес.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div
              id="pricing-trial"
              className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-white/80 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.25)] backdrop-blur-sm"
            >
              <div className="absolute right-6 top-6 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Free
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100 drop-shadow-sm">
                Trial
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                1 месец БЕЗПЛАТНО
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Без карта. Без ангажименти.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Всички AI функции",
                  "Пълен достъп до анализи",
                  "Неограничени транзакции",
                  "Приоритетна поддръжка",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 p-6 shadow-[0_20px_60px_rgba(59,130,246,0.2)] backdrop-blur-sm">
              <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-400/30 blur-2xl" />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                  Premium
                </p>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-600">
                  Най-популярен
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                4.49 EUR / месец
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                След пробния период продължаваш с пълен достъп.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Всички AI функции",
                  "Пълен достъп до анализи",
                  "Неограничени транзакции",
                  "Приоритетна поддръжка",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <AuthOpenButton className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5 hover:bg-blue-700">
                Започни безплатно
              </AuthOpenButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 text-xs text-white/80 sm:px-6 lg:flex-row lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-white/20">
              <Image
                src="/novologo.png"
                alt="Logo"
                width={160}
                height={48}
                className="h-full w-full object-cover scale-240 brightness-0 invert"
                priority
              />
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 uppercase tracking-[0.2em]">
            <Link href="/contact" className="hover:text-white">
              Контакти
            </Link>
            <Link href="/faq" className="hover:text-white">
              Често задавани въпроси
            </Link>
            <Link href="/policies" className="hover:text-white">
              Политики
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Поверителност
            </Link>
          </div>
        </div>
      </footer>
      <AuthModalHost />
    </div>
  );
}

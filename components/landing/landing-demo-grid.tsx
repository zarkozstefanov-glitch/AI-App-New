"use client";
import AccountHeader from "@/components/accounts/account-header";
import AccountHistory, {
  type TransactionItem,
} from "@/components/accounts/account-history";
import AnalyticsClient, {
  type SeriesPoint,
  type Summary,
} from "@/components/dashboard/analytics-client";
import type { AccountSummary } from "@/components/accounts/accounts-context";

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
  demoAccounts,
  demoSummary,
  demoSeries,
  demoFilters,
  demoTopMerchants,
  demoCategoryPalette,
  demoUpcomingPayments,
  demoRecentTransactions,
  demoCategoryUi,
}: LandingDemoGridProps) {
  const uiForCategory = (category: string) =>
    demoCategoryUi[category] ?? demoCategoryUi.other;

  return (
    <div className="space-y-8">
      <AccountHeader demoAccounts={demoAccounts} hideIncomeAction />
      <AnalyticsClient
        demoSummary={demoSummary}
        demoSeries={demoSeries}
        demoFilters={demoFilters}
        demoTopMerchants={demoTopMerchants}
        demoCategoryPalette={demoCategoryPalette}
        demoUpcomingPayments={demoUpcomingPayments}
        demoMode
        showUpcoming
        demoUiForCategory={uiForCategory}
        demoStyle
      />
      <div id="last-operations">
        <AccountHistory
          demoRows={demoRecentTransactions}
          headerLabel="История"
          headerTitle="Последни операции"
          showViewAll={false}
          uiForCategory={uiForCategory}
          demoMode
        />
      </div>
    </div>
  );
}

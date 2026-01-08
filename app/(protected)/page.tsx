import AnalyticsClient from "@/components/dashboard/analytics-client";
import AccountHeader from "@/components/accounts/account-header";
import RecentTransactions from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <AccountHeader />
      <AnalyticsClient />
      <RecentTransactions />
    </div>
  );
}

import ListClient from "@/components/transactions/list-client";
import PageHeader from "@/components/page-header";
import { getServerTranslator } from "@/lib/i18n/server";

// Промени:
export default async function AccountsPage() {
  const { t } = await getServerTranslator();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="mb-6 w-full rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <PageHeader
          label={t("transactions.historyLabel")}
          title={t("transactions.historyTitle")}
          subtitle={t("transactions.historySubtitle")}
        />
      </div>
      <ListClient />
    </div>
  );
}
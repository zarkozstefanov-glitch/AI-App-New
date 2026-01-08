import NewTransaction from "@/components/transactions/new-transaction";
import PageHeader from "@/components/page-header";
import { getServerTranslator } from "@/lib/i18n/server";

export default function CreateTransactionPage() {
  const { t } = getServerTranslator();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="mb-6 rounded-[2rem] border border-slate-100/50 bg-white p-4 shadow-sm">
        <PageHeader
          label={t("transactions.createLabel")}
          title={t("transactions.createTitle")}
          subtitle={t("transactions.createSubtitle")}
        />
      </div>
      <NewTransaction />
    </div>
  );
}

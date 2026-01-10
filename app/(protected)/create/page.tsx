import NewTransaction from "@/components/transactions/new-transaction";
import PageHeader from "@/components/page-header";
import { getServerTranslator } from "@/lib/i18n/server";

// Променяме на "async function"
export default async function CreateTransactionPage() {
  // Добавяме "await"
  const { t } = await getServerTranslator(); 
  
  return (
    // ... останалата част от кода
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="mb-6 rounded-[2rem] border border-white/40 bg-white/20 p-4 shadow-glow backdrop-blur-3xl">
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

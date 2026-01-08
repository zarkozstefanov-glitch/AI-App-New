import DetailClient from "@/components/transactions/detail-client";
import { authOptions } from "@/lib/auth";
import type { CategoryKey } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getServerTranslator } from "@/lib/i18n/server";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export default async function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  const { t } = getServerTranslator();

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { lineItems: true },
  });

  if (!transaction) {
    notFound();
  }

  let parsedJson: unknown = null;
  try {
    parsedJson = transaction.aiExtractedJson
      ? JSON.parse(transaction.aiExtractedJson as string)
      : null;
  } catch {
    parsedJson = transaction.aiExtractedJson;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="glass shadow-glow rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-transparent p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
          {t("common.details")}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {t("transactionDetail.title")}
        </h1>
      </div>
      <DetailClient
        transaction={{
          ...transaction,
          transactionDate: transaction.transactionDate
            ? transaction.transactionDate.toISOString()
            : null,
          category: transaction.category as CategoryKey,
          aiExtractedJson: parsedJson,
        }}
      />
    </div>
  );
}

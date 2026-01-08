import Link from "next/link";
import { ArrowUpRightSquare, ListFilter } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export default function QuickActions() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 sm:w-64">
      <Link
        href="/upload"
        className="flex items-center justify-between rounded-2xl border border-cyan-200/70 bg-gradient-to-r from-cyan-200 to-blue-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(14,116,144,0.15)] transition hover:translate-y-[-1px]"
      >
        <span>{t("dashboard.uploadExpense")}</span>
        <ArrowUpRightSquare size={18} />
      </Link>
      <Link
        href="/transactions"
        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
      >
        <span>{t("dashboard.viewHistory")}</span>
        <ListFilter size={18} />
      </Link>
    </div>
  );
}

"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UploadWizard from "@/components/upload/wizard";
import ManualTransactionForm from "@/components/transactions/manual-form";
import TransferForm from "@/components/transactions/transfer-form";
import IncomeForm from "@/components/transactions/income-form";
import { useI18n } from "@/components/i18n-provider";

export default function NewTransaction() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const tabParam = searchParams.get("tab");
  const expenseParam = searchParams.get("expenseTab");
  const legacyExpenseTab =
    tabParam === "manual" ? "manual" : tabParam === "ai" ? "ai" : null;
  const initialTab =
    tabParam === "income" || tabParam === "transfer" || tabParam === "expense"
      ? (tabParam as "income" | "expense" | "transfer")
      : "expense";
  const initialExpenseTab =
    templateId
      ? "fixed"
      : expenseParam === "manual" || expenseParam === "fixed"
        ? expenseParam
        : legacyExpenseTab ?? "ai";
  const [tab, setTab] = useState<"income" | "expense" | "transfer">(initialTab);
  const [expenseTab, setExpenseTab] = useState<"ai" | "manual" | "fixed">(
    initialExpenseTab,
  );
  const { t } = useI18n();

  useEffect(() => {
    if (templateId) {
      setTab("expense");
      setExpenseTab("fixed");
    }
  }, [templateId]);

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="w-full max-w-full rounded-[2rem] border border-white/40 bg-white/20 p-4 shadow-glow backdrop-blur-3xl animate-float sm:p-6">
        <div className="mx-auto w-full max-w-full px-4 box-border sm:max-w-md">
          <div className="relative grid h-[46px] w-full grid-cols-3 items-center rounded-2xl border border-white/40 bg-white/20 p-1 backdrop-blur-xl sm:h-[52px]">
            <span
              className={`absolute inset-y-1 w-1/3 rounded-xl bg-white/70 shadow-glow transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                tab === "income"
                  ? "translate-x-0"
                  : tab === "expense"
                    ? "translate-x-full"
                    : "translate-x-[200%]"
              }`}
            />
            <button
              type="button"
              onClick={() => setTab("income")}
              className={`relative z-10 h-8 w-full rounded-xl text-[12px] font-semibold transition whitespace-nowrap sm:h-10 sm:text-[14px] ${
                tab === "income"
                  ? "border border-white/60 bg-white/60 text-emerald-600 font-bold"
                  : "text-slate-500"
              }`}
            >
              {t("transactions.income")}
            </button>
            <button
              type="button"
              onClick={() => setTab("expense")}
              className={`relative z-10 h-8 w-full rounded-xl text-[12px] font-semibold transition whitespace-nowrap sm:h-10 sm:text-[14px] ${
                tab === "expense"
                  ? "border border-white/60 bg-white/60 text-rose-600 font-bold"
                  : "text-slate-500"
              }`}
            >
              {t("transactions.expense")}
            </button>
            <button
              type="button"
              onClick={() => setTab("transfer")}
              className={`relative z-10 h-8 w-full rounded-xl text-[12px] font-semibold transition whitespace-nowrap sm:h-10 sm:text-[14px] ${
                tab === "transfer"
                  ? "border border-white/60 bg-white/60 text-blue-600 font-bold"
                  : "text-slate-500"
              }`}
            >
              {t("transactions.transfer")}
            </button>
          </div>
        </div>

        {tab === "income" && (
          <div className="mt-6 mb-6 rounded-[2rem] border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-3xl animate-float">
            <IncomeForm />
          </div>
        )}
        {tab === "expense" && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="mx-auto w-full max-w-full px-4 box-border sm:max-w-md">
              <div className="relative grid h-[38px] w-full grid-cols-3 items-center rounded-2xl border border-white/40 bg-white/20 p-1 backdrop-blur-xl sm:h-[42px]">
                <span
                  className={`absolute inset-y-1 w-1/3 rounded-xl bg-white/70 shadow-glow transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    expenseTab === "manual"
                      ? "translate-x-0"
                      : expenseTab === "ai"
                        ? "translate-x-full"
                        : "translate-x-[200%]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setExpenseTab("manual")}
                  className={`relative z-10 h-7 w-full rounded-xl border border-transparent text-[10px] font-medium transition whitespace-nowrap sm:h-8 sm:text-[11px] ${
                    expenseTab === "manual"
                      ? "text-blue-600 font-bold"
                      : "text-slate-500"
                  }`}
                >
                  {t("transactions.manual")}
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseTab("ai")}
                  className={`relative z-10 h-7 w-full rounded-xl border border-transparent text-[10px] font-medium transition whitespace-nowrap sm:h-8 sm:text-[11px] ${
                    expenseTab === "ai"
                      ? "border-blue-400/60 bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-blue-900 font-extrabold shadow-neon-strong"
                      : "text-slate-500"
                  }`}
                >
                  {t("transactions.ai")}
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseTab("fixed")}
                  className={`relative z-10 h-7 w-full rounded-xl border border-transparent text-[10px] font-medium transition whitespace-nowrap sm:h-8 sm:text-[11px] ${
                    expenseTab === "fixed"
                      ? "text-blue-600 font-bold"
                      : "text-slate-500"
                  }`}
                >
                  {t("transactions.fixed")}
                </button>
              </div>
            </div>
            {expenseTab === "ai" ? (
              <div className="grid w-full max-w-full gap-4 lg:grid-cols-2">
                <UploadWizard />
                <div className="w-full max-w-full rounded-[2rem] border border-white/40 bg-white/20 p-4 text-center shadow-glow backdrop-blur-3xl animate-float">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t("upload.aiData")} ✨
                  </p>
                  <div className="mt-3 grid gap-2 text-left text-[11px] text-slate-500">
                    <div className="rounded-2xl border border-white/40 bg-white/30 px-3 py-2 shadow-glow">
                      {t("transactions.amount")} ·{" "}
                      <span className="italic">{t("upload.autoFill")}</span>
                    </div>
                    <div className="rounded-2xl border border-white/40 bg-white/30 px-3 py-2 shadow-glow">
                      {t("transactions.category")} ·{" "}
                      <span className="italic">{t("upload.autoFill")}</span>
                    </div>
                    <div className="rounded-2xl border border-white/40 bg-white/30 px-3 py-2 shadow-glow">
                      {t("transactions.account")} ·{" "}
                      <span className="italic">{t("upload.autoFill")}</span>
                    </div>
                    <div className="rounded-2xl border border-white/40 bg-white/30 px-3 py-2 shadow-glow">
                      {t("transactions.note")} ·{" "}
                      <span className="italic">{t("upload.autoFill")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : expenseTab === "fixed" ? (
              <ManualTransactionForm key="fixed-expense" templateId={templateId} fixedOnly />
            ) : (
              <ManualTransactionForm key="manual-expense" templateId={templateId} />
            )}
          </div>
        )}
        {tab === "transfer" && (
          <div className="mt-6 mb-6 rounded-[2rem] border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-3xl animate-float">
            <TransferForm />
          </div>
        )}
      </div>
    </div>
  );
}

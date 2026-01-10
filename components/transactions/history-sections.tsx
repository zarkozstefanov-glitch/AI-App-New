"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ListClient from "@/components/transactions/list-client";
import { useI18n } from "@/components/i18n-provider";

type HistorySectionsProps = {
  previewCount?: number;
};

export default function HistorySections({ previewCount = 5 }: HistorySectionsProps) {
  const { t } = useI18n();
  const [fixedExpanded, setFixedExpanded] = useState(false);
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setFixedExpanded((open) => !open)}
          className="flex w-full items-center justify-between rounded-[2rem] border border-white/40 bg-white/20 px-6 py-4 text-left shadow-glow backdrop-blur-3xl"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {t("recurring.activeTitle")}
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm">
              {t("transactions.fixed")}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/30 text-slate-700">
            {fixedExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {fixedExpanded && (
          <ListClient
            mode="fixed"
            showFilters={false}
            showCategoryTotals={false}
            maxItems={previewCount}
          />
        )}
      </section>
      <ListClient />
    </div>
  );
}

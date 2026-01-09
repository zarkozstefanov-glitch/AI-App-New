"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import PageHeader from "@/components/page-header";
import { EUR_RATE } from "@/lib/currency";
import { useI18n } from "@/components/i18n-provider";

type ChangeCalculatorValues = {
  billEur: string;
  paidBgn: string;
  paidEur: string;
};

type ChangeCalculatorProps = {
  mode?: "page" | "embed";
  demoValues?: ChangeCalculatorValues;
  readOnly?: boolean;
};

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function roundTwo(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

function parseInput(value: string) {
  const sanitized = value.toString().replace(/,/g, ".");
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ChangeCalculator({
  mode = "page",
  demoValues,
  readOnly = false,
}: ChangeCalculatorProps) {
  const { t } = useI18n();
  const [billEur, setBillEur] = useState(demoValues?.billEur ?? "0.00");
  const [paidBgn, setPaidBgn] = useState(demoValues?.paidBgn ?? "0.00");
  const [paidEur, setPaidEur] = useState(demoValues?.paidEur ?? "0.00");
  const [showCurrency, setShowCurrency] = useState<"BGN" | "EUR">("BGN");
  const [calc, setCalc] = useState({
    totalPaidEur: 0,
    changeEur: 0,
    changeBgn: 0,
    totalBillBgn: 0,
  });

  useEffect(() => {
    if (!demoValues) return;
    setBillEur(demoValues.billEur);
    setPaidBgn(demoValues.paidBgn);
    setPaidEur(demoValues.paidEur);
  }, [demoValues]);

  useEffect(() => {
    const billValue = parseInput(billEur);
    const paidBgnValue = parseInput(paidBgn);
    const paidEurValue = parseInput(paidEur);
    const billBgn = roundTwo(billValue * EUR_RATE);
    const totalPaidBgn = roundTwo(paidEurValue * EUR_RATE + paidBgnValue);
    const restoBgn = roundTwo(totalPaidBgn - billBgn);
    const safeRestoBgn = restoBgn > 0 ? restoBgn : 0;
    const restoEur = roundTwo(safeRestoBgn / EUR_RATE);
    setCalc({
      totalPaidEur: roundTwo(totalPaidBgn / EUR_RATE),
      changeEur: restoEur,
      changeBgn: safeRestoBgn,
      totalBillBgn: billBgn,
    });
  }, [billEur, paidBgn, paidEur]);

  const billValue = parseInput(billEur);
  const paidBgnValue = parseInput(paidBgn);
  const paidEurValue = parseInput(paidEur);
  const showRemaining =
    calc.changeBgn === 0 && (paidBgnValue > 0 || paidEurValue > 0);

  const clear = () => {
    setBillEur("0.00");
    setPaidBgn("0.00");
    setPaidEur("0.00");
    setShowCurrency("BGN");
  };

  const content = (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="glass rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-glow sm:p-6">
        <div className="grid gap-4">
          <label className="text-sm text-slate-700">
            {t("change.totalBillEur")}
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={billEur}
              onChange={(e) => {
                if (readOnly) return;
                const val = e.target.value.replace(/,/g, ".");
                setBillEur(val);
              }}
              onBlur={() =>
                setBillEur(roundTwo(parseInput(billEur)).toFixed(2))
              }
              onFocus={(e) => e.target.select()}
              disabled={readOnly}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xl font-semibold text-slate-900 outline-none disabled:opacity-70"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("change.paidAmount")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-sm text-slate-700">
                {t("change.payInBgn")}
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={paidBgn}
                  onChange={(e) => {
                    if (readOnly) return;
                    const val = e.target.value.replace(/,/g, ".");
                    setPaidBgn(val);
                  }}
                  onBlur={() =>
                    setPaidBgn(roundTwo(parseInput(paidBgn)).toFixed(2))
                  }
                  onFocus={(e) => e.target.select()}
                  disabled={readOnly}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:opacity-70"
                />
              </label>
              <label className="text-sm text-slate-700">
                {t("change.payInEur")}
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={paidEur}
                  onChange={(e) => {
                    if (readOnly) return;
                    const val = e.target.value.replace(/,/g, ".");
                    setPaidEur(val);
                  }}
                  onBlur={() =>
                    setPaidEur(roundTwo(parseInput(paidEur)).toFixed(2))
                  }
                  onFocus={(e) => e.target.select()}
                  disabled={readOnly}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:opacity-70"
                />
              </label>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={clear}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("change.clear")}
            </button>
          )}
        </div>
      </div>

      <div className="glass flex w-full flex-col rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-glow sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {showCurrency === "BGN"
                  ? t("change.changeBgn")
                  : t("change.changeEur")}
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-600">
                {showCurrency === "BGN"
                  ? `BGN ${formatter.format(calc.changeBgn)}`
                  : `€${formatter.format(calc.changeEur)}`}
              </p>
              {showRemaining && (
                <p className="mt-1 text-xs text-rose-600">
                  {t("change.remainingToPay")}
                </p>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() =>
                  setShowCurrency((current) => (current === "BGN" ? "EUR" : "BGN"))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-900"
              >
                {showCurrency === "BGN"
                  ? t("change.showInEur")
                  : t("change.showInBgn")}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 w-full space-y-3 text-xs text-slate-600">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t("change.breakdown")}
          </p>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-600">
            {paidBgnValue === 0 && paidEurValue === 0 && (
              <div className="flex items-center justify-between">
                <span>{t("change.payment")}</span>
                <span className="text-right text-slate-700">
                  {t("change.waitingPayment")}
                </span>
              </div>
            )}
            {paidBgnValue > 0 && (
              <div className="flex items-center justify-between">
                <span>{t("change.paidBgn")}</span>
                <span className="text-right text-slate-700">
                  {formatter.format(paidBgnValue)} {t("common.currencyBgn")}
                </span>
              </div>
            )}
            {paidEurValue > 0 && (
              <div className="flex items-center justify-between">
                <span>{t("change.paidEur")}</span>
                <span className="text-right text-slate-700">
                  €{formatter.format(paidEurValue)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>{t("change.price")}</span>
              <span className="text-right text-slate-700">
                €{formatter.format(billValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("change.totalEur")}</span>
              <span className="text-right text-slate-700">
                €{formatter.format(calc.totalPaidEur)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{t("change.fixedRate")}</span>
              <span>1 EUR = 1.95583 BGN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === "embed") {
    return content;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 sm:gap-6">
        <div className="mb-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <PageHeader
            label={t("change.label")}
            title={t("change.title")}
            subtitle={t("change.subtitle")}
          />
        </div>
        {content}
      </div>
    </div>
  );
}

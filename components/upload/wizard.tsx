"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, FileUp, Loader2 } from "lucide-react";
import { categoryConfig, categoryKeys, getCategoryOptionsForLocale } from "@/lib/categories";
import type { CategoryKey } from "@/lib/categories";
import { convertCents, formatMoney, toCents } from "@/lib/currency";
import { mapAssistantCategory } from "@/lib/extraction/category-map";
import type { ExtractionResult } from "@/lib/extraction/schema";
import { safeFetchJson } from "@/lib/safe-fetch";
import { useAccounts } from "@/components/accounts/accounts-context";
import { formatAccountLabel } from "@/lib/accounts";
import { useI18n } from "@/components/i18n-provider";

type ExtractResponse =
  | {
      ok: true;
      extraction: ExtractionResult;
      draftId?: string;
      debug?: { model: string; elapsedMs: number };
    }
  | {
      ok: false;
      error: { code?: string; message?: string; details?: string };
    };

type WizardFormState = {
  merchantName?: string;
  transactionDate?: string;
  totalOriginal?: number | string;
  currencyOriginal?: string;
  category?: CategoryKey | string;
  notes?: string;
  sourceType?: "receipt" | "bank" | "unknown";
  accountId?: string;
  isFixed?: boolean;
};

const normalizeCategory = (value: string | null | undefined): CategoryKey => {
  if (!value) return "other";
  return (categoryKeys.includes(value as CategoryKey) ? value : "other") as CategoryKey;
};

type UploadWizardProps = {
  className?: string;
  variant?: "default" | "compact";
};

export default function UploadWizard({
  className,
  variant = "default",
}: UploadWizardProps) {
  const isCompact = variant === "compact";
  const { t, locale } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [extracted, setExtracted] = useState<ExtractionResult | null>(null);
  const [categoryConfidence, setCategoryConfidence] = useState(1);
  const [overallConfidence, setOverallConfidence] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraWarning, setCameraWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<WizardFormState>({});
  const { accounts, currentAccountId } = useAccounts();
  const categoryOptions = useMemo(() => getCategoryOptionsForLocale(locale), [locale]);

  const resolveCategoryLabel = (value: CategoryKey | string | undefined) => {
    if (!value) return t("upload.other");
    const option = categoryOptions.find((item) => item.value === value);
    if (option) return option.label;
    return categoryConfig[value as keyof typeof categoryConfig]?.label ?? t("upload.other");
  };

  const resolveAccountLabel = (accountId?: string) => {
    if (!accountId) return "—";
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? formatAccountLabel(account, locale) : "—";
  };
  const categoryEmoji: Record<string, string> = {
    food_supermarket: "🛒",
    restaurants_cafe: "🍽️",
    transport: "🚗",
    home_bills: "🏠",
    clothing: "👕",
    subscriptions: "📺",
    entertainment: "🎧",
    health: "💊",
    alcohol: "🍸",
    tobacco: "🚬",
    beauty: "✨",
    gifts: "🎁",
    other: "🧩",
    transfer: "🔁",
  };

  const totals = useMemo(() => {
    if (!formState.totalOriginal || !formState.currencyOriginal) return null;
    const amount = Number(formState.totalOriginal);
    if (Number.isNaN(amount)) return null;
    return convertCents(toCents(amount), formState.currencyOriginal);
  }, [formState.totalOriginal, formState.currencyOriginal]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentAccountId && !formState.accountId) {
      setFormState((current) => ({ ...current, accountId: currentAccountId }));
    }
  }, [currentAccountId, formState.accountId]);

  const triggerFilePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const openCamera = async () => {
    setCameraError(null);
    const isSecure =
      typeof window !== "undefined" && window.isSecureContext;
    setCameraWarning(isSecure ? null : t("upload.cameraHttpsWarning"));
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isSecure) {
      setCameraOpen(false);
      triggerFilePicker(fileInputRef.current);
      return;
    }
    if (isMobile) {
      setCameraOpen(false);
      triggerFilePicker(cameraInputRef.current);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraOpen(false);
      triggerFilePicker(cameraInputRef.current);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch (err) {
      console.warn("Camera access failed", err);
      setCameraError(t("upload.cameraError"));
      setCameraOpen(false);
      triggerFilePicker(fileInputRef.current);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setFile(captured);
        setStep(2);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("sourceType", formState.sourceType || "receipt");

    try {
      const response = await safeFetchJson<ExtractResponse>("/api/extract", {
        method: "POST",
        body,
      });
      if (!response.ok) {
        const translated = t(response.error);
        throw new Error(translated !== response.error ? translated : response.error);
      }
      if (!response.data.ok) {
        throw new Error(
          response.data.error?.message || t("upload.readError"),
        );
      }

      const extractedData = response.data.extraction;
      if (extractedData.status === "error") {
        throw new Error(extractedData.error_message || t("upload.readError"));
      }
      const payload = extractedData.data;
      if (!payload) {
        throw new Error(t("upload.missingData"));
      }
      const dateTime = payload.date ? `${payload.date}T00:00` : new Date().toISOString();
      const primaryCategory = normalizeCategory(
        mapAssistantCategory(payload.items[0]?.category ?? null),
      );

      setExtracted(extractedData);
      setDraftId(response.data.draftId ?? null);
      setCategoryConfidence(1);
      setOverallConfidence(1);
        setFormState({
          merchantName: payload.merchant_name ?? "",
          transactionDate: dateTime,
          totalOriginal: payload.total_sum_bgn ?? "",
          currencyOriginal: "BGN",
          category: primaryCategory,
          notes: "",
          sourceType:
            formState.sourceType ?? "receipt",
          accountId: formState.accountId ?? currentAccountId ?? "",
          isFixed: false,
        });
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("upload.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extracted) return;
    setLoading(true);
    setError("");
    try {
      if (!formState.accountId) {
        throw new Error(t("upload.selectAccountBeforeSave"));
      }
      const totalOriginal = Number(formState.totalOriginal);
      if (Number.isNaN(totalOriginal)) {
        throw new Error(t("upload.validAmount"));
      }


      type ExtractionItem = NonNullable<ExtractionResult["data"]>["items"][number];
      const extractionToSave: ExtractionResult = {
        ...extracted,
        status: "success",
        error_message: null,
        data: extracted.data
          ? {
              ...extracted.data,
              items: extracted.data.items.map((item: ExtractionItem) => ({
                ...item,
                category: item.category,
              })),
              merchant_name: extracted.data.merchant_name || "Unknown",
            }
          : null,
      };

      const response = await safeFetchJson("/api/transactions/from-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction: extractionToSave,
          draftId: draftId ?? undefined,
          accountId: formState.accountId,
          isFixed: false,
        }),
      });
      if (!response.ok) {
        const translated = t(response.error);
        throw new Error(translated !== response.error ? translated : response.error);
      }
      window.dispatchEvent(new CustomEvent("transactions:changed"));
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("upload.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        isCompact
          ? `w-full max-w-full box-border rounded-2xl border border-white/40 bg-white/20 p-3 shadow-glow backdrop-blur-3xl ${className ?? ""}`
          : `w-full max-w-full box-border rounded-[2rem] bg-white/20 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-8 ${
              className ?? ""
            }`
      }
    >
      {!isCompact && (
        <div className="mb-2 flex w-full flex-nowrap items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          <span
            className={`${
              step === 1
                ? "rounded-full border border-blue-200/60 bg-blue-500/10 px-2 py-1 text-blue-700"
                : "px-1"
            }`}
          >
            {t("upload.stepUpload")}
          </span>
          <span
            className={`${
              step === 2
                ? "rounded-full border border-blue-200/60 bg-blue-500/10 px-2 py-1 text-blue-700"
                : "px-1"
            }`}
          >
            {t("upload.stepAi")}
          </span>
          <span
            className={`${
              step === 3
                ? "rounded-full border border-blue-200/60 bg-blue-500/10 px-2 py-1 text-blue-700"
                : "px-1"
            }`}
          >
            {t("upload.stepEdit")}
          </span>
          <span
            className={`${
              step === 4
                ? "rounded-full border border-blue-200/60 bg-blue-500/10 px-2 py-1 text-blue-700"
                : "px-1"
            }`}
          >
            {t("upload.stepSave")}
          </span>
        </div>
      )}

      <div className={isCompact ? "mt-2 space-y-4" : "mt-3 space-y-3 sm:mt-6 sm:space-y-6"}>
        {step === 1 && (
          <div className={isCompact ? "flex flex-col gap-2" : "grid gap-2 sm:gap-4"}>
            {isCompact ? (
              <div className="rounded-2xl border border-white/40 bg-white/30 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="text-xs">✨</span>
                  {t("upload.aiScan")}
                </div>
                <div className="mt-2 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => triggerFilePicker(fileInputRef.current)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/30 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-white/40"
                  >
                    <span aria-hidden="true">📁</span>
                    {t("upload.upload")}
                  </button>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/30 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-white/40"
                  >
                    <span aria-hidden="true">📸</span>
                    {t("upload.capture")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/40 bg-white/20 backdrop-blur-3xl p-5 text-center text-slate-700 sm:min-h-[220px] sm:gap-4 sm:p-6">
                <p className="text-[13px] font-semibold text-slate-900 sm:text-lg">
                  {t("upload.uploadOrPhoto")}
                </p>
                <div className="flex w-full flex-nowrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerFilePicker(fileInputRef.current)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 px-3 text-[13px] font-bold text-slate-900 shadow-glow backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 sm:gap-3 sm:p-8 sm:text-base"
                  >
                    <FileUp className="h-5 w-5" />
                    {t("upload.upload")}
                  </button>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 px-3 text-[13px] font-bold text-slate-900 shadow-glow backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 sm:gap-3 sm:p-8 sm:text-base"
                  >
                    <Camera className="h-5 w-5" />
                    {t("upload.capture")}
                  </button>
                </div>
                <label className="w-full max-w-full text-center text-sm text-slate-700 box-border">
                  <span className="mb-0.5 block text-center text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                    {t("upload.documentType")}
                  </span>
                  <select
                    value={formState.sourceType ?? "receipt"}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        sourceType: e.target.value as "receipt" | "bank" | "unknown",
                      }))
                    }
                    className="min-h-[36px] h-auto w-full max-w-full rounded-xl border border-white/40 bg-white/30 px-2 py-1 text-center text-[13px] text-slate-900 leading-tight outline-none transition focus:border-indigo-500/50 focus:bg-white/60 box-border"
                  >
                    <option value="receipt">{t("upload.receipt")}</option>
                    <option value="bank">{t("upload.bankStatement")}</option>
                    <option value="unknown">{t("upload.unknown")}</option>
                  </select>
                </label>
              </div>
            )}
            {cameraError && (
              <p className="text-xs text-amber-600">{cameraError}</p>
            )}
            {cameraWarning && (
              <p className="text-[11px] text-amber-600">{cameraWarning}</p>
            )}
            {cameraOpen && (
              <div className="mt-2 w-full max-w-xl rounded-2xl border border-white/40 bg-white/20 p-3 text-left">
                <video ref={videoRef} className="w-full rounded-lg" playsInline />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="rounded-lg border border-cyan-200 bg-cyan-100 px-4 py-2 text-xs font-semibold text-cyan-900"
                  >
                    {t("upload.takePhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-lg bg-white/30 px-4 py-2 text-xs font-semibold text-slate-900"
                  >
                    {t("upload.cancel")}
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  stopCamera();
                  setFile(f);
                  setStep(2);
                }
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute h-0 w-0 opacity-0 pointer-events-none"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  stopCamera();
                  setFile(f);
                  setStep(2);
                }
              }}
            />
          </div>
        )}

        {step === 2 && file && (
          <div className="rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow">
            <p className="text-sm text-slate-700">
              {t("upload.sending")}
            </p>
            <button
              onClick={handleExtract}
              disabled={loading}
              className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200/70 bg-gradient-to-r from-cyan-200 to-blue-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(14,116,144,0.15)] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("upload.startExtract")}
            </button>
          </div>
        )}

        {step === 3 && extracted && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/20 p-4 shadow-glow">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("upload.resultEdit")}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    {t("upload.account")}
                    <select
                      value={formState.accountId ?? ""}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, accountId: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {formatAccountLabel(acc, locale)}
                        </option>
                      ))}
                    </select>
                    {!formState.accountId && (
                      <span className="mt-1 block text-[11px] text-rose-600">
                        {t("upload.pickAccount")}
                      </span>
                    )}
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.merchant")}
                    <input
                      name="merchantName"
                      value={formState.merchantName ?? ""}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          merchantName: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.date")}
                    <input
                      type="datetime-local"
                      name="transactionDate"
                      value={formState.transactionDate ?? ""}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          transactionDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.total")}
                    <input
                      type="number"
                      step="0.01"
                      name="totalOriginal"
                      value={formState.totalOriginal ?? ""}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          totalOriginal: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.currency")}
                    <select
                      name="currencyOriginal"
                      value={formState.currencyOriginal ?? "BGN"}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          currencyOriginal: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    >
                      <option value="BGN">BGN</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.categoryAi")}
                    <select
                      name="category"
                      value={formState.category ?? "other"}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          category: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    >
                      {categoryOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      {t("upload.confidence", {
                        value: (categoryConfidence * 100).toFixed(0),
                      })}
                    </p>
                  </label>
                  <label className="text-sm text-slate-700">
                    {t("upload.note")}
                    <textarea
                      name="notes"
                      value={formState.notes ?? ""}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          notes: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/40 bg-white/30 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white/60"
                    />
                  </label>
                </div>
                {totals && (
                  <p className="mt-3 text-sm text-cyan-700">
                    {formatMoney(totals.eurCents, totals.bgnCents)}
                  </p>
                )}
              </div>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/20 p-5 font-mono text-[11px] text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-transparent bg-gradient-to-r from-indigo-200/30 via-cyan-200/20 to-purple-200/30 opacity-0 transition-opacity duration-500 motion-safe:animate-pulse" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between font-sans">
                    <h4 className="text-base font-semibold text-slate-900">{t("upload.aiData")}</h4>
                    <span className="text-[10px] text-slate-500">
                      {t("upload.overallConfidence", {
                        value: (overallConfidence * 100).toFixed(0),
                      })}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-dashed border-white/40 bg-white/20 px-4 py-3 font-sans">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          {t("upload.merchant")}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <span>{categoryEmoji[formState.category ?? "other"] ?? "🧾"}</span>
                          {formState.merchantName?.trim() || "—"}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        {formState.transactionDate
                          ? new Date(formState.transactionDate).toLocaleDateString(
                              locale === "en" ? "en-US" : "bg-BG",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-white/40 pt-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {t("upload.total")}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {formState.totalOriginal
                          ? `${formState.totalOriginal} ${formState.currencyOriginal ?? "BGN"}`
                          : "—"}
                      </span>
                    </div>
                    {totals && (
                      <p className="mt-2 text-xs text-slate-500">
                        {formatMoney(totals.eurCents, totals.bgnCents)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-dashed border-white/40 pb-2">
                      <span className="uppercase tracking-[0.2em] text-slate-400">
                        {t("upload.categoryAi")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {resolveCategoryLabel(formState.category)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-dashed border-white/40 pb-2">
                      <span className="uppercase tracking-[0.2em] text-slate-400">
                        {t("upload.account")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {resolveAccountLabel(formState.accountId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-dashed border-white/40 pb-2">
                      <span className="uppercase tracking-[0.2em] text-slate-400">
                        {t("upload.note")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formState.notes?.trim() || "—"}
                      </span>
                    </div>
                  </div>
                </div>
                {extracted.data?.items?.length ? (
                  <div className="mt-4 space-y-2 font-sans">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      {t("upload.items")}
                    </p>
                    {extracted.data.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name_en || t("upload.itemFallback")}
                          </p>
                        </div>
                        <p className="font-semibold text-cyan-700">
                          {formatMoney(
                            Math.round(item.price_eur * 100),
                            Math.round(item.price_bgn * 100),
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-emerald-600">
                    {t("upload.fieldsClear")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !formState.accountId}
                className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-200 to-cyan-200 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-[0_8px_20px_rgba(16,185,129,0.15)] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("upload.saveTransaction")}
              </button>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {t("upload.back")}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-white/40 bg-emerald-500/10 p-6 text-slate-800">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("upload.saved")}
            </h3>
            <p className="mt-2">
              {t("upload.categoryLabel")}:{" "}
              {categoryConfig[formState.category as keyof typeof categoryConfig]?.label ??
                t("upload.other")}
            </p>
            <p className="text-sm text-slate-600">
              {t("upload.tip")}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setExtracted(null);
                  setFormState({});
                  setCategoryConfidence(1);
                  setOverallConfidence(1);
                  setDraftId(null);
                  setCameraError(null);
                  stopCamera();
                  setStep(1);
                }}
                className="rounded-xl bg-white/30 px-4 py-3 text-sm font-semibold text-slate-900"
              >
                {t("upload.newExpense")}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

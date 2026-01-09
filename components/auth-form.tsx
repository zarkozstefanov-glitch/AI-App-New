"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useI18n } from "@/components/i18n-provider";

export default function AuthForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextMode = searchParams.get("mode");
    if (nextMode === "register" || nextMode === "login") {
      setMode(nextMode);
    }
  }, [searchParams]);

  const title = useMemo(
    () => (mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")),
    [mode, t],
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({
            firstName: form.get("firstName"),
            lastName: form.get("lastName"),
            email: form.get("email"),
            phone: form.get("phone"),
            password: form.get("password"),
          }),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const data = await res.json();
          const messageKey = data?.messageKey as string | undefined;
          const translated = messageKey ? t(messageKey) : null;
          throw new Error(translated || data.message || t("auth.registerError"));
        }
        setMode("login");
      } else {
        const res = await signIn("credentials", {
          email: form.get("email"),
          password: form.get("password"),
          redirect: true,
          callbackUrl: "/",
        });
        if (res?.error) {
          throw new Error(t("auth.loginError"));
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">
            {t("auth.profileLabel")}
          </p>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {title}
          </h2>
        </div>
        <div className="flex rounded-full bg-slate-100 p-1 text-xs text-slate-700">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 text-[11px] font-semibold sm:text-xs ${mode === "login" ? "bg-white text-slate-900 shadow" : "hover:bg-white"}`}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 text-[11px] font-semibold sm:text-xs ${mode === "register" ? "bg-white text-slate-900 shadow" : "hover:bg-white"}`}
          >
            {t("auth.register")}
          </button>
        </div>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        {mode === "register" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">
              {t("auth.firstName")}
              <Input name="firstName" required />
            </label>
            <label className="text-sm text-slate-700">
              {t("auth.lastName")}
              <Input name="lastName" required />
            </label>
            <label className="text-sm text-slate-700">
              {t("auth.phoneOptional")}
              <Input name="phone" placeholder="+359..." />
            </label>
          </div>
        )}
        <label className="text-sm text-slate-700">
          {t("auth.email")}
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="text-sm text-slate-700">
          {t("auth.password")}
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && (
          <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} full>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
        </Button>
        <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
          <Lock className="h-4 w-4 text-indigo-600" />
          <p>{t("auth.dataSafe")}</p>
        </div>
      </form>
    </div>
  );
}

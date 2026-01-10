"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import AuthForm from "@/components/auth-form";

type AuthOpenButtonProps = {
  className?: string;
  children: ReactNode;
};

export function AuthOpenButton({ className, children }: AuthOpenButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("auth:open"));
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export function AuthModalHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("auth:open", handler);
    return () => window.removeEventListener("auth:open", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Вход / Регистрация
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Влез или създай профил.
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/40 p-2 text-slate-500 hover:bg-white/40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

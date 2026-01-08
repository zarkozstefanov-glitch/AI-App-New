"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Plus,
  ListOrdered,
  Settings,
  LogOut,
  Calculator,
} from "lucide-react";
import type { Session } from "next-auth";
import { useI18n } from "@/components/i18n-provider";

export default function Nav({ session }: { session: Session }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/transactions", label: t("nav.history"), icon: ListOrdered },
    { href: "/create", label: t("nav.transaction"), icon: Plus },
    { href: "/change", label: t("nav.change"), icon: Calculator },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          <div className="flex flex-1 items-center">
            <div className="mx-4 flex h-10 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white shadow-md">
              <img
                src="/novologo.png"
                alt="Logo"
                className="h-full w-full object-cover drop-shadow-sm brightness-0 invert"
              />
            </div>
          </div>
          <nav className="hidden items-center gap-2 rounded-full bg-white px-2 py-1 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/70 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${
                    active
                      ? "bg-white text-slate-900 shadow-sm shadow-slate-200/80"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 text-sm text-slate-800 shadow-lg shadow-slate-200/70">
            <div className="hidden text-right md:block">
              <p className="text-xs text-slate-500">{t("nav.welcome")}</p>
              <p className="font-semibold">
                {session.user.firstName} {session.user.lastName}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={14} />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium text-slate-700">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            const isTransaction = link.href === "/create";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 ${
                  isTransaction ? "relative -top-5" : ""
                } ${active ? "text-indigo-600 font-semibold" : "text-slate-600"}`}
              >
                {isTransaction ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-white shadow-lg shadow-indigo-500/40">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                ) : (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      active ? "bg-slate-100 text-indigo-600" : "text-slate-600"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                )}
                <span className={isTransaction ? "mt-1 text-[10px]" : ""}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

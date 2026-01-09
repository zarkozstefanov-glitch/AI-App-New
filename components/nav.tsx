"use client";

import Link from "next/link";
import Image from "next/image";
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
      <header className="sticky top-0 z-30 h-16 border-b border-blue-900/30 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex flex-1 items-center">
            <div className="mx-4 flex h-8 w-[128px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white shadow-md sm:h-9 sm:w-[150px]">
              <div className="relative h-full w-full">
                <Image
                  src="/novologo.png"
                  alt="Logo"
                  fill
                  sizes="150px"
                  className="object-cover drop-shadow-sm brightness-0 invert"
                />
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-sm font-medium text-white shadow-lg shadow-black/20 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${
                    active
                      ? "bg-white/90 text-slate-900 shadow-sm shadow-slate-200/80"
                      : "hover:bg-white/15"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 text-xs text-white">
            <div className="hidden text-right md:block">
              <p className="text-xs text-white/70">{t("nav.welcome")}</p>
              <p className="font-semibold">
                {session.user.firstName} {session.user.lastName}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20 sm:px-4 sm:py-2 sm:text-xs"
            >
              <LogOut size={12} />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-900/30 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium text-white">
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
                } ${active ? "text-cyan-200 font-semibold" : "text-white/70"}`}
              >
                {isTransaction ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-cyan-500 text-white shadow-lg shadow-cyan-500/40">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white/70">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                )}
                <span className={isTransaction ? "mt-2 text-[10px]" : "text-[10px]"}>
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

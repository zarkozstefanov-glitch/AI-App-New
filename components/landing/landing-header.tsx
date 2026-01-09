"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calculator,
  LayoutDashboard,
  ListOrdered,
} from "lucide-react";
import { AuthOpenButton } from "@/components/auth/auth-modal";
import { useI18n } from "@/components/i18n-provider";

const navLinks = [
  { href: "#dashboard-demo", label: "Табло" },
  { href: "#last-operations", label: "История" },
  { href: "#ai-scan", label: "Транзакция" },
  { href: "#change-demo", label: "Ресто" },
  { href: "#pricing-trial", label: "Цени", highlight: true },
];

const mobileLinks = [
  { href: "#last-operations", label: "История", icon: ListOrdered },
  { href: "#change-demo", label: "Ресто", icon: Calculator },
  { href: "#dashboard-demo", label: "Табло", icon: LayoutDashboard, primary: true },
];

export default function LandingHeader() {
  const { locale, setLocale } = useI18n();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const isDesktop = () => window.innerWidth >= 1024;
    const handleScroll = () => {
      if (isDesktop()) {
        setHidden(false);
        return;
      }
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastY && currentY > 80;
      setHidden(isScrollingDown);
      lastY = currentY;
    };
    const handleResize = () => {
      if (isDesktop()) {
        setHidden(false);
      } else {
        lastY = window.scrollY;
      }
    };
    handleScroll();
    handleResize();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const headerClass =
    "border-blue-900/40 bg-gradient-to-r from-blue-900 to-indigo-900 text-white backdrop-blur-md";
  const navClass = "border-white/15 bg-white/10 text-white";
  const buttonClass = "border-white/20 bg-white/10 text-white hover:bg-white/20";
  const logoWrapClass = "border-white/70 bg-white/10 ring-white/20";

  return (
    <>
      <header
        className={`h-16 w-full border-b ${headerClass}`}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 100,
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap whitespace-nowrap">
            <Link href="/" className="flex items-center">
              <span
                className={`flex h-7 w-20 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm ring-1 ${logoWrapClass}`}
              >
                <Image
                  src="/novologo.png"
                  alt="Logo"
                  width={80}
                  height={28}
                  className="h-full w-full object-cover scale-240 brightness-0 invert"
                  priority
                />
              </span>
            </Link>
            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
              <div className="flex items-center rounded-full border border-white/20 bg-white/10 px-1 py-1 text-[10px] font-semibold sm:text-xs whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setLocale("bg")}
                  className={`rounded-full px-3 py-1 transition ${
                    locale === "bg" ? "bg-white/20 text-white" : "text-white/70"
                  }`}
                >
                  BG
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`rounded-full px-3 py-1 transition ${
                    locale === "en" ? "bg-white/20 text-white" : "text-white/70"
                  }`}
                >
                  EN
                </button>
              </div>
            <AuthOpenButton
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur transition sm:px-4 sm:py-2 sm:text-xs whitespace-nowrap ${buttonClass}`}
            >
              Вход / Регистрация
            </AuthOpenButton>
          </div>
          </div>
          <nav
            className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-md md:flex ${navClass}`}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 transition ${
                  link.highlight ? "text-cyan-200" : ""
                } hover:bg-white/15`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium text-slate-700">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const isPrimary = link.primary;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 ${
                  isPrimary ? "relative -top-5" : ""
                }`}
              >
                {isPrimary ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-500/40">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                )}
                <span className={isPrimary ? "mt-1 text-[10px]" : ""}>
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calculator,
  LayoutDashboard,
  ListOrdered,
  Plus,
  Tag,
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
  { href: "#dashboard-demo", label: "Табло", icon: LayoutDashboard },
  { href: "#last-operations", label: "История", icon: ListOrdered },
  { href: "#ai-scan", label: "Транзакция", icon: Plus, primary: true },
  { href: "#change-demo", label: "Ресто", icon: Calculator },
  { href: "#pricing-trial", label: "Цени", icon: Tag },
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

  return (
    <>
      <header
        className={`h-14 w-full border-b sm:h-16 ${headerClass}`}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 100,
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-2 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <span className="flex h-8 w-[128px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 shadow-md sm:h-9 sm:w-[150px]">
              <span className="relative h-full w-full">
                <Image
                  src="/novologo.png"
                  alt="Logo"
                  fill
                  sizes="150px"
                  className="object-cover brightness-0 invert"
                  priority
                />
              </span>
            </span>
          </Link>

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

          <div className="flex items-center gap-2 whitespace-nowrap sm:gap-3">
            <div className="flex items-center rounded-full border border-white/20 bg-white/10 px-0.5 py-0.5 text-[9px] font-semibold sm:px-1.5 sm:py-1 sm:text-xs">
              <button
                type="button"
                onClick={() => setLocale("bg")}
                className={`rounded-full px-2 py-0.5 transition sm:px-3 sm:py-1 ${
                  locale === "bg" ? "bg-white/20 text-white" : "text-white/70"
                }`}
              >
                BG
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded-full px-2 py-0.5 transition sm:px-3 sm:py-1 ${
                  locale === "en" ? "bg-white/20 text-white" : "text-white/70"
                }`}
              >
                EN
              </button>
            </div>
            <AuthOpenButton
              className={`rounded-full border px-2 py-1 text-[9px] font-semibold shadow-sm backdrop-blur transition whitespace-nowrap sm:px-4 sm:py-2 sm:text-xs ${buttonClass}`}
            >
              <span className="sm:hidden">Вход</span>
              <span className="hidden sm:inline">Вход / Регистрация</span>
            </AuthOpenButton>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-900/30 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium text-white">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const isPrimary = link.primary;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 ${
                  isPrimary ? "relative -top-5" : ""
                } ${isPrimary ? "text-cyan-200 font-semibold" : "text-white/70"}`}
              >
                {isPrimary ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-cyan-500 text-white shadow-lg shadow-cyan-500/40">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white/70">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                )}
                <span className={isPrimary ? "mt-1 text-[10px]" : "text-[10px]"}>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  ListOrdered,
  Plus,
  Tag,
} from "lucide-react";
import { AuthOpenButton } from "@/components/auth/auth-modal";
import { useI18n } from "@/components/i18n-provider";

export default function LandingHeader() {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const navLinks = [
    { href: "#dashboard-demo", label: t("nav.dashboard") },
    { href: "#last-operations", label: t("nav.history") },
    { href: "#ai-scan", label: t("nav.transaction") },
    { href: "#change-demo", label: t("nav.change") },
    { href: "#pricing-trial", label: t("landing.nav.plans"), highlight: true },
  ];

  const mobileLinks = [
    { href: "#dashboard-demo", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "#last-operations", label: t("nav.history"), icon: ListOrdered },
    { href: "#ai-scan", label: t("nav.transaction"), icon: Plus, primary: true },
    { href: "#change-demo", label: t("nav.change"), icon: Calculator },
    { href: "#pricing-trial", label: t("landing.nav.plans"), icon: Tag },
  ];

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

  const headerClass = "bg-transparent text-slate-800";
  const navClass = "border-white/50 bg-white/50 text-slate-700 shadow-glow";
  const buttonClass =
    "border-white/60 bg-white/50 text-slate-700 shadow-glow hover:shadow-neon-strong";

  return (
    <>
      <header
        className={`h-14 w-full sm:h-16 ${headerClass}`}
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
          <div className="flex h-12 w-full items-center justify-between rounded-full border border-white/50 bg-white/50 px-3 shadow-glow backdrop-blur-2xl sm:h-14 sm:px-5">
            <Link href="/" className="flex items-center">
            <span className="flex h-8 w-[128px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 shadow-glow sm:h-9 sm:w-[150px]">
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
            className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md lg:flex ${navClass}`}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-slate-700 transition hover:scale-[1.05] hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 whitespace-nowrap sm:gap-3 lg:flex">
            <div className="flex items-center rounded-full border border-white/50 bg-white/50 px-0.5 py-0.5 text-[9px] font-semibold shadow-glow sm:px-1.5 sm:py-1 sm:text-xs">
              <button
                type="button"
                onClick={() => setLocale("bg")}
                className={`rounded-full px-2 py-0.5 transition hover:scale-[1.05] sm:px-3 sm:py-1 ${
                  locale === "bg" ? "bg-white/70 text-slate-800" : "text-slate-500"
                }`}
              >
                BG
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded-full px-2 py-0.5 transition hover:scale-[1.05] sm:px-3 sm:py-1 ${
                  locale === "en" ? "bg-white/70 text-slate-800" : "text-slate-500"
                }`}
              >
                EN
              </button>
            </div>
            <AuthOpenButton
              className={`rounded-full border px-2 py-1 text-[9px] font-semibold backdrop-blur transition hover:scale-[1.05] whitespace-nowrap sm:px-4 sm:py-2 sm:text-xs ${buttonClass}`}
            >
              <span className="sm:hidden">{t("auth.login")}</span>
              <span className="hidden sm:inline">
                {t("auth.login")} / {t("auth.register")}
              </span>
            </AuthOpenButton>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <AuthOpenButton className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 shadow-glow backdrop-blur-xl transition hover:scale-[1.05]">
              {t("landing.hero.ctaPrimary")}
            </AuthOpenButton>
          </div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-4 left-4 right-4 z-50 h-20 overflow-visible rounded-3xl border border-white/70 bg-white/40 text-slate-700 shadow-glow backdrop-blur-xl md:hidden">
        <div className="flex h-full items-center justify-around px-3 py-2 text-[12px] font-semibold text-slate-900">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const isPrimary = link.primary;
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 ${
                  isPrimary ? "relative -top-6" : ""
                } text-slate-900`}
              >
                {isPrimary ? (
                  <span
                    className={`flex h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white/80 shadow-glow ${
                      active ? "bg-white" : "bg-indigo-500"
                    }`}
                  >
                    <Icon
                      size={26}
                      strokeWidth={2}
                      className={active ? "text-violet-600" : "text-violet-100"}
                    />
                  </span>
                ) : (
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      active ? "bg-white" : "bg-indigo-500/70"
                    }`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={1.9}
                      className={active ? "text-violet-600" : "text-violet-100"}
                    />
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

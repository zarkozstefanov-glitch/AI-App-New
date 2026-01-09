"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";

type FooterProps = {
  variant?: "content" | "footer";
  className?: string;
};

export default function Footer({ variant = "footer", className }: FooterProps) {
  const { t } = useI18n();
  const links = [
    { href: "/contact", label: t("footer.contacts") },
    { href: "/faq", label: t("footer.faq") },
    { href: "/policies", label: t("footer.policies") },
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
  ];
  const wrapperClass =
    variant === "content"
      ? "mx-4 mt-8 mb-[120px] rounded-2xl bg-white p-6 text-center shadow-sm lg:py-8"
      : "mx-4 rounded-2xl bg-white p-6 text-center shadow-sm lg:py-8";
  const logoFilterClass = variant === "footer" ? "brightness-0 invert" : "";
  const content = (
    <div className={`${wrapperClass} ${className ?? ""}`}>
      <div className="flex items-center justify-center">
        <span className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-white/20">
          <Image
            src="/novologo.png"
            alt="Logo"
            width={160}
            height={48}
            className={`h-full w-full object-cover scale-240 ${logoFilterClass}`}
          />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-700">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 border-t border-slate-50 pt-3">
        <a
          href="https://automation-z.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] font-bold uppercase tracking-widest text-[#3B82F6] hover:underline"
        >
          {t("footer.poweredBy")}
        </a>
      </div>
    </div>
  );

  if (variant === "content") {
    return content;
  }

  return (
    <footer
      className={`border-t border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white ${className ?? ""}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-12">
        <div className="mt-10">{content}</div>
      </div>
    </footer>
  );
}

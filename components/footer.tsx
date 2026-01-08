"use client";

import Link from "next/link";
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
  const content = (
    <div className={`${wrapperClass} ${className ?? ""}`}>
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
    <footer className={`border-t border-slate-100 bg-white/70 ${className ?? ""}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-12">
        <div className="mt-10">{content}</div>
      </div>
    </footer>
  );
}

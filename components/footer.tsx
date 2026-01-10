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
  const containerClass = variant === "content" ? "mt-8" : "";
  const bottomPadding = variant === "content" ? "pb-24 sm:pb-12" : "pb-20 sm:pb-12";
  const content = (
    <div className={`mx-auto w-full max-w-7xl px-4 pt-6 sm:px-8 lg:px-12 ${bottomPadding}`}>
      <div className="flex flex-col items-center gap-4 text-sm text-gray-500">
        <nav className="grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-2 text-center text-sm sm:flex sm:max-w-none sm:justify-center sm:gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="w-full border-t border-gray-100 pt-3">
          <a
            href="https://automation-z.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-500"
          >
            {t("footer.poweredBy")}
          </a>
        </div>
      </div>
    </div>
  );

  if (variant === "content") {
    return <div className={`${containerClass} ${className ?? ""}`}>{content}</div>;
  }

  return (
    <footer
      className={`border-t border-white/30 bg-white/10 text-gray-500 shadow-glow backdrop-blur-3xl ${className ?? ""}`}
    >
      {content}
    </footer>
  );
}

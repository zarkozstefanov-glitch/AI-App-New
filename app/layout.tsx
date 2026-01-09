import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { translations } from "@/lib/i18n/translations";
import { getServerTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: translations.bg.app.title,
  description: translations.bg.app.description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Вече правилно изчакваме преводача
  const { t, locale } = await getServerTranslator();

  return (
    <html lang={locale}>
      <body className="min-h-[100dvh] overflow-x-hidden antialiased text-slate-900">
<Providers>
  {children}
</Providers>
      </body>
    </html>
  );
}
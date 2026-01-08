import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { translations } from "@/lib/i18n/translations";

export const metadata: Metadata = {
  title: translations.bg.app.title,
  description: translations.bg.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className="min-h-[100dvh] overflow-x-hidden antialiased text-slate-900">
        <div>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

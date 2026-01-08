"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { AccountsProvider } from "@/components/accounts/accounts-context";
import { I18nProvider } from "@/components/i18n-provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <AccountsProvider>{children}</AccountsProvider>
      </I18nProvider>
    </SessionProvider>
  );
}

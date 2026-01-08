"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AccountSummary = {
  id: string;
  name: string;
  kind: string;
  currency: string;
  balanceBgnCents: number;
  balanceEurCents: number;
};

type AccountsContextValue = {
  accounts: AccountSummary[];
  currentAccountId: string | null;
  setCurrentAccountId: (id: string) => void;
  refreshAccounts: () => Promise<void>;
};

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const list = (data.data ?? []) as AccountSummary[];
    setAccounts(list);
    if (!currentAccountId && list.length > 0) {
      setCurrentAccountId(list[0].id);
    }
  }, [currentAccountId]);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const value = useMemo(
    () => ({
      accounts,
      currentAccountId,
      setCurrentAccountId,
      refreshAccounts,
    }),
    [accounts, currentAccountId, refreshAccounts],
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within AccountsProvider");
  }
  return context;
}

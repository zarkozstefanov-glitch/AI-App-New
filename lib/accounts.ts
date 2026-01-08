export type AccountLabelInput = {
  name: string;
  kind?: string | null;
  currency?: string | null;
};

export function formatAccountLabel(
  account: AccountLabelInput,
  locale: "bg" | "en" = "bg",
) {
  const defaults: Record<NonNullable<AccountLabelInput["kind"]>, string[]> = {
    cash: ["В брой", "Cash"],
    bank: ["Банкова сметка", "Bank account"],
    savings: ["Спестовна сметка", "Savings"],
  };
  if (account.kind && account.name && !defaults[account.kind]?.includes(account.name)) {
    return account.name;
  }
  if (account.kind === "cash") return locale === "en" ? "Cash" : "В брой";
  if (account.kind === "bank")
    return locale === "en" ? "Bank account" : "Банкова сметка";
  if (account.kind === "savings")
    return locale === "en" ? "Savings" : "Спестовна сметка";
  return account.name;
}

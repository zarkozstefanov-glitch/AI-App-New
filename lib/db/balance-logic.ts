export function isBalanceEffective(
  isFixed: boolean,
  transactionDate: Date | null | undefined,
) {
  if (!isFixed) return true;
  if (!transactionDate) return true;
  return transactionDate.getTime() <= Date.now();
}

export function isBalanceCurrentlyApplied(
  isFixed: boolean,
  transactionDate: Date | null | undefined,
  isBalanceApplied: boolean,
) {
  if (!isFixed) return true;
  if (!transactionDate) return isBalanceApplied;
  if (transactionDate.getTime() > Date.now()) return false;
  return isBalanceApplied;
}

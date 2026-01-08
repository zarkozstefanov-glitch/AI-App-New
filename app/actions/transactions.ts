"use server";

import { updateTransactionWithHistory } from "@/lib/db/transaction-edit";
import { getCurrentUser } from "@/lib/auth/server-session";

export async function editTransactionAction(
  id: string,
  payload: Parameters<typeof updateTransactionWithHistory>[2],
) {
  const user = await getCurrentUser();
  const updated = await updateTransactionWithHistory(user.id, id, payload);
  if (!updated) {
    throw new Error("Transaction not found");
  }
  return { ok: true };
}

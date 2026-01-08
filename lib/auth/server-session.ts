import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email?: string | null;
};

export class UnauthorizedError extends Error {
  status = 401 as const;
  code = "UNAUTHORIZED" as const;
  constructor(message = "Неоторизиран достъп") {
    super(message);
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return { id: session.user.id, email: session.user.email };
}

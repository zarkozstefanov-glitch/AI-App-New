import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      nickname?: string | null;
      monthlyBudgetGoal?: number | null;
      storeOriginalImage: boolean;
    };
  }

  interface User {
    firstName: string;
    lastName: string;
    nickname?: string | null;
    monthlyBudgetGoal?: number | null;
    storeOriginalImage: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    nickname?: string | null;
    monthlyBudgetGoal?: number | null;
    storeOriginalImage?: boolean;
  }
}

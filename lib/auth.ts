import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, req) => {
      if (!credentials?.email || !credentials.password) return null;

      // Правилно извличане на IP адреса за rate limiting
      const headers = req?.headers;
      let ip = "unknown";

      if (headers) {
        ip = headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
      }

      // Проверка на лимита за опити
      const limited = await rateLimit(`login-${ip}`, {
        limit: 5,
        windowMs: 60000, // 1 минута в милисекунди
      });
      if (!limited.success) {
        throw new Error("Твърде много опити. Опитай след минута.");
      }

      // Търсене на потребителя в базата данни
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });

      if (!user) return null;

      // Проверка на паролата
      const isValid = await compare(credentials.password, user.passwordHash);
      if (!isValid) return null;

      // Връщане на потребителските данни към JWT сесията
      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname ?? undefined,
        monthlyBudgetGoal: user.monthlyBudgetGoal ?? undefined,
        storeOriginalImage: user.storeOriginalImage,
      };
    },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const resolvedBase = process.env.NEXTAUTH_URL || baseUrl;
      if (url.startsWith("/")) return `${resolvedBase}${url}`;
      if (url.startsWith(resolvedBase)) return url;
      return resolvedBase;
    },
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const enrichedUser = user as {
          id?: string;
          email?: string | null;
          firstName?: string;
          lastName?: string;
          nickname?: string | null;
          monthlyBudgetGoal?: number | null;
          storeOriginalImage?: boolean;
        };
        token.id = enrichedUser.id;
        token.email = enrichedUser.email ?? token.email;
        token.firstName = enrichedUser.firstName;
        token.lastName = enrichedUser.lastName;
        token.nickname = enrichedUser.nickname;
        token.monthlyBudgetGoal = enrichedUser.monthlyBudgetGoal;
        token.storeOriginalImage = enrichedUser.storeOriginalImage;
      } else {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.nickname = dbUser.nickname ?? undefined;
            token.monthlyBudgetGoal = dbUser.monthlyBudgetGoal ?? undefined;
            token.storeOriginalImage = dbUser.storeOriginalImage;
          }
        }
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      session.user = {
        id: (token.id as string) ?? "",
        email: token.email ?? "",
        name:
          `${(token.firstName as string | undefined) ?? ""} ${(token.lastName as string | undefined) ?? ""}`.trim(),
        firstName: (token.firstName as string) ?? "",
        lastName: (token.lastName as string) ?? "",
        nickname: (token.nickname as string | null | undefined) ?? null,
        monthlyBudgetGoal:
          (token.monthlyBudgetGoal as number | null | undefined) ?? null,
        storeOriginalImage: Boolean(token.storeOriginalImage),
      };
      return session;
    },
  },
  // За да не спираме средата, падaме обратно към dev стойност ако липсва
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-fallback",
};

export const getServerAuthSession = () => getServerSession(authOptions);

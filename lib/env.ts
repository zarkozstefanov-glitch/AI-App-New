import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_ASSISTANT_ID: z.string().min(1).optional(),
});

type Env = z.infer<typeof envSchema>;

function normalizeValue(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
  });

  if (!parsed.success) {
    throw new Error("Environment validation failed");
  }

  cachedEnv = {
    ...parsed.data,
    DATABASE_URL: normalizeValue(parsed.data.DATABASE_URL) ?? "",
    NEXTAUTH_SECRET: normalizeValue(parsed.data.NEXTAUTH_SECRET),
    NEXTAUTH_URL: normalizeValue(parsed.data.NEXTAUTH_URL),
    OPENAI_API_KEY: normalizeValue(parsed.data.OPENAI_API_KEY),
    OPENAI_ASSISTANT_ID: normalizeValue(parsed.data.OPENAI_ASSISTANT_ID),
  };

  if (process.env.NODE_ENV !== "production") {
    const key = cachedEnv.OPENAI_API_KEY;
    const db = cachedEnv.DATABASE_URL;
    if (key) {
      console.log(`[openai] key loaded: ${key.slice(0, 6)}… (len ${key.length})`);
    } else {
      console.warn("[openai] OPENAI_API_KEY is not set");
    }
    if (!cachedEnv.OPENAI_ASSISTANT_ID) {
      console.warn("[openai] OPENAI_ASSISTANT_ID is not set");
    }
    console.log(`[env] DATABASE_URL present: ${Boolean(db)} (len ${db.length})`);
  }

  return cachedEnv;
}

function isPlausibleOpenAIKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("sk-")) return false;
  if (trimmed.length < 40) return false;
  return true;
}

export function getOpenAIKey() {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  if (!isPlausibleOpenAIKey(env.OPENAI_API_KEY)) {
    throw new Error("OPENAI_API_KEY invalid");
  }
  return env.OPENAI_API_KEY.trim();
}

export function getOpenAIAssistantId() {
  const env = getEnv();
  if (!env.OPENAI_ASSISTANT_ID) {
    throw new Error("OPENAI_ASSISTANT_ID not set");
  }
  return env.OPENAI_ASSISTANT_ID.trim();
}

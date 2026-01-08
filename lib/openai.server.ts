import "server-only";

import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/env";

export function getOpenAI() {
  const apiKey = getOpenAIKey();
  return new OpenAI({ apiKey });
}

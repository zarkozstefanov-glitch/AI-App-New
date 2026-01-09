type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; raw?: string };

function stripCodeFence(input: string) {
  return input.replace(/```(?:json)?/g, "").trim();
}

function normalizeJson(input: string) {
  return input
    .replace(/\uFEFF/g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/\bNaN\b/g, "null")
    .replace(/\bInfinity\b/g, "null")
    .trim();
}

function extractJsonSubstring(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return input.slice(start, end + 1);
}

export function parseExtraction(content: string): ParseResult {
  if (!content) {
    return { ok: false, error: "Empty response from model" };
  }

  const cleaned = normalizeJson(stripCodeFence(content));
  const jsonCandidate = normalizeJson(extractJsonSubstring(cleaned) ?? cleaned);

  try {
    const parsed = JSON.parse(jsonCandidate);
    return { ok: true, data: parsed };
  } catch {
    return {
      ok: false,
      error: "Invalid extraction JSON",
      raw: content,
    };
  }
}

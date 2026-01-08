type SafeJsonSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type SafeJsonFailure = {
  ok: false;
  status: number;
  error: string;
  errorKey?: string;
  raw?: string;
  data?: unknown;
};

export type SafeJsonResult<T> = SafeJsonSuccess<T> | SafeJsonFailure;

export async function safeFetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<SafeJsonResult<T>> {
  const res = await fetch(input, init);
  const text = await res.text();

  if (!text) {
    const errorKey = "errors.emptyResponse";
    return { ok: false, status: res.status, error: errorKey, errorKey, raw: text };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error("Invalid JSON response", { status: res.status, text, error });
    const errorKey = "errors.invalidResponse";
    return {
      ok: false,
      status: res.status,
      error: errorKey,
      errorKey,
      raw: text,
    };
  }

  if (!res.ok) {
    const errorKey =
      (parsed as { messageKey?: string; error?: { messageKey?: string } })
        ?.messageKey ||
      (parsed as { error?: { messageKey?: string } })?.error?.messageKey ||
      undefined;
    const message =
      (parsed as { message?: string; error?: { message?: string } })?.message ||
      (parsed as { error?: { message?: string } })?.error?.message ||
      "errors.requestFailed";
    return {
      ok: false,
      status: res.status,
      error: errorKey ?? message,
      errorKey,
      data: parsed,
      raw: text,
    };
  }

  return { ok: true, status: res.status, data: parsed as T };
}

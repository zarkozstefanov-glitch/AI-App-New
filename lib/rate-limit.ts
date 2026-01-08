type Bucket = { count: number; expires: number };

const store = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.expires < now) {
    store.set(key, { count: 1, expires: now + windowMs });
    return { success: true };
  }

  if (bucket.count >= limit) {
    return { success: false, retryAfter: Math.ceil((bucket.expires - now) / 1000) };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { success: true };
}

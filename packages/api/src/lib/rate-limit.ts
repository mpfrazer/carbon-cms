interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Purge stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of store) {
    if (entry.windowStart < cutoff) store.delete(key);
  }
}, 300_000);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // unix seconds
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, limit, remaining: limit - 1, resetAt: Math.ceil((now + windowMs) / 1000) };
  }

  entry.count++;
  const resetAt = Math.ceil((entry.windowStart + windowMs) / 1000);
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, limit, remaining, resetAt };
}

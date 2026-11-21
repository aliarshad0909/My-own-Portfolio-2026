/**
 * Lightweight sliding-window rate limiter protecting demo write & reset routes
 * from abuse without requiring external Redis infrastructure.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, retryAfterSeconds: 0 };
}

export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "local";
  const ip = fwd.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}`;
}

export function clearRateLimitsForTests(): void {
  store.clear();
}

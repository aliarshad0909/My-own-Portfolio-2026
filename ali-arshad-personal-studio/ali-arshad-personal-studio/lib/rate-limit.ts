/**
 * Small in-memory sliding-window rate limiter.
 *
 * This protects a single server instance. On serverless platforms each
 * instance keeps its own counter, so treat it as a first line of defence and
 * add a shared store (e.g. Upstash Redis) or the platform firewall before
 * running paid traffic to the site. See README → "Before public launch".
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { allowed: true, retryAfter: 0 };
}

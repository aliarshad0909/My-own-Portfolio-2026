/**
 * Server-only rate limiting with optional Upstash Redis REST backend for
 * distributed Vercel serverless enforcement, falling back safely to the
 * in-memory sliding window when Upstash is not configured.
 */
import { envVar } from "@/lib/form-security";
import { rateLimit as memoryRateLimit } from "@/lib/rate-limit";
import type { ServiceHealthState } from "@/lib/admin/types";

export function isUpstashConfigured(): boolean {
  return envVar("UPSTASH_REDIS_REST_URL") !== "" && envVar("UPSTASH_REDIS_REST_TOKEN") !== "";
}

export async function checkUpstashStatus(): Promise<{ state: ServiceHealthState; detail: string }> {
  if (!isUpstashConfigured()) {
    return {
      state: "needs_setup",
      detail: "Optional. In-memory rate limiting is active; add UPSTASH_REDIS_REST_URL & TOKEN for multi-instance Redis.",
    };
  }
  try {
    const url = envVar("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
    const res = await fetch(`${url}/ping`, {
      method: "GET",
      headers: { Authorization: `Bearer ${envVar("UPSTASH_REDIS_REST_TOKEN")}` },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) {
      return { state: "error", detail: `Upstash REST responded with HTTP ${res.status}.` };
    }
    return { state: "connected", detail: "Upstash Redis REST connected for distributed rate limiting." };
  } catch {
    return { state: "offline", detail: "Could not reach Upstash Redis REST endpoint (falling back to in-memory)." };
  }
}

/**
 * Distributed-ready rate limit helper for sensitive admin endpoints (login, outbound send/publish).
 * Uses Upstash Redis REST pipeline (`INCR` + `EXPIRE` NX) when configured, otherwise in-memory.
 */
export async function adminRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 15 * 60,
): Promise<{ allowed: boolean; retryAfter: number; backend: "upstash" | "memory" }> {
  if (!isUpstashConfigured()) {
    const local = memoryRateLimit(key, limit, windowSeconds * 1000);
    return { ...local, backend: "memory" };
  }

  try {
    const base = envVar("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
    const redisKey = `ali-studio:rl:${key}`;
    const res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envVar("UPSTASH_REDIS_REST_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSeconds, "NX"],
        ["TTL", redisKey],
      ]),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { result?: number }[];
    const count = Number(data?.[0]?.result ?? 1);
    const ttl = Math.max(1, Number(data?.[2]?.result ?? windowSeconds));
    if (count > limit) {
      return { allowed: false, retryAfter: ttl, backend: "upstash" };
    }
    return { allowed: true, retryAfter: 0, backend: "upstash" };
  } catch {
    const local = memoryRateLimit(key, limit, windowSeconds * 1000);
    return { ...local, backend: "memory" };
  }
}

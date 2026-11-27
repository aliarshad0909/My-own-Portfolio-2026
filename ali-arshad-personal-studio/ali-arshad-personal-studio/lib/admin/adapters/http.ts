/**
 * Shared server-only HTTP adapter utilities for external services
 * (Listmonk, Postiz, Twenty CRM, Gmail, GitHub).
 * Enforces URL validation, timeouts, no-store caching, and secret-free error strings.
 */
import { envVar } from "@/lib/form-security";
import type { ServiceHealthState } from "@/lib/admin/types";

export type SafeUrlResult =
  | { ok: true; baseUrl: string; host: string }
  | { ok: false; state: "needs_setup" | "error"; detail: string };

export function safeServiceBaseUrl(envName: string, label: string): SafeUrlResult {
  const raw = envVar(envName);
  if (!raw) {
    return {
      ok: false,
      state: "needs_setup",
      detail: `${label} is not configured yet. Add ${envName} and credentials in environment variables.`,
    };
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        ok: false,
        state: "error",
        detail: `${envName} must use an https:// (or local http://) URL.`,
      };
    }
    return {
      ok: true,
      baseUrl: parsed.toString().replace(/\/+$/, ""),
      host: parsed.host,
    };
  } catch {
    return {
      ok: false,
      state: "error",
      detail: `${envName} is not a valid URL.`,
    };
  }
}

export type AdapterFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; state: Exclude<ServiceHealthState, "connected" | "needs_setup">; status?: number; detail: string };

export async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<AdapterFetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        state: "error",
        status: res.status,
        detail: `Authentication rejected by remote service (HTTP ${res.status}). Check your server API credentials.`,
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        state: "error",
        status: res.status,
        detail: "Remote API endpoint returned HTTP 404. Verify the base URL and service version.",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        state: "error",
        status: res.status,
        detail: `Remote service responded with HTTP ${res.status}.`,
      };
    }

    if (res.status === 204) {
      return { ok: true, status: res.status, data: {} as T };
    }

    const text = await res.text();
    if (!text.trim()) {
      return { ok: true, status: res.status, data: {} as T };
    }

    try {
      const parsed = JSON.parse(text) as T;
      return { ok: true, status: res.status, data: parsed };
    } catch {
      return {
        ok: false,
        state: "error",
        status: res.status,
        detail: "Remote service returned a non-JSON response.",
      };
    }
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      ok: false,
      state: "offline",
      detail: isTimeout
        ? "Service timed out while responding. Confirm the self-hosted container is awake and reachable over HTTPS."
        : "Service could not be reached over the network. Confirm DNS, HTTPS TLS, and firewall rules.",
    };
  }
}

/**
 * In-memory idempotency guard (5 minute TTL) to stop duplicate outbound sends/publishes
 * caused by accidental double-clicks or client retries.
 */
const recentIdempotencyKeys = new Map<string, number>();

export function claimIdempotencyKey(namespace: string, key: string, ttlMs = 5 * 60_000): boolean {
  const clean = key.trim();
  if (!clean) return false;
  const now = Date.now();
  for (const [k, exp] of recentIdempotencyKeys) {
    if (exp <= now) recentIdempotencyKeys.delete(k);
  }
  const composite = `${namespace}:${clean}`;
  if (recentIdempotencyKeys.has(composite)) {
    return false;
  }
  recentIdempotencyKeys.set(composite, now + ttlMs);
  return true;
}

export function resetIdempotencyKeysForTests(): void {
  recentIdempotencyKeys.clear();
}

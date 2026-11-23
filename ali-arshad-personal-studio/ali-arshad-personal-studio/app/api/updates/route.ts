import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { normaliseUpdates, validateUpdates, type UpdatesResponse } from "@/lib/updates";
import { deliverUpdatesSignup, isUpdatesConfigured } from "@/lib/updates-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: UpdatesResponse, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `updates:${ip}`;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 403);
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 415);
  }

  const limited = rateLimit(clientKey(request));
  if (!limited.allowed) {
    return json(
      { ok: false, code: "rate_limited", message: "Too many signup attempts. Please try again later." },
      429,
      { "Retry-After": String(limited.retryAfter) },
    );
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 4000) {
      return json({ ok: false, code: "bad_request", message: "Request payload is too large." }, 413);
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("invalid");
    raw = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: "bad_request", message: "Invalid signup request." }, 400);
  }

  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0;
  if (honeypot !== "" || elapsed < 1800) {
    return json({ ok: false, code: "bad_request", message: "Signup could not be verified. Please try again." }, 400);
  }

  const signup = normaliseUpdates(raw);
  const errors = validateUpdates(signup);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, code: "invalid", message: "Please check the highlighted fields.", errors }, 422);
  }

  if (!isUpdatesConfigured()) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message: "The studio updates mailing list is not connected yet, so your email was not stored.",
      },
      503,
    );
  }

  const result = await deliverUpdatesSignup(signup);
  if (!result.delivered) {
    return json(
      { ok: false, code: "delivery_failed", message: "Could not record your signup right now. Please try again later." },
      502,
    );
  }

  return json({ ok: true }, 200);
}

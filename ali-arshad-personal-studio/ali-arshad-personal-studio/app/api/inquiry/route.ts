import { NextResponse } from "next/server";
import { normaliseInquiry, validateInquiry, type InquiryResponse } from "@/lib/inquiry";
import { deliverInquiry, isDeliveryConfigured } from "@/lib/inquiry-server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2500;

const json = (body: InquiryResponse, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Reject cross-site form posts: the Origin host must match the request host. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; still validated and rate limited
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
      { ok: false, code: "rate_limited", message: "Too many inquiries were sent from this connection. Please wait a few minutes and try again." },
      429,
      { "Retry-After": String(limited.retryAfter) },
    );
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, code: "bad_request", message: "Your message is too long. Please shorten it and try again." }, 413);
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    raw = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: "bad_request", message: "This request could not be read. Please reload the page and try again." }, 400);
  }

  // Spam traps: a filled honeypot, or a form completed faster than a person could.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0;
  if (honeypot !== "" || elapsed < MIN_FILL_MS) {
    return json({ ok: false, code: "bad_request", message: "Your inquiry could not be accepted. Please wait a moment and try again." }, 400);
  }

  const inquiry = normaliseInquiry(raw);
  const errors = validateInquiry(inquiry);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, code: "invalid", message: "Please check the highlighted fields and try again.", errors }, 422);
  }

  // Never claim success without a configured delivery channel.
  if (!isDeliveryConfigured()) {
    return json(
      { ok: false, code: "not_configured", message: "This form is not connected to an inbox yet, so your message was not delivered. Please use another contact method." },
      503,
    );
  }

  const result = await deliverInquiry(inquiry);
  if (result.failures.length > 0) console.error("[inquiry] delivery failure:", result.failures.join("; "));
  if (!result.delivered) {
    return json({ ok: false, code: "delivery_failed", message: "Your inquiry could not be delivered right now. Please try again in a few minutes." }, 502);
  }

  return json({ ok: true }, 200);
}

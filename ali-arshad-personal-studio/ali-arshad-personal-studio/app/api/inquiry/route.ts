import { NextResponse } from "next/server";
import { recordContactInquiry } from "@/lib/admin/db";
import { extractClientIp, isPlausibleFillTime, isSameOrigin } from "@/lib/form-security";
import { normaliseInquiry, validateInquiry, type InquiryResponse } from "@/lib/inquiry";
import { deliverInquiry, deliveryChannels, isDeliveryConfigured } from "@/lib/inquiry-server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2500;

const json = (body: InquiryResponse, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 403);
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 415);
  }

  const limited = rateLimit(`contact-inquiry:${extractClientIp(request)}`);
  if (!limited.allowed) {
    return json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many inquiries were sent from this connection. Please wait a few minutes and try again.",
      },
      429,
      { "Retry-After": String(limited.retryAfter) },
    );
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json(
        { ok: false, code: "bad_request", message: "Your message is too long. Please shorten it and try again." },
        413,
      );
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    raw = parsed as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, code: "bad_request", message: "This request could not be read. Please reload the page and try again." },
      400,
    );
  }

  // Basic spam protection: hidden honeypot field + minimum human fill timing check.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  if (honeypot !== "" || !isPlausibleFillTime(raw.elapsedMs, MIN_FILL_MS)) {
    return json(
      { ok: false, code: "bad_request", message: "Your inquiry could not be accepted. Please wait a moment and try again." },
      400,
    );
  }

  const inquiry = normaliseInquiry(raw);
  const errors = validateInquiry(inquiry);
  if (Object.keys(errors).length > 0) {
    return json(
      { ok: false, code: "invalid", message: "Please check the highlighted fields and try again.", errors },
      422,
    );
  }

  // Never claim success without a configured server-side delivery channel.
  if (!isDeliveryConfigured()) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message:
          "This form is not connected to an inbox yet, so your message was not delivered. Please reach out via Upwork or LinkedIn instead.",
      },
      503,
    );
  }

  const result = await deliverInquiry(inquiry);
  if (result.failures.length > 0) console.error("[inquiry] delivery failure:", result.failures.join("; "));
  if (!result.delivered) {
    return json(
      {
        ok: false,
        code: "delivery_failed",
        message: "Your inquiry could not be delivered right now. Please try again in a few minutes or message me directly on Upwork or LinkedIn.",
      },
      502,
    );
  }

  const ch = deliveryChannels();
  const channelLabel = [ch.email ? "resend" : "", ch.webhook ? "webhook" : ""].filter(Boolean).join("+") || "server";
  await recordContactInquiry(inquiry, channelLabel);

  return json({ ok: true }, 200);
}

import { NextResponse } from "next/server";
import { recordStudioApplication } from "@/lib/admin/db";
import { extractClientIp, isPlausibleFillTime, isSameOrigin } from "@/lib/form-security";
import { rateLimit } from "@/lib/rate-limit";
import {
  normaliseCollaborator,
  validateCollaborator,
  type CollaboratorResponse,
} from "@/lib/studio-network";
import {
  deliverCollaboratorApplication,
  isNetworkDeliveryConfigured,
} from "@/lib/studio-network-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2500;

const json = (body: CollaboratorResponse, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 403);
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ ok: false, code: "bad_request", message: "This request could not be accepted." }, 415);
  }

  const limited = rateLimit(`studio-network:${extractClientIp(request)}`);
  if (!limited.allowed) {
    return json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many submissions from this connection. Please wait a few minutes and try again.",
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
        { ok: false, code: "bad_request", message: "Your submission is too long. Please shorten it and try again." },
        413,
      );
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    raw = parsed as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, code: "bad_request", message: "This request could not be read. Please reload the page and try again." },
      400,
    );
  }

  // Basic spam protection: hidden honeypot field + minimum human fill timing check.
  const honeypot = typeof raw.companyWebsite === "string" ? raw.companyWebsite.trim() : "";
  if (honeypot !== "" || !isPlausibleFillTime(raw.elapsedMs, MIN_FILL_MS)) {
    return json(
      { ok: false, code: "bad_request", message: "Your submission could not be accepted. Please wait a moment and try again." },
      400,
    );
  }

  const application = normaliseCollaborator(raw);
  const errors = validateCollaborator(application);
  if (Object.keys(errors).length > 0) {
    return json(
      { ok: false, code: "invalid", message: "Please check the highlighted fields and try again.", errors },
      422,
    );
  }

  // Never show a fake submitted state when no inbox or webhook destination is configured.
  if (!isNetworkDeliveryConfigured()) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message:
          "The collaborator registration form is not connected to an inbox yet, so your submission was not delivered or stored. Please connect via LinkedIn until server delivery is enabled.",
      },
      503,
    );
  }

  const result = await deliverCollaboratorApplication(application);
  if (result.failures.length > 0) {
    console.error("[studio-network] delivery failure:", result.failures.join("; "));
  }
  if (!result.delivered) {
    return json(
      {
        ok: false,
        code: "delivery_failed",
        message: "Your submission could not be delivered right now. Please try again in a few minutes or connect on LinkedIn.",
      },
      502,
    );
  }

  await recordStudioApplication(application);

  // Submissions remain private by default; moderation & written verification are always required before public globe listing.
  return json({ ok: true, privacyState: "private_pending_review" }, 200);
}

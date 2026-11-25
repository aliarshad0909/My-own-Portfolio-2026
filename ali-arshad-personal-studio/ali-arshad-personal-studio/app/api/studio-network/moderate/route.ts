import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  forwardModerationDecision,
  isModerationConfigured,
  validateModerationAction,
  verifyModerationToken,
} from "@/lib/studio-network-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `studio-network-moderate:${ip}`;
}

export async function POST(request: Request) {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Content-Type must be application/json." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limited = rateLimit(clientKey(request));
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", message: "Too many moderation requests." },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limited.retryAfter) } },
    );
  }

  if (!isModerationConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        message:
          "Studio Network moderation webhook and STUDIO_NETWORK_ADMIN_TOKEN are not configured on this server. Collaborator visibility stays private.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!verifyModerationToken(request.headers.get("authorization"))) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Invalid or missing moderation authorization." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let raw: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("invalid");
    raw = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid JSON payload." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validated = validateModerationAction(raw);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid", message: validated.error },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const ok = await forwardModerationDecision(validated.data);
  if (!ok) {
    return NextResponse.json(
      { ok: false, code: "delivery_failed", message: "Moderation webhook could not record the decision." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, action: validated.data.action, collaboratorId: validated.data.collaboratorId },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";

/**
 * Defense-in-depth CSRF origin validation for cookie-authenticated web mutations.
 * Skipped when `Authorization: Bearer` is supplied (native/web mobile client)
 * or when no Origin header is sent.
 */
export function verifyCsrfOrigin(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) return null;

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const allowed = new Set<string>();
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (appUrl) allowed.add(appUrl);

  const extra = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  for (const item of extra) allowed.add(item);

  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  if (!allowed.has(normalizedOrigin)) {
    return NextResponse.json(
      { error: "Cross-origin cookie mutation rejected." },
      { status: 403 },
    );
  }
  return null;
}


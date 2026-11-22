import { NextResponse } from "next/server";

/**
 * Defense-in-depth CSRF origin validation for cookie-authenticated web mutations.
 */
export function verifyCsrfOrigin(request: Request): NextResponse | null {
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

  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  if (!allowed.has(normalizedOrigin)) {
    return NextResponse.json(
      { error: "Cross-origin mutation rejected." },
      { status: 403 },
    );
  }
  return null;
}

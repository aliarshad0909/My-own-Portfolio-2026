import { NextResponse } from "next/server";

/**
 * Defense-in-depth CSRF origin check for cookie-authenticated state mutations.
 * Allows requests with no Origin header (non-browser CLI/tests) and rejects
 * cross-origin browser requests.
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

/**
 * Neutralizes spreadsheet formula injection (CSV Injection) when exporting CSV cells.
 */
export function neutralizeCsvFormula(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

export function slugifyName(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "custom-dataset";
}

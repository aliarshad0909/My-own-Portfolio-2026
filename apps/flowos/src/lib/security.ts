import { NextResponse } from "next/server";

/**
 * Defense-in-depth CSRF origin validation for cookie-authenticated mutations.
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
      { error: "Cross-origin cookie mutation rejected." },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Validates that an external webhook/HTTP URL is syntactically valid and not targeting
 * link-local metadata or loopback ranges unless explicitly allowed in sandbox mode.
 */
export function validateSafeExternalUrl(rawUrl: string): { valid: boolean; reason?: string; normalized?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, reason: "Only http:// and https:// protocols are permitted." };
  }

  const host = parsed.hostname.toLowerCase();
  const blockedHosts = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",
    "metadata.google.internal",
  ]);
  if (
    blockedHosts.has(host) ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local")
  ) {
    return {
      valid: false,
      reason: "Private network, loopback, and cloud metadata hosts are blocked for security.",
    };
  }

  return { valid: true, normalized: parsed.toString() };
}

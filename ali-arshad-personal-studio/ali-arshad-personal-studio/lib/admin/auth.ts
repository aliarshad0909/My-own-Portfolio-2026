/**
 * Next.js server-only admin session guards & response helpers.
 * Re-exports pure crypto/session helpers from `lib/admin/auth-core.ts`.
 * Never import this file from client components.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/form-security";
import type { AdminSessionPublic } from "@/lib/admin/types";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthConfigured,
  isDemoModeEnabled,
  parseCookieFromHeader,
  verifyCsrfToken,
  verifySessionToken,
  type AdminSessionPayload,
} from "@/lib/admin/auth-core";

export * from "@/lib/admin/auth-core";

/** Read & verify the current admin session from Next.js cookies (returns null if unauthenticated). */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Server-component guard: redirects unauthenticated visitors straight to /admin/login. */
export async function requireAdminPage(): Promise<AdminSessionPublic> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return {
    email: session.sub,
    csrfToken: session.csrf,
    expiresAt: new Date(session.exp * 1000).toISOString(),
    demoMode: isDemoModeEnabled(),
  };
}

/**
 * Mandatory API guard for every `/api/admin/*` route (except `/api/admin/auth/login`).
 * Checks valid HTTP-only session cookie, same-origin on mutations, and `x-csrf-token` on mutations.
 */
export function requireAdminApi(
  request: Request,
  options: { requireCsrf?: boolean } = {},
): { ok: true; session: AdminSessionPayload } | { ok: false; response: NextResponse } {
  const headers = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow, noarchive" };

  if (!isAdminAuthConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          code: "auth_not_configured",
          message: "Admin authentication is not configured on this server.",
        },
        { status: 503, headers },
      ),
    };
  }

  const token = parseCookieFromHeader(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  const session = verifySessionToken(token);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, code: "unauthorized", message: "Authentication required. Please sign in again." },
        { status: 401, headers },
      ),
    };
  }

  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());
  const enforceCsrf = options.requireCsrf ?? isMutation;
  if (enforceCsrf) {
    if (!isSameOrigin(request)) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, code: "forbidden", message: "Cross-origin admin request rejected." },
          { status: 403, headers },
        ),
      };
    }
    if (!verifyCsrfToken(session, request.headers.get("x-csrf-token"))) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, code: "csrf_invalid", message: "Invalid or missing CSRF token. Reload and try again." },
          { status: 403, headers },
        ),
      };
    }
  }

  return { ok: true, session };
}

export function adminJson(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...extraHeaders,
    },
  });
}

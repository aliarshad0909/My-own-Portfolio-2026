import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminJson, requireAdminApi, shouldUseSecureCookie } from "@/lib/admin/auth";
import { buildGmailAuthUrl, isGmailOAuthConfigured } from "@/lib/admin/adapters/gmail";
import { isDatabaseConfigured } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GMAIL_OAUTH_STATE_COOKIE = "ali_studio_gmail_oauth_state";

export async function GET(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: false });
  if (!auth.ok) return auth.response;

  if (!isGmailOAuthConfigured()) {
    return adminJson(
      {
        ok: false,
        code: "not_configured",
        message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set before connecting Gmail.",
      },
      503,
    );
  }
  if (!isDatabaseConfigured()) {
    return adminJson(
      {
        ok: false,
        code: "database_not_configured",
        message: "Neon PostgreSQL (DATABASE_URL) must be configured before connecting Gmail so encrypted tokens can be stored.",
      },
      503,
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const origin = new URL(request.url).origin;
  const authUrl = buildGmailAuthUrl(state, origin);

  const res = NextResponse.redirect(authUrl, 302);
  res.headers.set("Cache-Control", "no-store, private");
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.cookies.set({
    name: GMAIL_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/api/admin/gmail/callback",
    maxAge: 600,
  });
  return res;
}

import { NextResponse } from "next/server";
import { parseCookieFromHeader, requireAdminApi, shouldUseSecureCookie, timingSafeStringEqual } from "@/lib/admin/auth";
import { exchangeGmailCode } from "@/lib/admin/adapters/gmail";
import { recordAdminAudit } from "@/lib/admin/db";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/app/api/admin/gmail/connect/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithStatus(request: Request, query: string) {
  const url = new URL(`/admin/integrations?${query}`, request.url);
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "no-store, private");
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.cookies.set({
    name: GMAIL_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/api/admin/gmail/callback",
    maxAge: 0,
  });
  return res;
}

export async function GET(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: false });
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 302);
  }

  const reqUrl = new URL(request.url);
  const oauthError = reqUrl.searchParams.get("error");
  if (oauthError) {
    await recordAdminAudit(auth.session.sub, "gmail.oauth.denied", oauthError.slice(0, 60), "error");
    return redirectWithStatus(request, "gmail=cancelled");
  }

  const code = reqUrl.searchParams.get("code") ?? "";
  const state = reqUrl.searchParams.get("state") ?? "";
  const cookieState = parseCookieFromHeader(request.headers.get("cookie"), GMAIL_OAUTH_STATE_COOKIE) ?? "";

  if (!code || !state || !cookieState || !timingSafeStringEqual(state, cookieState)) {
    await recordAdminAudit(auth.session.sub, "gmail.oauth.state_invalid", "csrf_mismatch", "error");
    return redirectWithStatus(request, "gmail=state_error");
  }

  const exchanged = await exchangeGmailCode(code, reqUrl.origin);
  if (!exchanged.ok) {
    await recordAdminAudit(auth.session.sub, "gmail.oauth.exchange_failed", "token_error", "error");
    return redirectWithStatus(request, "gmail=exchange_error");
  }

  await recordAdminAudit(auth.session.sub, "gmail.oauth.connected", exchanged.accountEmail, "ok");
  return redirectWithStatus(request, "gmail=connected");
}

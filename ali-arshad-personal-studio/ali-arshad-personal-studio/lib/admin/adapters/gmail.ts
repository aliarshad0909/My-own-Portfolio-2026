/**
 * Server-only official Google OAuth 2.0 + Gmail API (readonly metadata) adapter.
 * Requests least-privilege `gmail.readonly` + `openid email` scopes, encrypts OAuth
 * tokens at rest in Neon PostgreSQL via AES-256-GCM, and never logs message bodies or tokens.
 */
import { envVar } from "@/lib/form-security";
import { deleteGmailTokens, isDatabaseConfigured, loadGmailTokens, saveGmailTokens } from "@/lib/admin/db";
import type { GmailMessageSummary, ServiceHealthState } from "@/lib/admin/types";
import { siteBaseUrl } from "@/lib/site";

export const GMAIL_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
].join(" ");

export function isGmailOAuthConfigured(): boolean {
  return envVar("GOOGLE_CLIENT_ID") !== "" && envVar("GOOGLE_CLIENT_SECRET") !== "";
}

export function resolveGmailRedirectUri(requestOrigin?: string): string {
  const explicit = envVar("GOOGLE_REDIRECT_URI");
  if (explicit) return explicit;
  const origin = requestOrigin || siteBaseUrl().origin;
  return `${origin.replace(/\/$/, "")}/api/admin/gmail/callback`;
}

export function buildGmailAuthUrl(state: string, requestOrigin?: string): string {
  const params = new URLSearchParams({
    client_id: envVar("GOOGLE_CLIENT_ID"),
    redirect_uri: resolveGmailRedirectUri(requestOrigin),
    response_type: "code",
    scope: GMAIL_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(
  code: string,
  requestOrigin?: string,
): Promise<{ ok: true; accountEmail: string } | { ok: false; detail: string }> {
  if (!isGmailOAuthConfigured()) {
    return { ok: false, detail: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, detail: "Neon PostgreSQL (DATABASE_URL) is required to store encrypted Gmail OAuth tokens." };
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: envVar("GOOGLE_CLIENT_ID"),
        client_secret: envVar("GOOGLE_CLIENT_SECRET"),
        redirect_uri: resolveGmailRedirectUri(requestOrigin),
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return { ok: false, detail: `Google token exchange failed (HTTP ${tokenRes.status}).` };
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!tokenJson.access_token) {
      return { ok: false, detail: "Google OAuth response did not include an access token." };
    }

    const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!profileRes.ok) {
      return { ok: false, detail: `Connected to Google, but Gmail profile lookup failed (HTTP ${profileRes.status}).` };
    }
    const profile = (await profileRes.json()) as { emailAddress?: string };
    const accountEmail = profile.emailAddress ?? "Connected Gmail Account";

    await saveGmailTokens({
      accountEmail,
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token ?? "",
      expiresAt: Date.now() + Math.max(300, Number(tokenJson.expires_in ?? 3600)) * 1000,
      scope: tokenJson.scope ?? GMAIL_OAUTH_SCOPES,
    });

    return { ok: true, accountEmail };
  } catch {
    return { ok: false, detail: "Network error while completing Google OAuth handshake." };
  }
}

async function getValidGmailAccessToken(): Promise<
  { ok: true; accessToken: string; accountEmail: string } | { ok: false; state: ServiceHealthState; detail: string }
> {
  if (!isGmailOAuthConfigured()) {
    return {
      ok: false,
      state: "needs_setup",
      detail: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (and Neon DATABASE_URL), then click Connect Gmail.",
    };
  }
  const stored = await loadGmailTokens();
  if (!stored) {
    return {
      ok: false,
      state: "needs_setup",
      detail: "Google OAuth credentials are configured. Use Connect Gmail in Integrations to authorize readonly inbox access.",
    };
  }

  if (Date.now() < stored.expiresAt - 60_000) {
    return { ok: true, accessToken: stored.accessToken, accountEmail: stored.accountEmail };
  }

  if (!stored.refreshToken) {
    return {
      ok: false,
      state: "error",
      detail: "Gmail access token expired and no refresh token is stored. Reconnect Gmail in Integrations.",
    };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: envVar("GOOGLE_CLIENT_ID"),
        client_secret: envVar("GOOGLE_CLIENT_SECRET"),
        refresh_token: stored.refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        ok: false,
        state: "error",
        detail: `Gmail token refresh rejected (HTTP ${res.status}). Reconnect Gmail in Integrations.`,
      };
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) {
      return { ok: false, state: "error", detail: "Google did not return a refreshed access token." };
    }
    await saveGmailTokens({
      ...stored,
      accessToken: json.access_token,
      expiresAt: Date.now() + Math.max(300, Number(json.expires_in ?? 3600)) * 1000,
    });
    return { ok: true, accessToken: json.access_token, accountEmail: stored.accountEmail };
  } catch {
    return { ok: false, state: "offline", detail: "Could not reach Google OAuth token refresh endpoint." };
  }
}

export async function checkGmailStatus(): Promise<{
  state: ServiceHealthState;
  detail: string;
  accountEmail?: string;
}> {
  const tokenRes = await getValidGmailAccessToken();
  if (!tokenRes.ok) return { state: tokenRes.state, detail: tokenRes.detail };
  return {
    state: "connected",
    detail: `Connected to ${tokenRes.accountEmail} (read-only metadata scope).`,
    accountEmail: tokenRes.accountEmail,
  };
}

export async function listRecentGmailMessages(limit = 10): Promise<
  | { ok: true; accountEmail: string; messages: GmailMessageSummary[] }
  | { ok: false; state: ServiceHealthState; detail: string }
> {
  const tokenRes = await getValidGmailAccessToken();
  if (!tokenRes.ok) return tokenRes;

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${Math.min(limit, 20)}&q=in:inbox`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!listRes.ok) {
      return {
        ok: false,
        state: "error",
        detail: `Gmail inbox listing failed (HTTP ${listRes.status}).`,
      };
    }
    const listJson = (await listRes.json()) as { messages?: Array<{ id: string; threadId: string }> };
    const refs = listJson.messages ?? [];
    if (refs.length === 0) {
      return { ok: true, accountEmail: tokenRes.accountEmail, messages: [] };
    }

    const details = await Promise.all(
      refs.slice(0, limit).map(async (ref) => {
        const msgUrl =
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}` +
          "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
        const r = await fetch(msgUrl, {
          headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
          signal: AbortSignal.timeout(6000),
          cache: "no-store",
        });
        if (!r.ok) return null;
        const m = (await r.json()) as {
          id: string;
          threadId: string;
          snippet?: string;
          labelIds?: string[];
          payload?: { headers?: Array<{ name: string; value: string }> };
        };
        const headers = m.payload?.headers ?? [];
        const pick = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
        return {
          id: m.id,
          threadId: m.threadId,
          from: pick("From") || "Unknown sender",
          subject: pick("Subject") || "(No subject)",
          date: pick("Date") || "",
          snippet: (m.snippet ?? "").slice(0, 180),
          labels: m.labelIds ?? [],
          gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(m.threadId)}`,
        } satisfies GmailMessageSummary;
      }),
    );

    return {
      ok: true,
      accountEmail: tokenRes.accountEmail,
      messages: details.filter((m): m is GmailMessageSummary => m !== null),
    };
  } catch {
    return { ok: false, state: "offline", detail: "Could not reach the Gmail API." };
  }
}

export async function disconnectGmailAccount(): Promise<void> {
  await deleteGmailTokens();
}

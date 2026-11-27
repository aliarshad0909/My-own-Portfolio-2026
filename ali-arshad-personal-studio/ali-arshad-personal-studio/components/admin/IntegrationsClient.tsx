"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { StatusBadge } from "@/components/admin/AdminUi";
import type { AdminPreferences, IntegrationStatusSummary, PlatformAccountCard } from "@/lib/admin/types";

type IntegrationsPayload = {
  ok: boolean;
  demoMode: boolean;
  integrations: IntegrationStatusSummary[];
  platforms: PlatformAccountCard[];
  gmail: {
    oauthConfigured: boolean;
    databaseReady: boolean;
    connectedEmail: string | null;
  };
  safetyGuards: {
    listmonkLiveSendAllowed: boolean;
    postizLivePublishAllowed: boolean;
  };
  preferences: AdminPreferences;
};

export function IntegrationsClient({ gmailNotice }: { gmailNotice?: string }) {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<IntegrationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(() => {
    if (gmailNotice === "connected") return { kind: "ok", text: "Gmail connected via official Google OAuth (tokens encrypted in Neon)." };
    if (gmailNotice === "cancelled") return { kind: "warn", text: "Google OAuth consent was cancelled." };
    if (gmailNotice === "state_error") return { kind: "error", text: "OAuth CSRF state validation failed. Try connecting again." };
    if (gmailNotice === "exchange_error") return { kind: "error", text: "Could not complete Google OAuth token exchange. Check redirect URI & credentials." };
    return null;
  });

  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [defaultListmonkTimezone, setDefaultListmonkTimezone] = useState("America/New_York");
  const [compactMode, setCompactMode] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/integrations");
      const json = (await res.json()) as IntegrationsPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not run integration health checks." });
      } else {
        setData(json);
        setTimezone(json.preferences.timezone);
        setDefaultListmonkTimezone(json.preferences.defaultListmonkTimezone);
        setCompactMode(json.preferences.compactMode);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error checking integrations." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePreferences(e: FormEvent) {
    e.preventDefault();
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/preferences", {
        method: "PUT",
        body: JSON.stringify({ timezone, defaultListmonkTimezone, compactMode }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not save preferences." });
      } else {
        setFeedback({ kind: "ok", text: "Studio preferences saved to Neon PostgreSQL." });
        await load();
      }
    } finally {
      setSavingPrefs(false);
    }
  }

  async function disconnectGmail() {
    setDisconnectingGmail(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/gmail/disconnect", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Failed to disconnect Gmail." });
      } else {
        setFeedback({ kind: "ok", text: "Gmail OAuth tokens deleted from Neon." });
        await load();
      }
    } finally {
      setDisconnectingGmail(false);
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Integrations, Health & Settings</h1>
          <p className="adm-page-lead">
            Verify live connections across Neon, Upstash, Resend, Listmonk, Postiz, Twenty CRM, Gmail OAuth, and GitHub.
            Secret values are strictly server-only and never displayed here.
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" onClick={load} disabled={loading}>
          {loading ? "Testing Connections…" : "Run Live Health Checks"}
        </button>
      </div>

      {feedback && (
        <div
          className={`adm-alert ${
            feedback.kind === "ok"
              ? "adm-alert--ok"
              : feedback.kind === "warn"
                ? "adm-alert--warn"
                : "adm-alert--error"
          }`}
          role="alert"
        >
          {feedback.text}
        </div>
      )}

      <section className="adm-card" aria-label="Service health checks">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Live Infrastructure & External Service Status</h2>
            <p className="adm-card-sub">See `docs/ADMIN_CONSOLE_SETUP.md` for step-by-step setup and secret rotation.</p>
          </div>
        </div>
        <div className="adm-grid-2">
          {(data?.integrations ?? []).map((svc) => (
            <article key={svc.id} className="adm-item">
              <div className="adm-item-row">
                <strong>{svc.name}</strong>
                <StatusBadge state={svc.state} />
              </div>
              <p className="adm-card-sub" style={{ margin: 0 }}>
                {svc.detail}
              </p>
              <div className="adm-hint">
                Category: {svc.category}
                {svc.baseUrlHost ? ` · Host: ${svc.baseUrlHost}` : ""} · Checked:{" "}
                {new Date(svc.checkedAt).toLocaleTimeString()}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Gmail OAuth 2.0 Connection</h2>
              <p className="adm-card-sub">
                Official Google OAuth using least-privilege <code className="adm-code">gmail.readonly</code> scope.
              </p>
            </div>
          </div>

          {data?.gmail.connectedEmail ? (
            <div className="adm-list">
              <div className="adm-alert adm-alert--ok">
                Connected account: <strong>{data.gmail.connectedEmail}</strong> (encrypted at rest via AES-256-GCM).
              </div>
              <div>
                <button
                  type="button"
                  className="adm-btn adm-btn--danger adm-btn--sm"
                  onClick={disconnectGmail}
                  disabled={disconnectingGmail}
                >
                  {disconnectingGmail ? "Disconnecting…" : "Disconnect Gmail & Delete Tokens"}
                </button>
              </div>
            </div>
          ) : (
            <div className="adm-list">
              <p className="adm-card-sub" style={{ margin: 0 }}>
                {data?.gmail.oauthConfigured && data?.gmail.databaseReady
                  ? "Google OAuth credentials and Neon PostgreSQL are ready. Authorize read-only inbox preview below."
                  : "Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and Neon DATABASE_URL configured on the server."}
              </p>
              <div>
                <a
                  href="/api/admin/gmail/connect"
                  className="adm-btn adm-btn--primary adm-btn--sm"
                  aria-disabled={!data?.gmail.oauthConfigured || !data?.gmail.databaseReady}
                  onClick={(e) => {
                    if (!data?.gmail.oauthConfigured || !data?.gmail.databaseReady) {
                      e.preventDefault();
                      setFeedback({
                        kind: "warn",
                        text: "Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and Neon DATABASE_URL before connecting Gmail.",
                      });
                    }
                  }}
                >
                  Connect Gmail via Google OAuth
                </a>
              </div>
            </div>
          )}

          <div className="adm-item" style={{ marginTop: "1rem" }}>
            <strong>Outbound Safety Locks</strong>
            <div className="adm-hint">
              Listmonk Live Send (<code className="adm-code">LISTMONK_ALLOW_LIVE_SEND</code>):{" "}
              <strong>{data?.safetyGuards.listmonkLiveSendAllowed ? "Enabled (confirmation required)" : "Locked (Draft-only)"}</strong>
            </div>
            <div className="adm-hint">
              Postiz Live Publish (<code className="adm-code">POSTIZ_ALLOW_LIVE_PUBLISH</code>):{" "}
              <strong>{data?.safetyGuards.postizLivePublishAllowed ? "Enabled (confirmation required)" : "Locked (Draft-only)"}</strong>
            </div>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Console Timezone & Preferences</h2>
              <p className="adm-card-sub">Saved privately in Neon (`admin_preferences`).</p>
            </div>
          </div>
          <form className="adm-form" onSubmit={savePreferences}>
            <div className="adm-field">
              <label htmlFor="pref-tz" className="adm-label">
                Studio Display Timezone (IANA)
              </label>
              <input
                id="pref-tz"
                className="adm-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Karachi"
              />
            </div>
            <div className="adm-field">
              <label htmlFor="pref-lm-tz" className="adm-label">
                Default Campaign Scheduling Timezone
              </label>
              <input
                id="pref-lm-tz"
                className="adm-input"
                value={defaultListmonkTimezone}
                onChange={(e) => setDefaultListmonkTimezone(e.target.value)}
                placeholder="America/New_York"
              />
            </div>
            <label className="adm-check-row">
              <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
              <span>Prefer compact table density</span>
            </label>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={!data?.gmail.databaseReady || savingPrefs}>
              {savingPrefs ? "Saving…" : "Save Preferences"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

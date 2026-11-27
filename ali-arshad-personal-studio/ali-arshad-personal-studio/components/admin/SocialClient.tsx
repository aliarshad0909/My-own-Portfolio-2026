"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, OutboundConfirmModal, StatusBadge } from "@/components/admin/AdminUi";
import type { PlatformAccountCard, PostizChannel, PostizPost, ServiceHealthState } from "@/lib/admin/types";

type SocialPayload = {
  ok: boolean;
  demoMode: boolean;
  status: { state: ServiceHealthState; detail: string; baseUrlHost?: string };
  livePublishAllowed: boolean;
  confirmPhrase: string;
  channels: PostizChannel[];
  posts: PostizPost[];
  platforms: PlatformAccountCard[];
  isDemo: boolean;
};

export function SocialClient() {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<SocialPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [content, setContent] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"draft" | "schedule" | "now">("draft");
  const [publishDate, setPublishDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/social");
      const json = (await res.json()) as SocialPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not load social workspace." });
      } else {
        setData(json);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error reaching social API." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleChannel(id: string) {
    setSelectedChannelIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const chosenChannels = (data?.channels ?? [])
    .filter((ch) => selectedChannelIds.includes(ch.id))
    .map((ch) => ({ id: ch.id, provider: ch.provider, name: ch.name }));

  async function submitPost(confirmPhrase?: string) {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/social", {
        method: "POST",
        body: JSON.stringify({
          mode,
          content,
          publishDate: mode === "schedule" ? publishDate : undefined,
          channels: chosenChannels.map(({ id, provider }) => ({ id, provider })),
          confirmOutbound: mode !== "draft",
          confirmationPhrase: confirmPhrase ?? "",
          idempotencyKey: `social-${mode}-${Date.now()}`,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not save or publish post." });
      } else {
        setFeedback({
          kind: "ok",
          text:
            mode === "draft"
              ? "Social draft saved in Postiz."
              : mode === "schedule"
                ? "Post scheduled via Postiz."
                : "Post dispatched via Postiz.",
        });
        setConfirmOpen(false);
        setContent("");
        setSelectedChannelIds([]);
        setPublishDate("");
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "draft") {
      void submitPost();
    } else {
      setConfirmOpen(true);
    }
  }

  const connected = data?.status.state === "connected";

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Social Publishing & Platform Hub</h1>
          <p className="adm-page-lead">
            Draft and schedule official API posts via self-hosted Postiz, with honest native-app shortcuts for actions
            outside platform APIs.
          </p>
        </div>
        <div className="adm-topbar-actions">
          {data?.isDemo && <DemoBadge />}
          {data && <StatusBadge state={data.status.state} />}
          <button type="button" className="adm-btn adm-btn--sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {data && (
        <div className="adm-alert" role="status">
          <strong>Postiz Status:</strong> {data.status.detail}
        </div>
      )}

      {feedback && (
        <div className={`adm-alert ${feedback.kind === "ok" ? "adm-alert--ok" : "adm-alert--error"}`} role="alert">
          {feedback.text}
        </div>
      )}

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Post Composer (Postiz)</h2>
              <p className="adm-card-sub">Create drafts freely; scheduling or publishing requires explicit review.</p>
            </div>
          </div>

          <form className="adm-form" onSubmit={handleFormSubmit}>
            <div className="adm-field">
              <span className="adm-label">Target Connected Channels</span>
              {!data || data.channels.length === 0 ? (
                <p className="adm-hint" style={{ margin: 0 }}>
                  Connect self-hosted Postiz to load your LinkedIn, Instagram Business, or Facebook Page channels.
                </p>
              ) : (
                <div className="adm-list">
                  {data.channels.map((ch) => (
                    <label key={ch.id} className="adm-check-row">
                      <input
                        type="checkbox"
                        checked={selectedChannelIds.includes(ch.id)}
                        disabled={Boolean(ch.isDemo)}
                        onChange={() => toggleChannel(ch.id)}
                      />
                      <span>
                        {ch.name} <span className="adm-hint">({ch.provider})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-field">
              <label htmlFor="pz-mode" className="adm-label">
                Publishing Mode
              </label>
              <select
                id="pz-mode"
                className="adm-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as "draft" | "schedule" | "now")}
              >
                <option value="draft">Save as Draft (Safe)</option>
                <option value="schedule">Schedule for Later (Requires Final Confirmation)</option>
                <option value="now">Publish Now (Requires Final Confirmation)</option>
              </select>
            </div>

            {mode === "schedule" && (
              <div className="adm-field">
                <label htmlFor="pz-date" className="adm-label">
                  Scheduled Date & Time
                </label>
                <input
                  id="pz-date"
                  type="datetime-local"
                  className="adm-input"
                  required
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            )}

            <div className="adm-field">
              <label htmlFor="pz-content" className="adm-label">
                Post Copy ({content.length} chars)
              </label>
              <textarea
                id="pz-content"
                className="adm-textarea"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your LinkedIn / Instagram / Facebook Page update…"
              />
            </div>

            <button
              type="submit"
              className="adm-btn adm-btn--primary"
              disabled={!connected || submitting || chosenChannels.length === 0}
            >
              {mode === "draft"
                ? submitting
                  ? "Saving Draft…"
                  : "Save Postiz Draft"
                : "Review & Confirm Outbound Post"}
            </button>
          </form>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Scheduled & Recent Posts</h2>
              <p className="adm-card-sub">Upcoming queue and drafts retrieved from Postiz</p>
            </div>
          </div>

          {!data || data.posts.length === 0 ? (
            <EmptyConnectState
              title="No Postiz posts loaded"
              detail="Configure POSTIZ_URL and POSTIZ_API_KEY to view drafts, scheduled posts, and published links."
            />
          ) : (
            <div className="adm-list">
              {data.posts.map((post) => (
                <article key={post.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>
                      {post.channelName} ({post.provider})
                    </strong>
                    <div className="adm-topbar-actions">
                      {post.isDemo && <DemoBadge />}
                      <span className="adm-badge adm-badge--neutral">{post.state}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem" }}>{post.content}</p>
                  <div className="adm-hint">
                    {post.publishDate ? `Scheduled: ${new Date(post.publishDate).toLocaleString()}` : "Unscheduled draft"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="adm-card" aria-label="Platform connections and official API boundaries">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Connected Accounts & Official Platform Boundaries</h2>
            <p className="adm-card-sub">
              Direct shortcuts for native-only actions (DMs, Upwork proposals, follow/unfollow). No scraping or stored
              social passwords.
            </p>
          </div>
        </div>
        <div className="adm-grid-2">
          {(data?.platforms ?? []).map((p) => (
            <article key={p.id} className="adm-item">
              <div className="adm-item-row">
                <strong>{p.name}</strong>
                <StatusBadge state={p.connectionState} />
              </div>
              <p className="adm-card-sub" style={{ margin: 0 }}>
                {p.connectionNote}
              </p>
              <div className="adm-hint">
                <strong>Native-only (not automated):</strong> {p.nativeOnlyActions.join(" · ")}
              </div>
              <div className="adm-topbar-actions" style={{ flexWrap: "wrap", marginTop: "0.25rem" }}>
                {p.nativeActionLinks.map((lnk) => (
                  <a
                    key={lnk.href}
                    href={lnk.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                  >
                    {lnk.label} ↗
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <OutboundConfirmModal
        open={confirmOpen}
        title={mode === "now" ? "Final Review: Publish Social Post Now" : "Final Review: Schedule Social Post"}
        confirmPhrase={data?.confirmPhrase ?? "CONFIRM PUBLISH"}
        liveAllowed={Boolean(data?.livePublishAllowed)}
        liveLockNote="Live social publishing is locked on this server (POSTIZ_ALLOW_LIVE_PUBLISH is not set to true). You can still save drafts safely, or set POSTIZ_ALLOW_LIVE_PUBLISH=true in Vercel Production when ready."
        submitting={submitting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(phrase) => void submitPost(phrase)}
        summary={
          <>
            <div>
              <strong>Channels:</strong> {chosenChannels.map((c) => `${c.name} (${c.provider})`).join(", ")}
            </div>
            <div>
              <strong>Mode:</strong> {mode === "schedule" ? `Scheduled for ${publishDate}` : "Immediate publish"}
            </div>
            <div>
              <strong>Preview:</strong> {content.slice(0, 260)}
              {content.length > 260 ? "…" : ""}
            </div>
          </>
        }
      />
    </>
  );
}

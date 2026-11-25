"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, OutboundConfirmModal, StatusBadge } from "@/components/admin/AdminUi";
import type { ListmonkCampaign, ListmonkList, ServiceHealthState } from "@/lib/admin/types";

type CampaignsPayload = {
  ok: boolean;
  demoMode: boolean;
  status: { state: ServiceHealthState; detail: string; baseUrlHost?: string };
  liveSendAllowed: boolean;
  confirmPhrase: string;
  defaultTimezone: string;
  lists: ListmonkList[];
  campaigns: ListmonkCampaign[];
  isDemo: boolean;
};

export function CampaignsClient() {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<CampaignsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // Composer state (create or edit draft)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [sendAt, setSendAt] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Final-review modal for scheduling / sending
  const [dispatchTarget, setDispatchTarget] = useState<{
    campaign: ListmonkCampaign;
    targetStatus: "scheduled" | "running";
  } | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/campaigns");
      const json = (await res.json()) as CampaignsPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not load Listmonk data." });
      } else {
        setData(json);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error reaching campaigns API." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleList(id: number) {
    setSelectedLists((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function loadDraftIntoEditor(c: ListmonkCampaign) {
    setEditingId(c.id);
    setName(c.name);
    setSubject(c.subject);
    setBody(c.body ?? "");
    setSelectedLists(c.lists.map((l) => l.id));
    setSendAt(c.sendAt ? c.sendAt.slice(0, 16) : "");
    setFeedback(null);
  }

  async function saveDraft(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSavingDraft(true);
    try {
      const res = await adminFetch("/api/admin/campaigns", {
        method: "POST",
        body: JSON.stringify({
          action: editingId ? "update_draft" : "create_draft",
          campaignId: editingId ?? undefined,
          name,
          subject,
          body,
          listIds: selectedLists,
          sendAt: sendAt ? new Date(sendAt).toISOString() : null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; campaignId?: number };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not save draft." });
      } else {
        setFeedback({
          kind: "ok",
          text: editingId
            ? `Campaign draft #${editingId} updated safely in Listmonk.`
            : `Campaign draft #${json.campaignId} created safely (status: draft).`,
        });
        setEditingId(null);
        setName("");
        setSubject("");
        setBody("");
        setSelectedLists([]);
        setSendAt("");
        await load();
      }
    } finally {
      setSavingDraft(false);
    }
  }

  async function executeDispatch(phrase: string) {
    if (!dispatchTarget) return;
    setDispatching(true);
    setFeedback(null);
    try {
      const idempotencyKey = `${dispatchTarget.campaign.id}-${dispatchTarget.targetStatus}-${Date.now()}`;
      const res = await adminFetch("/api/admin/campaigns", {
        method: "POST",
        body: JSON.stringify({
          action: "dispatch",
          campaignId: dispatchTarget.campaign.id,
          targetStatus: dispatchTarget.targetStatus,
          confirmOutbound: true,
          confirmationPhrase: phrase,
          idempotencyKey,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Dispatch blocked." });
      } else {
        setFeedback({
          kind: "ok",
          text: `Campaign #${dispatchTarget.campaign.id} moved to "${dispatchTarget.targetStatus}".`,
        });
        setDispatchTarget(null);
        await load();
      }
    } finally {
      setDispatching(false);
    }
  }

  const connected = data?.status.state === "connected";

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Email Campaigns (Listmonk)</h1>
          <p className="adm-page-lead">
            Manage subscriber lists, compose and review drafts, and schedule or start campaigns through your self-hosted
            Listmonk server.
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
          <strong>Connection:</strong> {data.status.detail} · Scheduling timezone display:{" "}
          <code className="adm-code">{data.defaultTimezone}</code>
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
              <h2 className="adm-card-title">{editingId ? `Edit Draft #${editingId}` : "Create Campaign Draft"}</h2>
              <p className="adm-card-sub">All new campaigns save as drafts first — nothing sends until explicitly confirmed.</p>
            </div>
            {editingId && (
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setSubject("");
                  setBody("");
                  setSelectedLists([]);
                  setSendAt("");
                }}
              >
                New Draft
              </button>
            )}
          </div>

          <form className="adm-form" onSubmit={saveDraft}>
            <div className="adm-field">
              <label htmlFor="lm-name" className="adm-label">
                Campaign Name (Internal)
              </label>
              <input
                id="lm-name"
                className="adm-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Studio Engineering Dispatch — Q4"
              />
            </div>

            <div className="adm-field">
              <label htmlFor="lm-subject" className="adm-label">
                Email Subject Line
              </label>
              <input
                id="lm-subject"
                className="adm-input"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How we harden n8n workflows and Next.js operations tools"
              />
            </div>

            <div className="adm-field">
              <span className="adm-label">Target Subscriber Lists</span>
              {!data || data.lists.length === 0 ? (
                <p className="adm-hint" style={{ margin: 0 }}>
                  Connect Listmonk to load real subscriber lists.
                </p>
              ) : (
                <div className="adm-list">
                  {data.lists.map((l) => (
                    <label key={l.id} className="adm-check-row">
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(l.id)}
                        onChange={() => toggleList(l.id)}
                      />
                      <span>
                        {l.name} <span className="adm-hint">({l.subscriberCount} subscribers · {l.type})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-field">
              <label htmlFor="lm-sendat" className="adm-label">
                Optional Scheduled Send Time (Local Browser Time)
              </label>
              <input
                id="lm-sendat"
                type="datetime-local"
                className="adm-input"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
              />
            </div>

            <div className="adm-field">
              <label htmlFor="lm-body" className="adm-label">
                Message Content (HTML or Rich Text)
              </label>
              <textarea
                id="lm-body"
                className="adm-textarea"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Hi there — sharing a quick build note from Ali Arshad Studio…</p>"
              />
            </div>

            <button type="submit" className="adm-btn adm-btn--primary" disabled={!connected || savingDraft}>
              {savingDraft ? "Saving Draft…" : editingId ? "Update Listmonk Draft" : "Save Draft to Listmonk"}
            </button>
            {!connected && (
              <p className="adm-hint" style={{ margin: 0 }}>
                Connect self-hosted Listmonk (<code className="adm-code">LISTMONK_URL</code>,{" "}
                <code className="adm-code">LISTMONK_API_USER</code>, <code className="adm-code">LISTMONK_API_TOKEN</code>) to
                save drafts.
              </p>
            )}
          </form>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Campaign Queue & History</h2>
              <p className="adm-card-sub">Review drafts or trigger explicit confirmation before any live send.</p>
            </div>
          </div>

          {!data || data.campaigns.length === 0 ? (
            <EmptyConnectState
              title="No Listmonk campaigns loaded"
              detail="Point LISTMONK_URL and API credentials to your self-hosted Listmonk server over HTTPS to view drafts and live campaigns."
            />
          ) : (
            <div className="adm-list">
              {data.campaigns.map((c) => (
                <article key={c.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>{c.name}</strong>
                    <div className="adm-topbar-actions">
                      {c.isDemo && <DemoBadge />}
                      <span className="adm-badge adm-badge--neutral">{c.status}</span>
                    </div>
                  </div>
                  <div className="adm-hint">Subject: {c.subject}</div>
                  <div className="adm-hint">
                    Lists: {c.lists.map((l) => l.name).join(", ") || "None"} · Sent: {c.sent} · Views: {c.views} · Clicks:{" "}
                    {c.clicks}
                  </div>
                  {c.status === "draft" && (
                    <div className="adm-topbar-actions" style={{ marginTop: "0.35rem" }}>
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        disabled={Boolean(c.isDemo)}
                        onClick={() => loadDraftIntoEditor(c)}
                      >
                        Edit Draft
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn--sm"
                        disabled={Boolean(c.isDemo)}
                        onClick={() => setDispatchTarget({ campaign: c, targetStatus: "scheduled" })}
                      >
                        Review & Schedule
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn--primary adm-btn--sm"
                        disabled={Boolean(c.isDemo)}
                        onClick={() => setDispatchTarget({ campaign: c, targetStatus: "running" })}
                      >
                        Review & Send Now
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <OutboundConfirmModal
        open={Boolean(dispatchTarget)}
        title={
          dispatchTarget?.targetStatus === "running"
            ? "Final Review: Send Campaign Now"
            : "Final Review: Schedule Campaign"
        }
        confirmPhrase={data?.confirmPhrase ?? "CONFIRM SEND"}
        liveAllowed={Boolean(data?.liveSendAllowed)}
        liveLockNote="Live sending is locked on this server (LISTMONK_ALLOW_LIVE_SEND is not set to true). Keep editing drafts safely or enable LISTMONK_ALLOW_LIVE_SEND=true in Vercel Production when ready."
        submitting={dispatching}
        onClose={() => setDispatchTarget(null)}
        onConfirm={(phrase) => void executeDispatch(phrase)}
        summary={
          dispatchTarget && (
            <>
              <div>
                <strong>Campaign:</strong> {dispatchTarget.campaign.name} (#{dispatchTarget.campaign.id})
              </div>
              <div>
                <strong>Subject:</strong> {dispatchTarget.campaign.subject}
              </div>
              <div>
                <strong>Target Lists:</strong>{" "}
                {dispatchTarget.campaign.lists.map((l) => l.name).join(", ") || "None"}
              </div>
              <div>
                <strong>Action:</strong> Transition Listmonk campaign status to{" "}
                <code className="adm-code">{dispatchTarget.targetStatus}</code>
              </div>
            </>
          )
        }
      />
    </>
  );
}

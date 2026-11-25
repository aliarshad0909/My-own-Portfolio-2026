"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, StatusBadge } from "@/components/admin/AdminUi";
import type {
  AdminContactInquiry,
  AdminStudioApplication,
  ApplicationModerationStatus,
  GmailMessageSummary,
  InquiryStatus,
  ServiceHealthState,
} from "@/lib/admin/types";

type InboxPayload = {
  ok: boolean;
  demoMode: boolean;
  database: { state: ServiceHealthState; detail: string; tablesReady: boolean };
  inquiries: AdminContactInquiry[];
  inquiriesAreDemo: boolean;
  applications: AdminStudioApplication[];
  applicationsAreDemo: boolean;
  gmail: {
    state: ServiceHealthState;
    accountEmail: string | null;
    detail: string;
    messages: GmailMessageSummary[];
    isDemo: boolean;
  };
};

export function InboxClient() {
  const { adminFetch } = useAdminClient();
  const [tab, setTab] = useState<"inquiries" | "applications" | "gmail">("inquiries");
  const [data, setData] = useState<InboxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/inbox");
      const json = (await res.json()) as InboxPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not load inbox." });
      } else {
        setData(json);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error loading inbox." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateInquiry(id: string, status: InquiryStatus) {
    setFeedback(null);
    const res = await adminFetch("/api/admin/inbox", {
      method: "PATCH",
      body: JSON.stringify({ kind: "inquiry", id, status }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !json.ok) {
      setFeedback({ kind: "error", text: json.message ?? "Update failed." });
      return;
    }
    setFeedback({ kind: "ok", text: `Inquiry status updated to "${status}".` });
    await load();
  }

  async function updateApplication(id: string, moderationStatus: ApplicationModerationStatus) {
    setFeedback(null);
    const res = await adminFetch("/api/admin/inbox", {
      method: "PATCH",
      body: JSON.stringify({ kind: "application", id, moderationStatus }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !json.ok) {
      setFeedback({ kind: "error", text: json.message ?? "Moderation update failed." });
      return;
    }
    setFeedback({ kind: "ok", text: `Application moderation status updated to "${moderationStatus}".` });
    await load();
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Inbox & Incoming Leads</h1>
          <p className="adm-page-lead">
            Triage Contact form inquiries, moderate private Studio Network applications, and inspect recent Gmail headers.
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn--sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {feedback && (
        <div className={`adm-alert ${feedback.kind === "ok" ? "adm-alert--ok" : "adm-alert--error"}`} role="status">
          {feedback.text}
        </div>
      )}

      <div className="adm-tabs" role="tablist" aria-label="Inbox sources">
        <button
          type="button"
          role="tab"
          className="adm-tab"
          aria-selected={tab === "inquiries"}
          onClick={() => setTab("inquiries")}
        >
          Contact Inquiries ({data?.inquiries.length ?? 0})
        </button>
        <button
          type="button"
          role="tab"
          className="adm-tab"
          aria-selected={tab === "applications"}
          onClick={() => setTab("applications")}
        >
          Studio Network Applications ({data?.applications.length ?? 0})
        </button>
        <button
          type="button"
          role="tab"
          className="adm-tab"
          aria-selected={tab === "gmail"}
          onClick={() => setTab("gmail")}
        >
          Gmail Inbox ({data?.gmail.messages.length ?? 0})
        </button>
      </div>

      {!data ? (
        <div className="adm-card">
          <p className="adm-card-sub">Loading inbox records…</p>
        </div>
      ) : tab === "inquiries" ? (
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Contact Form Inquiries (/contact)</h2>
              <p className="adm-card-sub">{data.database.detail}</p>
            </div>
            <div className="adm-topbar-actions">
              {data.inquiriesAreDemo && <DemoBadge />}
              <StatusBadge state={data.database.state} />
            </div>
          </div>
          {data.inquiries.length === 0 ? (
            <EmptyConnectState
              title="No contact inquiries stored yet"
              detail="Submissions continue delivering to Gmail via Resend. Connect Neon PostgreSQL (DATABASE_URL) and run `npm run admin:migrate` to track and annotate inquiries here."
            />
          ) : (
            <div className="adm-list">
              {data.inquiries.map((inq) => (
                <article key={inq.id} className="adm-item">
                  <div className="adm-item-row">
                    <div>
                      <strong>{inq.name}</strong> {inq.company ? `· ${inq.company}` : ""}
                      <div className="adm-hint">
                        {inq.email} · {inq.service} · {new Date(inq.receivedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="adm-topbar-actions">
                      {inq.isDemo && <DemoBadge />}
                      <select
                        aria-label={`Status for ${inq.name}`}
                        className="adm-select"
                        style={{ width: "auto", padding: "0.35rem 0.6rem" }}
                        value={inq.status}
                        disabled={Boolean(inq.isDemo)}
                        onChange={(e) => void updateInquiry(inq.id, e.target.value as InquiryStatus)}
                      >
                        <option value="new">New</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55 }}>{inq.description}</p>
                  <div className="adm-item-row">
                    <span className="adm-hint">
                      Budget: {inq.budget || "Not specified"} · Timeline: {inq.timeline || "Not specified"}
                    </span>
                    <a href={`mailto:${inq.email}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                      Reply via Email ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : tab === "applications" ? (
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Studio Network Applications (/studio-network)</h2>
              <p className="adm-card-sub">
                All applications stay private by default. Nothing is published to the public globe automatically.
              </p>
            </div>
            <div className="adm-topbar-actions">
              {data.applicationsAreDemo && <DemoBadge />}
              <StatusBadge state={data.database.state} />
            </div>
          </div>
          {data.applications.length === 0 ? (
            <EmptyConnectState
              title="No Studio Network applications stored yet"
              detail="Connect Neon PostgreSQL so incoming collaborator registrations appear in this private moderation queue."
            />
          ) : (
            <div className="adm-list">
              {data.applications.map((app) => (
                <article key={app.id} className="adm-item">
                  <div className="adm-item-row">
                    <div>
                      <strong>{app.name}</strong> · {app.locationTimezone}
                      <div className="adm-hint">
                        {app.email} · {app.availability} · Skills: {app.skills.join(", ")}
                      </div>
                    </div>
                    <div className="adm-topbar-actions">
                      {app.isDemo && <DemoBadge />}
                      <select
                        aria-label={`Moderation status for ${app.name}`}
                        className="adm-select"
                        style={{ width: "auto", padding: "0.35rem 0.6rem" }}
                        value={app.moderationStatus}
                        disabled={Boolean(app.isDemo)}
                        onChange={(e) =>
                          void updateApplication(app.id, e.target.value as ApplicationModerationStatus)
                        }
                      >
                        <option value="private_pending">Private — Pending Review</option>
                        <option value="verified_private">Verified — Private Roster</option>
                        <option value="approved_public">Approved for Public Listing</option>
                        <option value="rejected">Declined</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55 }}>{app.introduction}</p>
                  <div className="adm-item-row">
                    <span className="adm-hint">
                      Public globe opt-in: {app.publicListingOptIn ? `Requested (${app.approximateRegion || "region unspecified"})` : "No — Private only"}
                    </span>
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-btn adm-btn--ghost adm-btn--sm"
                    >
                      Review Portfolio ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Gmail Inbox Preview (Read-Only OAuth)</h2>
              <p className="adm-card-sub">{data.gmail.detail}</p>
            </div>
            <div className="adm-topbar-actions">
              {data.gmail.isDemo && <DemoBadge />}
              <StatusBadge state={data.gmail.state} />
              <Link href="/admin/integrations" className="adm-btn adm-btn--sm">
                Gmail OAuth Settings
              </Link>
            </div>
          </div>

          {data.gmail.messages.length === 0 ? (
            <EmptyConnectState
              title="Gmail OAuth is not connected yet"
              detail="Authorize official read-only Google OAuth in Integrations & Settings to preview recent message headers and jump directly to Gmail threads."
            />
          ) : (
            <div className="adm-list">
              {data.gmail.messages.map((msg) => (
                <article key={msg.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>{msg.subject}</strong>
                    <div className="adm-topbar-actions">
                      {msg.isDemo && <DemoBadge />}
                      <a
                        href={msg.gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                      >
                        Open in Gmail ↗
                      </a>
                    </div>
                  </div>
                  <div className="adm-hint">
                    From: {msg.from} · {msg.date}
                  </div>
                  <p className="adm-card-sub" style={{ margin: 0 }}>
                    {msg.snippet}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

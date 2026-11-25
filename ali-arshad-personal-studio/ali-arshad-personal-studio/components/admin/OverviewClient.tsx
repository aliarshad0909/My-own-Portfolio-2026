"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, StatusBadge } from "@/components/admin/AdminUi";
import type {
  AdminContactInquiry,
  AdminStudioApplication,
  AdminWorkflowItem,
  IntegrationStatusSummary,
} from "@/lib/admin/types";

type OverviewPayload = {
  ok: boolean;
  demoMode: boolean;
  generatedAt: string;
  summary: {
    connectedIntegrations: number;
    totalIntegrations: number;
    needsSetupIntegrations: number;
    attentionIntegrations: number;
    newInquiries: number;
    totalInquiries: number;
    inquiriesAreDemo: boolean;
    pendingApplications: number;
    totalApplications: number;
    applicationsAreDemo: boolean;
    activeWorkflowItems: number;
    workflowIsDemo: boolean;
    publicProjectsCount: number;
    publicBlogPostsCount: number;
  };
  integrations: IntegrationStatusSummary[];
  recentInquiries: AdminContactInquiry[];
  recentApplications: AdminStudioApplication[];
  upcomingWorkflow: AdminWorkflowItem[];
};

export function OverviewClient() {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/overview");
      const json = (await res.json()) as OverviewPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setError(json.message ?? "Could not load studio overview.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error while loading studio overview.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="adm-card">
        <p className="adm-card-sub">Checking live studio services and intake queues…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="adm-alert adm-alert--error">
        {error || "Unable to load overview."}{" "}
        <button type="button" className="adm-btn adm-btn--sm" onClick={load} style={{ marginLeft: "0.75rem" }}>
          Retry
        </button>
      </div>
    );
  }

  const { summary } = data;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Studio Operations Overview</h1>
          <p className="adm-page-lead">
            Live integration health, incoming leads, Studio Network moderation, and quick studio actions.
          </p>
        </div>
        <div className="adm-topbar-actions">
          <button type="button" className="adm-btn adm-btn--sm" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Status"}
          </button>
          <Link href="/admin/campaigns" className="adm-btn adm-btn--primary adm-btn--sm">
            New Email Draft
          </Link>
        </div>
      </div>

      <section className="adm-kpi-grid" aria-label="Operational summary">
        <article className="adm-card">
          <div className="adm-kpi-label">Connected Services</div>
          <div className="adm-kpi-val">
            {summary.connectedIntegrations} / {summary.totalIntegrations}
          </div>
          <div className="adm-kpi-note">
            {summary.needsSetupIntegrations} awaiting setup · {summary.attentionIntegrations} need attention
          </div>
        </article>

        <article className="adm-card">
          <div className="adm-item-row">
            <span className="adm-kpi-label">Contact Inquiries</span>
            {summary.inquiriesAreDemo && <DemoBadge />}
          </div>
          <div className="adm-kpi-val">{summary.newInquiries}</div>
          <div className="adm-kpi-note">{summary.totalInquiries} total stored in queue</div>
        </article>

        <article className="adm-card">
          <div className="adm-item-row">
            <span className="adm-kpi-label">Studio Network Queue</span>
            {summary.applicationsAreDemo && <DemoBadge />}
          </div>
          <div className="adm-kpi-val">{summary.pendingApplications}</div>
          <div className="adm-kpi-note">Private by default until manually approved</div>
        </article>

        <article className="adm-card">
          <div className="adm-kpi-label">Live Portfolio Catalog</div>
          <div className="adm-kpi-val">{summary.publicProjectsCount}</div>
          <div className="adm-kpi-note">
            {summary.publicBlogPostsCount} published blog articles · {summary.activeWorkflowItems} active ops tasks
          </div>
        </article>
      </section>

      <section className="adm-card" aria-label="Integration health matrix">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Service Health & Connections</h2>
            <p className="adm-card-sub">Real server-side checks — unconfigured services stay honestly marked Needs Setup.</p>
          </div>
          <Link href="/admin/integrations" className="adm-btn adm-btn--sm">
            Manage Integrations
          </Link>
        </div>
        <div className="adm-grid-2">
          {data.integrations.map((svc) => (
            <div key={svc.id} className="adm-item">
              <div className="adm-item-row">
                <strong>{svc.name}</strong>
                <StatusBadge state={svc.state} />
              </div>
              <p className="adm-card-sub" style={{ margin: 0 }}>
                {svc.detail}
              </p>
              {svc.baseUrlHost && (
                <span className="adm-hint">
                  Host: <code className="adm-code">{svc.baseUrlHost}</code>
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="adm-grid-2" aria-label="Recent queues">
        <article className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Recent Contact Inquiries</h2>
              <p className="adm-card-sub">Incoming project briefs from /contact</p>
            </div>
            <Link href="/admin/inbox" className="adm-btn adm-btn--ghost adm-btn--sm">
              Open Inbox →
            </Link>
          </div>
          {data.recentInquiries.length === 0 ? (
            <EmptyConnectState
              title="No stored inquiries yet"
              detail="Connect Neon PostgreSQL (DATABASE_URL) so future /contact submissions appear here alongside Gmail delivery."
            />
          ) : (
            <div className="adm-list">
              {data.recentInquiries.map((inq) => (
                <div key={inq.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>{inq.name}</strong>
                    <div className="adm-topbar-actions">
                      {inq.isDemo && <DemoBadge />}
                      <span className="adm-badge adm-badge--neutral">{inq.status}</span>
                    </div>
                  </div>
                  <div className="adm-hint">
                    {inq.service} · {inq.email}
                  </div>
                  <p className="adm-card-sub" style={{ margin: 0 }}>
                    {inq.description.slice(0, 140)}
                    {inq.description.length > 140 ? "…" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Internal Studio Workflow</h2>
              <p className="adm-card-sub">Active portfolio, blog, and campaign tasks</p>
            </div>
            <Link href="/admin/projects" className="adm-btn adm-btn--ghost adm-btn--sm">
              Open Board →
            </Link>
          </div>
          {data.upcomingWorkflow.length === 0 ? (
            <EmptyConnectState
              title="No workflow items saved yet"
              detail="Connect Neon PostgreSQL to track drafts, case-study updates, and campaign milestones."
              actionLabel="Open Projects & Content"
              actionHref="/admin/projects"
            />
          ) : (
            <div className="adm-list">
              {data.upcomingWorkflow.map((item) => (
                <div key={item.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>{item.title}</strong>
                    <div className="adm-topbar-actions">
                      {item.isDemo && <DemoBadge />}
                      <span className="adm-badge adm-badge--neutral">{item.status}</span>
                    </div>
                  </div>
                  <div className="adm-hint">
                    Type: {item.kind} {item.dueDate ? `· Due ${item.dueDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}

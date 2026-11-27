"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, StatusBadge } from "@/components/admin/AdminUi";
import type { AdminWorkflowItem, ServiceHealthState, WorkflowKind, WorkflowStatus } from "@/lib/admin/types";

type ProjectsPayload = {
  ok: boolean;
  demoMode: boolean;
  database: { state: ServiceHealthState; detail: string; tablesReady: boolean };
  workflowItems: AdminWorkflowItem[];
  workflowIsDemo: boolean;
  portfolioSummary: {
    totalProjects: number;
    statusBreakdown: Record<string, number>;
    recentProjects: Array<{
      slug: string;
      title: string;
      status: string;
      projectType: string;
      categories: string[];
      href: string;
    }>;
    totalBlogPosts: number;
    blogPosts: Array<{
      slug: string;
      title: string;
      category: string;
      publishedAt: string;
      href: string;
    }>;
  };
};

export function ProjectsClient() {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<ProjectsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WorkflowKind>("project");
  const [status, setStatus] = useState<WorkflowStatus>("backlog");
  const [linkedSlug, setLinkedSlug] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/projects");
      const json = (await res.json()) as ProjectsPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not load projects workspace." });
      } else {
        setData(json);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error reaching projects API." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/projects", {
        method: "POST",
        body: JSON.stringify({ title, kind, status, linkedSlug, dueDate, notes }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not save workflow item." });
      } else {
        setFeedback({ kind: "ok", text: "Workflow item saved to Neon PostgreSQL." });
        setTitle("");
        setLinkedSlug("");
        setDueDate("");
        setNotes("");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, nextStatus: WorkflowStatus) {
    setFeedback(null);
    const res = await adminFetch("/api/admin/projects", {
      method: "PATCH",
      body: JSON.stringify({ id, status: nextStatus }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !json.ok) {
      setFeedback({ kind: "error", text: json.message ?? "Could not update status." });
      return;
    }
    setFeedback({ kind: "ok", text: `Updated workflow item to "${nextStatus}".` });
    await load();
  }

  const dbConnected = data?.database.state === "connected";

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Projects & Content Workflow</h1>
          <p className="adm-page-lead">
            Track private studio roadmap items, draft case studies, and content calendars in Neon alongside a read-only
            view of your live portfolio catalog. Public code files are never mutated automatically.
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn--sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {feedback && (
        <div className={`adm-alert ${feedback.kind === "ok" ? "adm-alert--ok" : "adm-alert--error"}`} role="alert">
          {feedback.text}
        </div>
      )}

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Add Studio Workflow Item</h2>
              <p className="adm-card-sub">Stored privately in Neon PostgreSQL (`admin_workflow_items`).</p>
            </div>
            {data && <StatusBadge state={data.database.state} />}
          </div>
          <form className="adm-form" onSubmit={handleCreate}>
            <div className="adm-field">
              <label htmlFor="wf-title" className="adm-label">
                Task / Draft Title
              </label>
              <input
                id="wf-title"
                className="adm-input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write n8n webhook replay case study section"
              />
            </div>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label htmlFor="wf-kind" className="adm-label">
                  Category
                </label>
                <select id="wf-kind" className="adm-select" value={kind} onChange={(e) => setKind(e.target.value as WorkflowKind)}>
                  <option value="project">Project Build</option>
                  <option value="content">Blog / Content</option>
                  <option value="campaign_idea">Campaign Idea</option>
                  <option value="ops_task">Studio Ops Task</option>
                </select>
              </div>
              <div className="adm-field">
                <label htmlFor="wf-status" className="adm-label">
                  Status
                </label>
                <select
                  id="wf-status"
                  className="adm-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label htmlFor="wf-slug" className="adm-label">
                  Linked Portfolio / Blog Slug (Optional)
                </label>
                <input
                  id="wf-slug"
                  className="adm-input"
                  value={linkedSlug}
                  onChange={(e) => setLinkedSlug(e.target.value)}
                  placeholder="pipelineos-crm"
                />
              </div>
              <div className="adm-field">
                <label htmlFor="wf-due" className="adm-label">
                  Target Date (Optional)
                </label>
                <input id="wf-due" type="date" className="adm-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="adm-field">
              <label htmlFor="wf-notes" className="adm-label">
                Internal Notes
              </label>
              <textarea id="wf-notes" className="adm-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={!dbConnected || saving}>
              {saving ? "Saving…" : "Add Workflow Item"}
            </button>
          </form>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Internal Workflow Board</h2>
              <p className="adm-card-sub">Private studio task list and publishing tracker</p>
            </div>
            {data?.workflowIsDemo && <DemoBadge />}
          </div>

          {!data || data.workflowItems.length === 0 ? (
            <EmptyConnectState
              title="No internal workflow items yet"
              detail="Connect Neon PostgreSQL and run `npm run admin:migrate` to save private project and content milestones."
            />
          ) : (
            <div className="adm-list">
              {data.workflowItems.map((item) => (
                <article key={item.id} className="adm-item">
                  <div className="adm-item-row">
                    <strong>{item.title}</strong>
                    <div className="adm-topbar-actions">
                      {item.isDemo && <DemoBadge />}
                      <select
                        aria-label={`Status for ${item.title}`}
                        className="adm-select"
                        style={{ width: "auto", padding: "0.35rem 0.6rem" }}
                        value={item.status}
                        disabled={Boolean(item.isDemo)}
                        onChange={(e) => void handleStatusChange(item.id, e.target.value as WorkflowStatus)}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="done">Done</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="adm-hint">
                    {item.kind} {item.linkedSlug ? `· Slug: ${item.linkedSlug}` : ""} {item.dueDate ? `· Due ${item.dueDate}` : ""}
                  </div>
                  {item.notes && <p className="adm-card-sub" style={{ margin: 0 }}>{item.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {data && (
        <section className="adm-card" aria-label="Read-only public portfolio catalog">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Live Public Catalog (Read-Only Reference)</h2>
              <p className="adm-card-sub">
                {data.portfolioSummary.totalProjects} projects in `lib/projects.ts` · {data.portfolioSummary.totalBlogPosts}{" "}
                posts in `lib/content/blog.ts`
              </p>
            </div>
            <Link href="/work" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--ghost adm-btn--sm">
              Open /work ↗
            </Link>
          </div>

          <div className="adm-topbar-actions" style={{ flexWrap: "wrap", marginBottom: "1rem" }}>
            {Object.entries(data.portfolioSummary.statusBreakdown).map(([st, count]) => (
              <span key={st} className="adm-badge adm-badge--neutral">
                {st}: {count}
              </span>
            ))}
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Recent Blog Articles</th>
                  <th>Category</th>
                  <th>Published</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {data.portfolioSummary.blogPosts.map((post) => (
                  <tr key={post.slug}>
                    <td>
                      <strong>{post.title}</strong>
                    </td>
                    <td>{post.category}</td>
                    <td>{post.publishedAt}</td>
                    <td>
                      <Link href={post.href} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--ghost adm-btn--sm">
                        View ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

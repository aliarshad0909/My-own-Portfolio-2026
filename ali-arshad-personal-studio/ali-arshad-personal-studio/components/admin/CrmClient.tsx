"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminClient } from "@/components/admin/AdminClientContext";
import { DemoBadge, EmptyConnectState, StatusBadge } from "@/components/admin/AdminUi";
import type {
  ServiceHealthState,
  TwentyCompany,
  TwentyOpportunity,
  TwentyPerson,
  TwentyTask,
} from "@/lib/admin/types";

type CrmPayload = {
  ok: boolean;
  demoMode: boolean;
  status: { state: ServiceHealthState; detail: string; baseUrlHost?: string };
  syncedWithTwenty: boolean;
  people: TwentyPerson[];
  companies: TwentyCompany[];
  opportunities: TwentyOpportunity[];
  tasks: TwentyTask[];
  isDemo: boolean;
};

export function CrmClient() {
  const { adminFetch } = useAdminClient();
  const [data, setData] = useState<CrmPayload | null>(null);
  const [tab, setTab] = useState<"people" | "companies" | "opportunities" | "tasks">("people");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);

  // Add person form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [city, setCity] = useState("");
  const [savingPerson, setSavingPerson] = useState(false);

  // Add task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/crm");
      const json = (await res.json()) as CrmPayload & { message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not load Twenty CRM data." });
      } else {
        setData(json);
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error reaching CRM API." });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreatePerson(e: FormEvent) {
    e.preventDefault();
    setSavingPerson(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/crm", {
        method: "POST",
        body: JSON.stringify({ action: "create_person", firstName, lastName, email, jobTitle, city }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        created?: boolean;
        duplicate?: boolean;
        message?: string;
      };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not create contact." });
      } else if (json.duplicate) {
        setFeedback({
          kind: "warn",
          text: json.message ?? "Contact already exists in Twenty CRM — duplicate creation skipped.",
        });
      } else {
        setFeedback({ kind: "ok", text: "Contact created and synced with Twenty CRM." });
        setFirstName("");
        setLastName("");
        setEmail("");
        setJobTitle("");
        setCity("");
        await load();
      }
    } finally {
      setSavingPerson(false);
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setSavingTask(true);
    setFeedback(null);
    try {
      const res = await adminFetch("/api/admin/crm", {
        method: "POST",
        body: JSON.stringify({ action: "create_task", title: taskTitle, dueAt: taskDue || null }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFeedback({ kind: "error", text: json.message ?? "Could not create task." });
      } else {
        setFeedback({ kind: "ok", text: "Follow-up task created in Twenty CRM." });
        setTaskTitle("");
        setTaskDue("");
        await load();
      }
    } finally {
      setSavingTask(false);
    }
  }

  const synced = Boolean(data?.syncedWithTwenty);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Contacts & CRM (Twenty)</h1>
          <p className="adm-page-lead">
            Manage client leads, companies, deals, and follow-ups synced with self-hosted Twenty CRM. Duplicate email
            checks run before creating contacts.
          </p>
        </div>
        <div className="adm-topbar-actions">
          {synced ? (
            <span className="adm-badge adm-badge--connected">Synced with Twenty</span>
          ) : data?.isDemo ? (
            <DemoBadge label="Local Demo" />
          ) : null}
          {data && <StatusBadge state={data.status.state} />}
          <button type="button" className="adm-btn adm-btn--sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {data && (
        <div className="adm-alert" role="status">
          <strong>CRM Connection:</strong> {data.status.detail}
        </div>
      )}

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

      <div className="adm-tabs" role="tablist" aria-label="CRM views">
        <button type="button" role="tab" className="adm-tab" aria-selected={tab === "people"} onClick={() => setTab("people")}>
          People ({data?.people.length ?? 0})
        </button>
        <button
          type="button"
          role="tab"
          className="adm-tab"
          aria-selected={tab === "companies"}
          onClick={() => setTab("companies")}
        >
          Companies ({data?.companies.length ?? 0})
        </button>
        <button
          type="button"
          role="tab"
          className="adm-tab"
          aria-selected={tab === "opportunities"}
          onClick={() => setTab("opportunities")}
        >
          Opportunities ({data?.opportunities.length ?? 0})
        </button>
        <button type="button" role="tab" className="adm-tab" aria-selected={tab === "tasks"} onClick={() => setTab("tasks")}>
          Tasks ({data?.tasks.length ?? 0})
        </button>
      </div>

      <section className="adm-card">
        {!data ? (
          <p className="adm-card-sub">Loading Twenty CRM workspace…</p>
        ) : tab === "people" ? (
          data.people.length === 0 ? (
            <EmptyConnectState
              title="No contacts loaded from Twenty CRM"
              detail="Add TWENTY_URL and TWENTY_API_KEY in Vercel or .env.local to sync real contacts and pipeline data."
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role / Company</th>
                    <th>City</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>
                          {p.firstName} {p.lastName}
                        </strong>
                      </td>
                      <td>{p.email || "—"}</td>
                      <td>{[p.jobTitle, p.companyName].filter(Boolean).join(" · ") || "—"}</td>
                      <td>{p.city || "—"}</td>
                      <td>
                        {p.source === "twenty" ? (
                          <span className="adm-badge adm-badge--connected">Twenty</span>
                        ) : (
                          <DemoBadge />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "companies" ? (
          data.companies.length === 0 ? (
            <EmptyConnectState title="No companies loaded" detail="Connect Twenty CRM to list client accounts." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Domain</th>
                    <th>City</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{c.domain || "—"}</td>
                      <td>{c.city || "—"}</td>
                      <td>{c.source === "twenty" ? <span className="adm-badge adm-badge--connected">Twenty</span> : <DemoBadge />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "opportunities" ? (
          data.opportunities.length === 0 ? (
            <EmptyConnectState title="No opportunities loaded" detail="Connect Twenty CRM to inspect active deals." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Stage</th>
                    <th>Amount</th>
                    <th>Close Date</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.opportunities.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.name}</strong>
                        {o.companyName && <div className="adm-hint">{o.companyName}</div>}
                      </td>
                      <td>
                        <span className="adm-badge adm-badge--neutral">{o.stage}</span>
                      </td>
                      <td>{o.amountUsd !== null ? `$${o.amountUsd.toLocaleString()}` : "—"}</td>
                      <td>{o.closeDate || "—"}</td>
                      <td>{o.source === "twenty" ? <span className="adm-badge adm-badge--connected">Twenty</span> : <DemoBadge />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : data.tasks.length === 0 ? (
          <EmptyConnectState title="No follow-up tasks loaded" detail="Connect Twenty CRM to track client follow-up tasks." />
        ) : (
          <div className="adm-list">
            {data.tasks.map((t) => (
              <div key={t.id} className="adm-item">
                <div className="adm-item-row">
                  <strong>{t.title}</strong>
                  <div className="adm-topbar-actions">
                    {t.source === "twenty" ? <span className="adm-badge adm-badge--connected">Twenty</span> : <DemoBadge />}
                    <span className="adm-badge adm-badge--neutral">{t.status}</span>
                  </div>
                </div>
                <div className="adm-hint">{t.dueAt ? `Due: ${new Date(t.dueAt).toLocaleString()}` : "No due date"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Add Contact (Duplicate-Safe)</h2>
              <p className="adm-card-sub">Checks existing Twenty CRM emails before creating a new Person.</p>
            </div>
          </div>
          <form className="adm-form" onSubmit={handleCreatePerson}>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label htmlFor="crm-fn" className="adm-label">
                  First Name
                </label>
                <input id="crm-fn" className="adm-input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="adm-field">
                <label htmlFor="crm-ln" className="adm-label">
                  Last Name
                </label>
                <input id="crm-ln" className="adm-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="adm-field">
              <label htmlFor="crm-em" className="adm-label">
                Primary Email
              </label>
              <input id="crm-em" type="email" className="adm-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label htmlFor="crm-role" className="adm-label">
                  Job Title
                </label>
                <input id="crm-role" className="adm-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div className="adm-field">
                <label htmlFor="crm-city" className="adm-label">
                  City
                </label>
                <input id="crm-city" className="adm-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={!synced || savingPerson}>
              {savingPerson ? "Checking & Saving…" : "Save Contact to Twenty CRM"}
            </button>
          </form>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Add Follow-Up Task</h2>
              <p className="adm-card-sub">Log a client reminder directly into Twenty CRM.</p>
            </div>
          </div>
          <form className="adm-form" onSubmit={handleCreateTask}>
            <div className="adm-field">
              <label htmlFor="crm-task-title" className="adm-label">
                Task Title
              </label>
              <input
                id="crm-task-title"
                className="adm-input"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Send scope breakdown and timeline estimate"
              />
            </div>
            <div className="adm-field">
              <label htmlFor="crm-task-due" className="adm-label">
                Optional Due Date
              </label>
              <input
                id="crm-task-due"
                type="datetime-local"
                className="adm-input"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
            </div>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={!synced || savingTask}>
              {savingTask ? "Creating…" : "Create Twenty Task"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

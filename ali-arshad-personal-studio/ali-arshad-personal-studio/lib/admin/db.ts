/**
 * Server-only Neon PostgreSQL persistence layer for the Private Studio Admin Console.
 * Uses @neondatabase/serverless with pooled `DATABASE_URL` for serverless requests.
 * Direct `DIRECT_DATABASE_URL` is used only by `scripts/admin-migrate.mjs`.
 *
 * When `DATABASE_URL` is not configured, all operations fail gracefully without
 * breaking the public portfolio or crashing the admin UI.
 */
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import { decryptAtRest, encryptAtRest } from "@/lib/admin/auth-core";
import type {
  AdminContactInquiry,
  AdminPreferences,
  AdminStudioApplication,
  AdminWorkflowItem,
  ApplicationModerationStatus,
  InquiryStatus,
  ServiceHealthState,
  WorkflowKind,
  WorkflowStatus,
} from "@/lib/admin/types";
import { envVar } from "@/lib/form-security";
import type { InquiryInput } from "@/lib/inquiry";
import type { CollaboratorInput } from "@/lib/studio-network";

export function isDatabaseConfigured(): boolean {
  const url = envVar("DATABASE_URL");
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

function getSql() {
  const url = envVar("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

export async function checkDatabaseStatus(): Promise<{ state: ServiceHealthState; detail: string; tablesReady: boolean }> {
  if (!isDatabaseConfigured()) {
    return {
      state: "needs_setup",
      detail: "Add pooled DATABASE_URL (Neon PostgreSQL) and run `npm run admin:migrate` to store inbox records and workflow items.",
      tablesReady: false,
    };
  }
  try {
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('admin_contact_inquiries', 'admin_studio_applications', 'admin_workflow_items', 'admin_preferences')
    `;
    const ready = tables.length >= 4;
    if (!ready) {
      return {
        state: "needs_setup",
        detail: "Neon PostgreSQL reachable, but admin tables are not created yet. Run `npm run admin:migrate`.",
        tablesReady: false,
      };
    }
    return {
      state: "connected",
      detail: "Neon PostgreSQL (pooled) connected and admin schema verified.",
      tablesReady: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 120) : "connection failed";
    return {
      state: "error",
      detail: `Neon PostgreSQL connection error (${msg}).`,
      tablesReady: false,
    };
  }
}

/* ── Contact Inquiries ─────────────────────────────────────────────────── */

export async function recordContactInquiry(
  inquiry: InquiryInput,
  deliveryChannel: string,
): Promise<{ stored: boolean; id?: string }> {
  if (!isDatabaseConfigured()) return { stored: false };
  try {
    const sql = getSql();
    const id = `inq_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await sql`
      INSERT INTO admin_contact_inquiries (
        id, name, email, company, service, description, budget, timeline,
        status, notes, delivery_channel, is_demo
      ) VALUES (
        ${id}, ${inquiry.name}, ${inquiry.email}, ${inquiry.company},
        ${inquiry.service}, ${inquiry.description}, ${inquiry.budget}, ${inquiry.timeline},
        'new', '', ${deliveryChannel}, false
      )
    `;
    return { stored: true, id };
  } catch (err) {
    console.error("[admin-db] failed to store contact inquiry:", err instanceof Error ? err.message : "unknown");
    return { stored: false };
  }
}

export async function listContactInquiries(includeDemo = false): Promise<AdminContactInquiry[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getSql();
  const rows = includeDemo
    ? await sql`
        SELECT id, name, email, company, service, description, budget, timeline,
               status, notes, delivery_channel, received_at, is_demo
        FROM admin_contact_inquiries
        ORDER BY received_at DESC
        LIMIT 100
      `
    : await sql`
        SELECT id, name, email, company, service, description, budget, timeline,
               status, notes, delivery_channel, received_at, is_demo
        FROM admin_contact_inquiries
        WHERE is_demo = false
        ORDER BY received_at DESC
        LIMIT 100
      `;
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    company: String(r.company ?? ""),
    service: String(r.service),
    description: String(r.description),
    budget: String(r.budget ?? ""),
    timeline: String(r.timeline ?? ""),
    status: String(r.status) as InquiryStatus,
    notes: String(r.notes ?? ""),
    deliveryChannel: String(r.delivery_channel ?? ""),
    receivedAt: new Date(String(r.received_at)).toISOString(),
    isDemo: Boolean(r.is_demo),
  }));
}

export async function updateContactInquiryStatus(
  id: string,
  status: InquiryStatus,
  notes?: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const sql = getSql();
  const res =
    notes !== undefined
      ? await sql`
          UPDATE admin_contact_inquiries
          SET status = ${status}, notes = ${notes}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id
        `
      : await sql`
          UPDATE admin_contact_inquiries
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id
        `;
  return res.length > 0;
}

/* ── Studio Network Applications ───────────────────────────────────────── */

export async function recordStudioApplication(
  app: CollaboratorInput,
): Promise<{ stored: boolean; id?: string }> {
  if (!isDatabaseConfigured()) return { stored: false };
  try {
    const sql = getSql();
    const id = `app_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await sql`
      INSERT INTO admin_studio_applications (
        id, name, email, location_timezone, skills, portfolio_url,
        availability, introduction, public_listing_opt_in, approximate_region,
        moderation_status, notes, is_demo
      ) VALUES (
        ${id}, ${app.name}, ${app.email}, ${app.locationTimezone},
        ${JSON.stringify(app.skills)}::jsonb, ${app.portfolioUrl},
        ${app.availability}, ${app.introduction}, ${app.publicListingOptIn},
        ${app.approximateRegion}, 'private_pending', '', false
      )
    `;
    return { stored: true, id };
  } catch (err) {
    console.error("[admin-db] failed to store studio application:", err instanceof Error ? err.message : "unknown");
    return { stored: false };
  }
}

export async function listStudioApplications(includeDemo = false): Promise<AdminStudioApplication[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getSql();
  const rows = includeDemo
    ? await sql`
        SELECT id, name, email, location_timezone, skills, portfolio_url,
               availability, introduction, public_listing_opt_in, approximate_region,
               moderation_status, notes, received_at, is_demo
        FROM admin_studio_applications
        ORDER BY received_at DESC
        LIMIT 100
      `
    : await sql`
        SELECT id, name, email, location_timezone, skills, portfolio_url,
               availability, introduction, public_listing_opt_in, approximate_region,
               moderation_status, notes, received_at, is_demo
        FROM admin_studio_applications
        WHERE is_demo = false
        ORDER BY received_at DESC
        LIMIT 100
      `;
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    locationTimezone: String(r.location_timezone),
    skills: Array.isArray(r.skills) ? r.skills.map(String) : [],
    portfolioUrl: String(r.portfolio_url),
    availability: String(r.availability),
    introduction: String(r.introduction),
    publicListingOptIn: Boolean(r.public_listing_opt_in),
    approximateRegion: String(r.approximate_region ?? ""),
    moderationStatus: String(r.moderation_status) as ApplicationModerationStatus,
    notes: String(r.notes ?? ""),
    receivedAt: new Date(String(r.received_at)).toISOString(),
    isDemo: Boolean(r.is_demo),
  }));
}

export async function updateStudioApplicationModeration(
  id: string,
  moderationStatus: ApplicationModerationStatus,
  notes?: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const sql = getSql();
  const res =
    notes !== undefined
      ? await sql`
          UPDATE admin_studio_applications
          SET moderation_status = ${moderationStatus}, notes = ${notes}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id
        `
      : await sql`
          UPDATE admin_studio_applications
          SET moderation_status = ${moderationStatus}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id
        `;
  return res.length > 0;
}

/* ── Internal Projects & Content Workflow ──────────────────────────────── */

export async function listWorkflowItems(includeDemo = false): Promise<AdminWorkflowItem[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getSql();
  const rows = includeDemo
    ? await sql`
        SELECT id, title, kind, status, linked_slug, due_date, notes, updated_at, is_demo
        FROM admin_workflow_items
        ORDER BY updated_at DESC
        LIMIT 100
      `
    : await sql`
        SELECT id, title, kind, status, linked_slug, due_date, notes, updated_at, is_demo
        FROM admin_workflow_items
        WHERE is_demo = false
        ORDER BY updated_at DESC
        LIMIT 100
      `;
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    kind: String(r.kind) as WorkflowKind,
    status: String(r.status) as WorkflowStatus,
    linkedSlug: String(r.linked_slug ?? ""),
    dueDate: String(r.due_date ?? ""),
    notes: String(r.notes ?? ""),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    isDemo: Boolean(r.is_demo),
  }));
}

export async function createWorkflowItem(input: {
  title: string;
  kind: WorkflowKind;
  status: WorkflowStatus;
  linkedSlug: string;
  dueDate: string;
  notes: string;
}): Promise<AdminWorkflowItem> {
  const sql = getSql();
  const id = `wf_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const rows = await sql`
    INSERT INTO admin_workflow_items (id, title, kind, status, linked_slug, due_date, notes, is_demo)
    VALUES (${id}, ${input.title}, ${input.kind}, ${input.status}, ${input.linkedSlug}, ${input.dueDate}, ${input.notes}, false)
    RETURNING id, title, kind, status, linked_slug, due_date, notes, updated_at, is_demo
  `;
  const r = rows[0];
  return {
    id: String(r.id),
    title: String(r.title),
    kind: String(r.kind) as WorkflowKind,
    status: String(r.status) as WorkflowStatus,
    linkedSlug: String(r.linked_slug ?? ""),
    dueDate: String(r.due_date ?? ""),
    notes: String(r.notes ?? ""),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    isDemo: Boolean(r.is_demo),
  };
}

export async function updateWorkflowItem(
  id: string,
  patch: Partial<{ title: string; kind: WorkflowKind; status: WorkflowStatus; linkedSlug: string; dueDate: string; notes: string }>,
): Promise<AdminWorkflowItem | null> {
  const sql = getSql();
  const existingRows = await sql`
    SELECT id, title, kind, status, linked_slug, due_date, notes
    FROM admin_workflow_items
    WHERE id = ${id}
    LIMIT 1
  `;
  if (existingRows.length === 0) return null;
  const cur = existingRows[0];
  const rows = await sql`
    UPDATE admin_workflow_items
    SET
      title = ${patch.title ?? String(cur.title)},
      kind = ${patch.kind ?? String(cur.kind)},
      status = ${patch.status ?? String(cur.status)},
      linked_slug = ${patch.linkedSlug ?? String(cur.linked_slug ?? "")},
      due_date = ${patch.dueDate ?? String(cur.due_date ?? "")},
      notes = ${patch.notes ?? String(cur.notes ?? "")},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, kind, status, linked_slug, due_date, notes, updated_at, is_demo
  `;
  const r = rows[0];
  return {
    id: String(r.id),
    title: String(r.title),
    kind: String(r.kind) as WorkflowKind,
    status: String(r.status) as WorkflowStatus,
    linkedSlug: String(r.linked_slug ?? ""),
    dueDate: String(r.due_date ?? ""),
    notes: String(r.notes ?? ""),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    isDemo: Boolean(r.is_demo),
  };
}

/* ── Encrypted Gmail OAuth Token Storage ───────────────────────────────── */

export type StoredGmailToken = {
  accountEmail: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

export async function saveGmailTokens(token: StoredGmailToken): Promise<void> {
  const sql = getSql();
  const encAccess = encryptAtRest(token.accessToken);
  const encRefresh = token.refreshToken ? encryptAtRest(token.refreshToken) : "";
  await sql`
    INSERT INTO admin_gmail_tokens (id, account_email, access_token_enc, refresh_token_enc, expires_at, scope, updated_at)
    VALUES ('primary', ${token.accountEmail}, ${encAccess}, ${encRefresh}, ${token.expiresAt}, ${token.scope}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      account_email = EXCLUDED.account_email,
      access_token_enc = EXCLUDED.access_token_enc,
      refresh_token_enc = CASE WHEN EXCLUDED.refresh_token_enc <> '' THEN EXCLUDED.refresh_token_enc ELSE admin_gmail_tokens.refresh_token_enc END,
      expires_at = EXCLUDED.expires_at,
      scope = EXCLUDED.scope,
      updated_at = NOW()
  `;
}

export async function loadGmailTokens(): Promise<StoredGmailToken | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT account_email, access_token_enc, refresh_token_enc, expires_at, scope
      FROM admin_gmail_tokens
      WHERE id = 'primary'
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    const accessToken = decryptAtRest(String(r.access_token_enc ?? ""));
    const refreshToken = r.refresh_token_enc ? decryptAtRest(String(r.refresh_token_enc)) ?? "" : "";
    if (!accessToken) return null;
    return {
      accountEmail: String(r.account_email),
      accessToken,
      refreshToken,
      expiresAt: Number(r.expires_at ?? 0),
      scope: String(r.scope ?? ""),
    };
  } catch {
    return null;
  }
}

export async function deleteGmailTokens(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getSql();
  await sql`DELETE FROM admin_gmail_tokens WHERE id = 'primary'`;
}

/* ── Preferences & Lightweight Audit Log ───────────────────────────────── */

export const DEFAULT_PREFERENCES: AdminPreferences = {
  timezone: "Asia/Karachi",
  compactMode: false,
  defaultListmonkTimezone: "America/New_York",
  updatedAt: "",
};

export async function loadAdminPreferences(): Promise<AdminPreferences> {
  if (!isDatabaseConfigured()) return DEFAULT_PREFERENCES;
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT timezone, compact_mode, default_listmonk_timezone, updated_at
      FROM admin_preferences
      WHERE id = 'primary'
      LIMIT 1
    `;
    if (rows.length === 0) return DEFAULT_PREFERENCES;
    const r = rows[0];
    return {
      timezone: String(r.timezone || DEFAULT_PREFERENCES.timezone),
      compactMode: Boolean(r.compact_mode),
      defaultListmonkTimezone: String(r.default_listmonk_timezone || DEFAULT_PREFERENCES.defaultListmonkTimezone),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveAdminPreferences(prefs: {
  timezone: string;
  compactMode: boolean;
  defaultListmonkTimezone: string;
}): Promise<AdminPreferences> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO admin_preferences (id, timezone, compact_mode, default_listmonk_timezone, updated_at)
    VALUES ('primary', ${prefs.timezone}, ${prefs.compactMode}, ${prefs.defaultListmonkTimezone}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      timezone = EXCLUDED.timezone,
      compact_mode = EXCLUDED.compact_mode,
      default_listmonk_timezone = EXCLUDED.default_listmonk_timezone,
      updated_at = NOW()
    RETURNING timezone, compact_mode, default_listmonk_timezone, updated_at
  `;
  const r = rows[0];
  return {
    timezone: String(r.timezone),
    compactMode: Boolean(r.compact_mode),
    defaultListmonkTimezone: String(r.default_listmonk_timezone),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

/** Record an operational event without ever logging sensitive bodies, passwords, or OAuth tokens. */
export async function recordAdminAudit(actor: string, action: string, target: string, outcome: "ok" | "error"): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const sql = getSql();
    const id = `aud_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await sql`
      INSERT INTO admin_audit_log (id, actor_email, action, target, outcome)
      VALUES (${id}, ${actor}, ${action.slice(0, 80)}, ${target.slice(0, 120)}, ${outcome})
    `;
  } catch {
    // Non-blocking audit log
  }
}

import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import {
  checkDatabaseStatus,
  createWorkflowItem,
  isDatabaseConfigured,
  listWorkflowItems,
  recordAdminAudit,
  updateWorkflowItem,
} from "@/lib/admin/db";
import { DEMO_WORKFLOW_ITEMS } from "@/lib/admin/demo-data";
import type { WorkflowKind, WorkflowStatus } from "@/lib/admin/types";
import { BLOG_POSTS } from "@/lib/content/blog";
import { PROJECTS } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KINDS: WorkflowKind[] = ["project", "content", "campaign_idea", "ops_task"];
const ALLOWED_STATUSES: WorkflowStatus[] = ["backlog", "in_progress", "review", "scheduled", "done", "archived"];

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const demoMode = isDemoModeEnabled();
  const [database, liveItems] = await Promise.all([
    checkDatabaseStatus(),
    listWorkflowItems(false).catch(() => []),
  ]);

  const workflowItems = liveItems.length > 0 ? liveItems : demoMode ? DEMO_WORKFLOW_ITEMS : [];

  const statusBreakdown = PROJECTS.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return adminJson({
    ok: true,
    demoMode,
    database,
    workflowItems,
    workflowIsDemo: workflowItems.some((w) => w.isDemo),
    portfolioSummary: {
      totalProjects: PROJECTS.length,
      statusBreakdown,
      recentProjects: PROJECTS.slice(0, 12).map((p) => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
        projectType: p.projectType,
        categories: p.categories,
        href: `/work/${p.slug}`,
      })),
      totalBlogPosts: BLOG_POSTS.length,
      blogPosts: BLOG_POSTS.map((post) => ({
        slug: post.slug,
        title: post.title,
        category: post.category,
        publishedAt: post.publishedAt,
        href: `/blog/${post.slug}`,
      })),
    },
  });
}

export async function POST(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  if (!isDatabaseConfigured()) {
    return adminJson(
      {
        ok: false,
        code: "database_not_configured",
        message: "Connect Neon PostgreSQL (DATABASE_URL) and run `npm run admin:migrate` to save workflow items.",
      },
      503,
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return adminJson({ ok: false, code: "bad_request", message: "Invalid JSON payload." }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
  const kind = ALLOWED_KINDS.includes(body.kind as WorkflowKind) ? (body.kind as WorkflowKind) : "ops_task";
  const status = ALLOWED_STATUSES.includes(body.status as WorkflowStatus) ? (body.status as WorkflowStatus) : "backlog";
  const linkedSlug = typeof body.linkedSlug === "string" ? body.linkedSlug.trim().slice(0, 120) : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim().slice(0, 32) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";

  if (!title) {
    return adminJson({ ok: false, code: "invalid", message: "Title is required." }, 422);
  }

  try {
    const item = await createWorkflowItem({ title, kind, status, linkedSlug, dueDate, notes });
    await recordAdminAudit(auth.session.sub, "workflow.create", item.id, "ok");
    return adminJson({ ok: true, item }, 201);
  } catch {
    return adminJson(
      { ok: false, code: "db_error", message: "Could not save workflow item. Ensure `npm run admin:migrate` has been run." },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  if (!isDatabaseConfigured()) {
    return adminJson({ ok: false, code: "database_not_configured", message: "Neon PostgreSQL is not configured." }, 503);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return adminJson({ ok: false, code: "bad_request", message: "Invalid JSON payload." }, 400);
  }

  const id = typeof body.id === "string" ? body.id.trim().slice(0, 64) : "";
  if (!id || id.startsWith("demo_")) {
    return adminJson({ ok: false, code: "demo_record", message: "Synthetic demo items cannot be edited." }, 400);
  }

  const patch: Parameters<typeof updateWorkflowItem>[1] = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 180);
  if (ALLOWED_KINDS.includes(body.kind as WorkflowKind)) patch.kind = body.kind as WorkflowKind;
  if (ALLOWED_STATUSES.includes(body.status as WorkflowStatus)) patch.status = body.status as WorkflowStatus;
  if (typeof body.linkedSlug === "string") patch.linkedSlug = body.linkedSlug.trim().slice(0, 120);
  if (typeof body.dueDate === "string") patch.dueDate = body.dueDate.trim().slice(0, 32);
  if (typeof body.notes === "string") patch.notes = body.notes.trim().slice(0, 2000);

  const updated = await updateWorkflowItem(id, patch);
  if (!updated) return adminJson({ ok: false, code: "not_found", message: "Workflow item not found." }, 404);

  await recordAdminAudit(auth.session.sub, "workflow.update", `${id}:${updated.status}`, "ok");
  return adminJson({ ok: true, item: updated });
}

import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import {
  checkTwentyStatus,
  createTwentyPersonSafe,
  createTwentyTask,
  loadTwentyWorkspace,
} from "@/lib/admin/adapters/twenty";
import { recordAdminAudit } from "@/lib/admin/db";
import {
  DEMO_TWENTY_COMPANIES,
  DEMO_TWENTY_OPPORTUNITIES,
  DEMO_TWENTY_PEOPLE,
  DEMO_TWENTY_TASKS,
} from "@/lib/admin/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const demoMode = isDemoModeEnabled();
  const [status, workspace] = await Promise.all([checkTwentyStatus(), loadTwentyWorkspace()]);

  if (workspace.ok) {
    return adminJson({
      ok: true,
      demoMode,
      status,
      syncedWithTwenty: true,
      people: workspace.people,
      companies: workspace.companies,
      opportunities: workspace.opportunities,
      tasks: workspace.tasks,
      isDemo: false,
    });
  }

  return adminJson({
    ok: true,
    demoMode,
    status,
    syncedWithTwenty: false,
    people: demoMode ? DEMO_TWENTY_PEOPLE : [],
    companies: demoMode ? DEMO_TWENTY_COMPANIES : [],
    opportunities: demoMode ? DEMO_TWENTY_OPPORTUNITIES : [],
    tasks: demoMode ? DEMO_TWENTY_TASKS : [],
    isDemo: demoMode,
  });
}

export async function POST(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return adminJson({ ok: false, code: "bad_request", message: "Invalid JSON payload." }, 400);
  }

  const action = typeof body.action === "string" ? body.action : "create_person";

  if (action === "create_person") {
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim().slice(0, 120) : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 120) : "";

    if (!firstName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return adminJson(
        { ok: false, code: "invalid", message: "First name and a valid email address are required." },
        422,
      );
    }

    const res = await createTwentyPersonSafe({ firstName, lastName, email, jobTitle, city });
    if (!res.ok) return adminJson({ ok: false, code: "provider_error", message: res.detail }, res.status);

    if (!res.created && res.duplicate) {
      await recordAdminAudit(auth.session.sub, "twenty.person.duplicate_prevented", email, "ok");
      return adminJson({
        ok: true,
        created: false,
        duplicate: true,
        message: "Contact already exists in Twenty CRM — skipped creating a duplicate record.",
        person: res.person,
      });
    }

    await recordAdminAudit(auth.session.sub, "twenty.person.create", email, "ok");
    return adminJson({ ok: true, created: true, duplicate: false, person: res.person }, 201);
  }

  if (action === "create_task") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const dueAt = typeof body.dueAt === "string" && body.dueAt.trim() ? body.dueAt.trim() : null;
    if (!title) {
      return adminJson({ ok: false, code: "invalid", message: "Task title is required." }, 422);
    }
    const res = await createTwentyTask({ title, dueAt });
    if (!res.ok) return adminJson({ ok: false, code: "provider_error", message: res.detail }, res.status);

    await recordAdminAudit(auth.session.sub, "twenty.task.create", title.slice(0, 60), "ok");
    return adminJson({ ok: true, task: res.task }, 201);
  }

  return adminJson({ ok: false, code: "bad_request", message: "Unknown CRM action." }, 400);
}

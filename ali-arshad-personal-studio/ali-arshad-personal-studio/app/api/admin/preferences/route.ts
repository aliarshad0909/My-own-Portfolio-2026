import { adminJson, requireAdminApi } from "@/lib/admin/auth";
import { isDatabaseConfigured, loadAdminPreferences, recordAdminAudit, saveAdminPreferences } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const preferences = await loadAdminPreferences();
  return adminJson({ ok: true, databaseConfigured: isDatabaseConfigured(), preferences });
}

export async function PUT(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  if (!isDatabaseConfigured()) {
    return adminJson(
      {
        ok: false,
        code: "database_not_configured",
        message: "Connect Neon PostgreSQL (DATABASE_URL) to persist studio console preferences.",
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

  const timezone = typeof body.timezone === "string" && body.timezone.trim() ? body.timezone.trim().slice(0, 64) : "Asia/Karachi";
  const compactMode = Boolean(body.compactMode);
  const defaultListmonkTimezone =
    typeof body.defaultListmonkTimezone === "string" && body.defaultListmonkTimezone.trim()
      ? body.defaultListmonkTimezone.trim().slice(0, 64)
      : "America/New_York";

  try {
    const saved = await saveAdminPreferences({ timezone, compactMode, defaultListmonkTimezone });
    await recordAdminAudit(auth.session.sub, "preferences.update", timezone, "ok");
    return adminJson({ ok: true, preferences: saved });
  } catch {
    return adminJson(
      { ok: false, code: "db_error", message: "Could not save preferences. Confirm `npm run admin:migrate` ran." },
      500,
    );
  }
}

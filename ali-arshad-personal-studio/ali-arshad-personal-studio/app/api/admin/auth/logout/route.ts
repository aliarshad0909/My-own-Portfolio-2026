import { ADMIN_SESSION_COOKIE, adminJson, requireAdminApi, sessionCookieOptions } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  await recordAdminAudit(auth.session.sub, "admin.logout", "session", "ok");

  const res = adminJson({ ok: true });
  res.cookies.set({
    ...sessionCookieOptions(request),
    name: ADMIN_SESSION_COOKIE,
    value: "",
    maxAge: 0,
  });
  return res;
}

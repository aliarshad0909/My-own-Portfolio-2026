import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: false });
  if (!auth.ok) return auth.response;

  return adminJson({
    ok: true,
    session: {
      email: auth.session.sub,
      csrfToken: auth.session.csrf,
      expiresAt: new Date(auth.session.exp * 1000).toISOString(),
      demoMode: isDemoModeEnabled(),
    },
  });
}

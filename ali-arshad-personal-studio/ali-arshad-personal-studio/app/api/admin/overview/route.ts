import { adminJson, requireAdminApi } from "@/lib/admin/auth";
import { collectAdminOverview } from "@/lib/admin/adapters/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const overview = await collectAdminOverview();
  return adminJson({ ok: true, ...overview });
}

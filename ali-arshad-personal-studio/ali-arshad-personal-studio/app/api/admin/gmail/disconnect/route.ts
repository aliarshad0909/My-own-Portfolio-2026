import { adminJson, requireAdminApi } from "@/lib/admin/auth";
import { disconnectGmailAccount } from "@/lib/admin/adapters/gmail";
import { recordAdminAudit } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  await disconnectGmailAccount();
  await recordAdminAudit(auth.session.sub, "gmail.oauth.disconnected", "primary", "ok");
  return adminJson({ ok: true });
}

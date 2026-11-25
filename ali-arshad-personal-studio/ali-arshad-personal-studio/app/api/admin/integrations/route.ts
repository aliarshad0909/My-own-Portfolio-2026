import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import { isGmailOAuthConfigured } from "@/lib/admin/adapters/gmail";
import { isListmonkLiveSendAllowed } from "@/lib/admin/adapters/listmonk";
import { collectIntegrationHealth } from "@/lib/admin/adapters/overview";
import { isPostizLivePublishAllowed } from "@/lib/admin/adapters/postiz";
import { isDatabaseConfigured, loadAdminPreferences } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const [health, preferences] = await Promise.all([collectIntegrationHealth(), loadAdminPreferences()]);

  return adminJson({
    ok: true,
    demoMode: isDemoModeEnabled(),
    integrations: health.integrations,
    platforms: health.platforms,
    gmail: {
      oauthConfigured: isGmailOAuthConfigured(),
      databaseReady: isDatabaseConfigured(),
      connectedEmail: health.gmailAccountEmail,
    },
    safetyGuards: {
      listmonkLiveSendAllowed: isListmonkLiveSendAllowed(),
      postizLivePublishAllowed: isPostizLivePublishAllowed(),
    },
    preferences,
  });
}

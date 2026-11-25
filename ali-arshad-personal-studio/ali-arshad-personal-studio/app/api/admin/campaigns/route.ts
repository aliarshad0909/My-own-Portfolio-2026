import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import {
  checkListmonkStatus,
  createListmonkDraft,
  dispatchListmonkCampaign,
  isListmonkLiveSendAllowed,
  listListmonkCampaigns,
  listListmonkLists,
  LISTMONK_CONFIRM_PHRASE,
  updateListmonkDraft,
} from "@/lib/admin/adapters/listmonk";
import { loadAdminPreferences, recordAdminAudit } from "@/lib/admin/db";
import { DEMO_LISTMONK_CAMPAIGNS, DEMO_LISTMONK_LISTS } from "@/lib/admin/demo-data";
import { adminRateLimit } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const demoMode = isDemoModeEnabled();
  const [status, listsRes, campaignsRes, prefs] = await Promise.all([
    checkListmonkStatus(),
    listListmonkLists(),
    listListmonkCampaigns(),
    loadAdminPreferences(),
  ]);

  const lists = listsRes.ok ? listsRes.lists : demoMode ? DEMO_LISTMONK_LISTS : [];
  const campaigns = campaignsRes.ok ? campaignsRes.campaigns : demoMode ? DEMO_LISTMONK_CAMPAIGNS : [];

  return adminJson({
    ok: true,
    demoMode,
    status,
    liveSendAllowed: isListmonkLiveSendAllowed(),
    confirmPhrase: LISTMONK_CONFIRM_PHRASE,
    defaultTimezone: prefs.defaultListmonkTimezone,
    lists,
    campaigns,
    isDemo: !listsRes.ok && demoMode,
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

  const action = typeof body.action === "string" ? body.action : "create_draft";

  if (action === "create_draft" || action === "update_draft") {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const htmlBody = typeof body.body === "string" ? body.body.slice(0, 60_000) : "";
    const listIds = Array.isArray(body.listIds)
      ? body.listIds.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const contentType =
      body.contentType === "html" || body.contentType === "markdown" || body.contentType === "plain"
        ? body.contentType
        : "richtext";
    const sendAt = typeof body.sendAt === "string" && body.sendAt.trim() ? body.sendAt.trim() : null;

    if (!name || !subject || !htmlBody || listIds.length === 0) {
      return adminJson(
        {
          ok: false,
          code: "invalid",
          message: "Campaign name, subject, body, and at least one subscriber list are required.",
        },
        422,
      );
    }

    if (action === "update_draft") {
      const campaignId = Number(body.campaignId ?? 0);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        return adminJson({ ok: false, code: "invalid", message: "Valid campaignId is required." }, 422);
      }
      const res = await updateListmonkDraft(campaignId, { name, subject, body: htmlBody, listIds, contentType, sendAt });
      if (!res.ok) return adminJson({ ok: false, code: "provider_error", message: res.detail }, res.status ?? 502);
      await recordAdminAudit(auth.session.sub, "listmonk.draft.update", `campaign:${campaignId}`, "ok");
      return adminJson({ ok: true, campaignId });
    }

    const res = await createListmonkDraft({ name, subject, body: htmlBody, listIds, contentType, sendAt });
    if (!res.ok) return adminJson({ ok: false, code: "provider_error", message: res.detail }, res.status ?? 502);
    await recordAdminAudit(auth.session.sub, "listmonk.draft.create", `campaign:${res.campaignId}`, "ok");
    return adminJson({ ok: true, campaignId: res.campaignId }, 201);
  }

  if (action === "dispatch") {
    const limited = await adminRateLimit(`admin-listmonk-dispatch:${auth.session.sub}`, 10, 15 * 60);
    if (!limited.allowed) {
      return adminJson(
        { ok: false, code: "rate_limited", message: "Outbound campaign rate limit reached. Wait a moment before retrying." },
        429,
        { "Retry-After": String(limited.retryAfter) },
      );
    }

    const campaignId = Number(body.campaignId ?? 0);
    const targetStatus = body.targetStatus === "running" ? "running" : "scheduled";
    const confirmOutbound = body.confirmOutbound === true;
    const confirmationPhrase = typeof body.confirmationPhrase === "string" ? body.confirmationPhrase : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return adminJson({ ok: false, code: "invalid", message: "Valid campaignId is required." }, 422);
    }

    const res = await dispatchListmonkCampaign({
      campaignId,
      targetStatus,
      confirmOutbound,
      confirmationPhrase,
      idempotencyKey,
    });
    if (!res.ok) {
      await recordAdminAudit(auth.session.sub, "listmonk.dispatch.blocked", `${campaignId}:${res.code}`, "error");
      return adminJson({ ok: false, code: res.code, message: res.detail }, res.status);
    }

    await recordAdminAudit(auth.session.sub, "listmonk.dispatch.ok", `${campaignId}:${targetStatus}`, "ok");
    return adminJson({ ok: true, campaignId, targetStatus });
  }

  return adminJson({ ok: false, code: "bad_request", message: "Unknown campaign action." }, 400);
}

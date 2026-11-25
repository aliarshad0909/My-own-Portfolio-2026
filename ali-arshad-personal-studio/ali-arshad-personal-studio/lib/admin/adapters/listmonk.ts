/**
 * Server-only adapter for self-hosted Listmonk (https://listmonk.app).
 * Supports listing subscriber lists & campaigns, creating/editing drafts, and
 * double-confirmed scheduling/sending guarded by BOTH explicit confirmation text
 * AND `LISTMONK_ALLOW_LIVE_SEND=true` so automated tests or dev sessions can never
 * trigger unintended outbound emails.
 */
import { envVar } from "@/lib/form-security";
import type { ListmonkCampaign, ListmonkList, ServiceHealthState } from "@/lib/admin/types";
import { claimIdempotencyKey, fetchJsonWithTimeout, safeServiceBaseUrl } from "@/lib/admin/adapters/http";

export const LISTMONK_CONFIRM_PHRASE = "CONFIRM SEND";

function listmonkConfig() {
  const urlRes = safeServiceBaseUrl("LISTMONK_URL", "Listmonk");
  if (!urlRes.ok) return urlRes;
  const user = envVar("LISTMONK_API_USER");
  const token = envVar("LISTMONK_API_TOKEN");
  if (!user || !token) {
    return {
      ok: false as const,
      state: "needs_setup" as const,
      detail: "LISTMONK_URL is set, but LISTMONK_API_USER and LISTMONK_API_TOKEN are required.",
    };
  }
  const authHeader = `Basic ${Buffer.from(`${user}:${token}`, "utf8").toString("base64")}`;
  return { ok: true as const, baseUrl: urlRes.baseUrl, host: urlRes.host, authHeader };
}

export function isListmonkLiveSendAllowed(): boolean {
  return envVar("LISTMONK_ALLOW_LIVE_SEND").toLowerCase() === "true";
}

export async function checkListmonkStatus(): Promise<{
  state: ServiceHealthState;
  detail: string;
  baseUrlHost?: string;
}> {
  const cfg = listmonkConfig();
  if (!cfg.ok) return { state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<{ data?: { total?: number } }>(
    `${cfg.baseUrl}/api/lists?page=1&per_page=1`,
    { headers: { Authorization: cfg.authHeader, Accept: "application/json" } },
  );
  if (!res.ok) {
    return { state: res.state, detail: res.detail, baseUrlHost: cfg.host };
  }
  const total = Number(res.data?.data?.total ?? 0);
  const liveNote = isListmonkLiveSendAllowed()
    ? "Live send enabled (confirmation required)."
    : "Draft-only safety mode (set LISTMONK_ALLOW_LIVE_SEND=true to allow live sends).";
  return {
    state: "connected",
    detail: `Listmonk connected (${total} list${total === 1 ? "" : "s"}). ${liveNote}`,
    baseUrlHost: cfg.host,
  };
}

export async function listListmonkLists(): Promise<
  { ok: true; lists: ListmonkList[]; host: string } | { ok: false; state: ServiceHealthState; detail: string }
> {
  const cfg = listmonkConfig();
  if (!cfg.ok) return { ok: false, state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<{
    data?: { results?: Array<Record<string, unknown>> };
  }>(`${cfg.baseUrl}/api/lists?page=1&per_page=100`, {
    headers: { Authorization: cfg.authHeader, Accept: "application/json" },
  });
  if (!res.ok) return { ok: false, state: res.state, detail: res.detail };

  const results = res.data?.data?.results ?? [];
  const lists: ListmonkList[] = results.map((item) => ({
    id: Number(item.id ?? 0),
    name: String(item.name ?? "Untitled list"),
    type: String(item.type ?? "private"),
    subscriberCount: Number(item.subscriber_count ?? 0),
  }));
  return { ok: true, lists, host: cfg.host };
}

export async function listListmonkCampaigns(): Promise<
  { ok: true; campaigns: ListmonkCampaign[]; host: string } | { ok: false; state: ServiceHealthState; detail: string }
> {
  const cfg = listmonkConfig();
  if (!cfg.ok) return { ok: false, state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<{
    data?: { results?: Array<Record<string, unknown>> };
  }>(`${cfg.baseUrl}/api/campaigns?page=1&per_page=50&order_by=created_at&order=DESC`, {
    headers: { Authorization: cfg.authHeader, Accept: "application/json" },
  });
  if (!res.ok) return { ok: false, state: res.state, detail: res.detail };

  const results = res.data?.data?.results ?? [];
  const campaigns: ListmonkCampaign[] = results.map((c) => {
    const rawLists = Array.isArray(c.lists) ? (c.lists as Array<Record<string, unknown>>) : [];
    return {
      id: Number(c.id ?? 0),
      name: String(c.name ?? "Untitled campaign"),
      subject: String(c.subject ?? ""),
      status: String(c.status ?? "draft"),
      contentType: String(c.content_type ?? "richtext"),
      lists: rawLists.map((l) => ({ id: Number(l.id ?? 0), name: String(l.name ?? `List #${l.id}`) })),
      sendAt: c.send_at ? String(c.send_at) : null,
      createdAt: String(c.created_at ?? new Date().toISOString()),
      views: Number(c.views ?? 0),
      clicks: Number(c.clicks ?? 0),
      sent: Number(c.sent ?? 0),
      body: typeof c.body === "string" ? c.body : undefined,
    };
  });
  return { ok: true, campaigns, host: cfg.host };
}

export type ListmonkDraftInput = {
  name: string;
  subject: string;
  body: string;
  listIds: number[];
  contentType?: "richtext" | "html" | "markdown" | "plain";
  sendAt?: string | null;
};

export async function createListmonkDraft(
  input: ListmonkDraftInput,
): Promise<{ ok: true; campaignId: number } | { ok: false; detail: string; status?: number }> {
  const cfg = listmonkConfig();
  if (!cfg.ok) return { ok: false, detail: cfg.detail, status: 503 };

  const res = await fetchJsonWithTimeout<{ data?: { id?: number } }>(`${cfg.baseUrl}/api/campaigns`, {
    method: "POST",
    headers: {
      Authorization: cfg.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      subject: input.subject.trim(),
      lists: input.listIds,
      type: "regular",
      content_type: input.contentType ?? "richtext",
      body: input.body,
      ...(input.sendAt ? { send_at: input.sendAt } : {}),
    }),
  });
  if (!res.ok) return { ok: false, detail: res.detail, status: res.status ?? 502 };
  return { ok: true, campaignId: Number(res.data?.data?.id ?? 0) };
}

export async function updateListmonkDraft(
  campaignId: number,
  input: ListmonkDraftInput,
): Promise<{ ok: true } | { ok: false; detail: string; status?: number }> {
  const cfg = listmonkConfig();
  if (!cfg.ok) return { ok: false, detail: cfg.detail, status: 503 };

  const res = await fetchJsonWithTimeout(`${cfg.baseUrl}/api/campaigns/${campaignId}`, {
    method: "PUT",
    headers: {
      Authorization: cfg.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      subject: input.subject.trim(),
      lists: input.listIds,
      type: "regular",
      content_type: input.contentType ?? "richtext",
      body: input.body,
      ...(input.sendAt ? { send_at: input.sendAt } : {}),
    }),
  });
  if (!res.ok) return { ok: false, detail: res.detail, status: res.status ?? 502 };
  return { ok: true };
}

export type ListmonkDispatchInput = {
  campaignId: number;
  targetStatus: "scheduled" | "running";
  confirmOutbound: boolean;
  confirmationPhrase: string;
  idempotencyKey: string;
};

/**
 * Strictly gated outbound campaign dispatch.
 * Refuses to execute unless:
 *  1) `confirmOutbound === true` AND `confirmationPhrase === "CONFIRM SEND"`
 *  2) Server env `LISTMONK_ALLOW_LIVE_SEND=true`
 *  3) Unique `idempotencyKey` not already dispatched recently
 */
export async function dispatchListmonkCampaign(
  input: ListmonkDispatchInput,
): Promise<{ ok: true } | { ok: false; code: string; detail: string; status: number }> {
  if (!input.confirmOutbound || input.confirmationPhrase.trim() !== LISTMONK_CONFIRM_PHRASE) {
    return {
      ok: false,
      code: "confirmation_required",
      detail: `Explicit confirmation is required before scheduling or sending. Enter "${LISTMONK_CONFIRM_PHRASE}" on the review step.`,
      status: 400,
    };
  }

  if (!isListmonkLiveSendAllowed()) {
    return {
      ok: false,
      code: "live_send_disabled",
      detail:
        "Live campaign sending is locked on this environment for safety. Set LISTMONK_ALLOW_LIVE_SEND=true on your production deployment to enable live dispatch.",
      status: 403,
    };
  }

  if (!claimIdempotencyKey("listmonk-dispatch", input.idempotencyKey)) {
    return {
      ok: false,
      code: "duplicate_request",
      detail: "This dispatch request was already submitted or is missing an idempotency key.",
      status: 409,
    };
  }

  const cfg = listmonkConfig();
  if (!cfg.ok) {
    return { ok: false, code: "not_configured", detail: cfg.detail, status: 503 };
  }

  const res = await fetchJsonWithTimeout(`${cfg.baseUrl}/api/campaigns/${input.campaignId}/status`, {
    method: "PUT",
    headers: {
      Authorization: cfg.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: input.targetStatus }),
  });

  if (!res.ok) {
    return { ok: false, code: "provider_error", detail: res.detail, status: res.status ?? 502 };
  }
  return { ok: true };
}

/**
 * Server-only adapter for self-hosted Postiz (https://postiz.com).
 * Manages connected social channels, drafts, scheduled queue, and double-confirmed publishing
 * guarded by BOTH explicit confirmation text (`CONFIRM PUBLISH`) AND `POSTIZ_ALLOW_LIVE_PUBLISH=true`.
 */
import { envVar } from "@/lib/form-security";
import type { PostizChannel, PostizPost, ServiceHealthState } from "@/lib/admin/types";
import { claimIdempotencyKey, fetchJsonWithTimeout, safeServiceBaseUrl } from "@/lib/admin/adapters/http";

export const POSTIZ_CONFIRM_PHRASE = "CONFIRM PUBLISH";

function postizConfig() {
  const urlRes = safeServiceBaseUrl("POSTIZ_URL", "Postiz");
  if (!urlRes.ok) return urlRes;
  const apiKey = envVar("POSTIZ_API_KEY");
  if (!apiKey) {
    return {
      ok: false as const,
      state: "needs_setup" as const,
      detail: "POSTIZ_URL is set, but POSTIZ_API_KEY is missing.",
    };
  }
  const apiBase = urlRes.baseUrl.endsWith("/api/public/v1")
    ? urlRes.baseUrl
    : `${urlRes.baseUrl}/api/public/v1`;
  return { ok: true as const, apiBase, host: urlRes.host, apiKey };
}

export function isPostizLivePublishAllowed(): boolean {
  return envVar("POSTIZ_ALLOW_LIVE_PUBLISH").toLowerCase() === "true";
}

export async function checkPostizStatus(): Promise<{
  state: ServiceHealthState;
  detail: string;
  baseUrlHost?: string;
}> {
  const cfg = postizConfig();
  if (!cfg.ok) return { state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<unknown>(`${cfg.apiBase}/integrations`, {
    headers: { Authorization: cfg.apiKey, Accept: "application/json" },
  });
  if (!res.ok) return { state: res.state, detail: res.detail, baseUrlHost: cfg.host };

  const list = Array.isArray(res.data) ? res.data : [];
  const liveNote = isPostizLivePublishAllowed()
    ? "Live publishing enabled (confirmation required)."
    : "Draft-only safety mode (set POSTIZ_ALLOW_LIVE_PUBLISH=true for live publish/schedule).";
  return {
    state: "connected",
    detail: `Postiz connected (${list.length} connected channel${list.length === 1 ? "" : "s"}). ${liveNote}`,
    baseUrlHost: cfg.host,
  };
}

export async function listPostizChannels(): Promise<
  { ok: true; channels: PostizChannel[]; host: string } | { ok: false; state: ServiceHealthState; detail: string }
> {
  const cfg = postizConfig();
  if (!cfg.ok) return { ok: false, state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<Array<Record<string, unknown>>>(`${cfg.apiBase}/integrations`, {
    headers: { Authorization: cfg.apiKey, Accept: "application/json" },
  });
  if (!res.ok) return { ok: false, state: res.state, detail: res.detail };

  const raw = Array.isArray(res.data) ? res.data : [];
  const channels: PostizChannel[] = raw.map((ch) => ({
    id: String(ch.id ?? ""),
    name: String(ch.name ?? ch.profile ?? "Connected Channel"),
    provider: String(ch.identifier ?? ch.providerIdentifier ?? ch.type ?? "social").toLowerCase(),
    picture: typeof ch.picture === "string" ? ch.picture : undefined,
    disabled: Boolean(ch.disabled),
  }));
  return { ok: true, channels, host: cfg.host };
}

export async function listPostizPosts(): Promise<
  { ok: true; posts: PostizPost[]; host: string } | { ok: false; state: ServiceHealthState; detail: string }
> {
  const cfg = postizConfig();
  if (!cfg.ok) return { ok: false, state: cfg.state, detail: cfg.detail };

  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({ startDate: start, endDate: end }).toString();

  const res = await fetchJsonWithTimeout<{ posts?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
    `${cfg.apiBase}/posts?${query}`,
    { headers: { Authorization: cfg.apiKey, Accept: "application/json" } },
  );
  if (!res.ok) return { ok: false, state: res.state, detail: res.detail };

  const rawList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.posts) ? res.data.posts : [];
  const posts: PostizPost[] = rawList.map((p) => {
    const integration = (p.integration ?? {}) as Record<string, unknown>;
    return {
      id: String(p.id ?? ""),
      content: String(p.content ?? ""),
      state: String(p.state ?? "DRAFT"),
      publishDate: p.publishDate ? String(p.publishDate) : null,
      channelId: String(integration.id ?? p.integrationId ?? ""),
      channelName: String(integration.name ?? "Channel"),
      provider: String(integration.providerIdentifier ?? integration.identifier ?? "social").toLowerCase(),
      releaseUrl: typeof p.releaseURL === "string" ? p.releaseURL : undefined,
    };
  });
  return { ok: true, posts, host: cfg.host };
}

export type PostizCreateInput = {
  mode: "draft" | "schedule" | "now";
  content: string;
  channels: { id: string; provider: string }[];
  publishDate?: string;
  confirmOutbound?: boolean;
  confirmationPhrase?: string;
  idempotencyKey?: string;
};

/**
 * Create a draft freely, or schedule/publish live strictly behind explicit user confirmation,
 * `POSTIZ_ALLOW_LIVE_PUBLISH=true`, and idempotency checking.
 */
export async function createPostizPost(
  input: PostizCreateInput,
): Promise<{ ok: true; created: unknown } | { ok: false; code: string; detail: string; status: number }> {
  const isOutbound = input.mode === "schedule" || input.mode === "now";

  if (isOutbound) {
    if (!input.confirmOutbound || (input.confirmationPhrase ?? "").trim() !== POSTIZ_CONFIRM_PHRASE) {
      return {
        ok: false,
        code: "confirmation_required",
        detail: `Explicit review confirmation is required before scheduling or publishing. Type "${POSTIZ_CONFIRM_PHRASE}".`,
        status: 400,
      };
    }
    if (!isPostizLivePublishAllowed()) {
      return {
        ok: false,
        code: "live_publish_disabled",
        detail:
          "Live social publishing is locked on this environment for safety. Save as draft now, or set POSTIZ_ALLOW_LIVE_PUBLISH=true when ready for production.",
        status: 403,
      };
    }
    if (!claimIdempotencyKey("postiz-publish", input.idempotencyKey ?? "")) {
      return {
        ok: false,
        code: "duplicate_request",
        detail: "This publish/schedule request was already submitted or is missing an idempotency key.",
        status: 409,
      };
    }
  }

  const cfg = postizConfig();
  if (!cfg.ok) {
    return { ok: false, code: "not_configured", detail: cfg.detail, status: 503 };
  }

  const dateIso =
    input.mode === "schedule" && input.publishDate
      ? new Date(input.publishDate).toISOString()
      : new Date().toISOString();

  const payload = {
    type: input.mode,
    date: dateIso,
    shortLink: false,
    tags: [],
    posts: input.channels.map((ch) => ({
      integration: { id: ch.id },
      value: [{ content: input.content.trim(), image: [] }],
      settings: { __type: ch.provider },
    })),
  };

  const res = await fetchJsonWithTimeout<unknown>(`${cfg.apiBase}/posts`, {
    method: "POST",
    headers: {
      Authorization: cfg.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, code: "provider_error", detail: res.detail, status: res.status ?? 502 };
  }
  return { ok: true, created: res.data };
}

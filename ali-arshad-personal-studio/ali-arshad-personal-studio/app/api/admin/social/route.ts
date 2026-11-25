import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import {
  checkPostizStatus,
  createPostizPost,
  isPostizLivePublishAllowed,
  listPostizChannels,
  listPostizPosts,
  POSTIZ_CONFIRM_PHRASE,
} from "@/lib/admin/adapters/postiz";
import { buildPlatformCards, checkGitHubStatus } from "@/lib/admin/adapters/platforms";
import { recordAdminAudit } from "@/lib/admin/db";
import { DEMO_POSTIZ_CHANNELS, DEMO_POSTIZ_POSTS } from "@/lib/admin/demo-data";
import { adminRateLimit } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const demoMode = isDemoModeEnabled();
  const [status, channelsRes, postsRes, github] = await Promise.all([
    checkPostizStatus(),
    listPostizChannels(),
    listPostizPosts(),
    checkGitHubStatus(),
  ]);

  const channels = channelsRes.ok ? channelsRes.channels : demoMode ? DEMO_POSTIZ_CHANNELS : [];
  const posts = postsRes.ok ? postsRes.posts : demoMode ? DEMO_POSTIZ_POSTS : [];
  const platforms = buildPlatformCards(channelsRes.ok ? channelsRes.channels : [], github);

  return adminJson({
    ok: true,
    demoMode,
    status,
    livePublishAllowed: isPostizLivePublishAllowed(),
    confirmPhrase: POSTIZ_CONFIRM_PHRASE,
    channels,
    posts,
    platforms,
    isDemo: !channelsRes.ok && demoMode,
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

  const mode = body.mode === "schedule" || body.mode === "now" ? body.mode : "draft";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 5000) : "";
  const publishDate = typeof body.publishDate === "string" ? body.publishDate.trim() : undefined;
  const rawChannels = Array.isArray(body.channels) ? body.channels : [];
  const channels = rawChannels
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const rec = c as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id.trim() : "";
      const provider = typeof rec.provider === "string" ? rec.provider.trim() : "social";
      return id ? { id, provider } : null;
    })
    .filter((c): c is { id: string; provider: string } => c !== null);

  if (!content || channels.length === 0) {
    return adminJson(
      { ok: false, code: "invalid", message: "Post content and at least one connected channel are required." },
      422,
    );
  }

  if (mode === "schedule" && (!publishDate || Number.isNaN(Date.parse(publishDate)))) {
    return adminJson(
      { ok: false, code: "invalid", message: "A valid scheduled publish date/time is required." },
      422,
    );
  }

  if (mode !== "draft") {
    const limited = await adminRateLimit(`admin-postiz-publish:${auth.session.sub}`, 10, 15 * 60);
    if (!limited.allowed) {
      return adminJson(
        { ok: false, code: "rate_limited", message: "Outbound social publishing rate limit reached." },
        429,
        { "Retry-After": String(limited.retryAfter) },
      );
    }
  }

  const res = await createPostizPost({
    mode,
    content,
    channels,
    publishDate,
    confirmOutbound: body.confirmOutbound === true,
    confirmationPhrase: typeof body.confirmationPhrase === "string" ? body.confirmationPhrase : "",
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : "",
  });

  if (!res.ok) {
    await recordAdminAudit(auth.session.sub, `postiz.${mode}.blocked`, res.code, "error");
    return adminJson({ ok: false, code: res.code, message: res.detail }, res.status);
  }

  await recordAdminAudit(auth.session.sub, `postiz.${mode}.ok`, `channels:${channels.length}`, "ok");
  return adminJson({ ok: true, mode, created: res.created }, 201);
}

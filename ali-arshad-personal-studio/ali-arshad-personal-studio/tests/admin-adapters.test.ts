import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { resetIdempotencyKeysForTests } from "@/lib/admin/adapters/http";
import {
  checkListmonkStatus,
  createListmonkDraft,
  dispatchListmonkCampaign,
  LISTMONK_CONFIRM_PHRASE,
} from "@/lib/admin/adapters/listmonk";
import {
  checkPostizStatus,
  createPostizPost,
  POSTIZ_CONFIRM_PHRASE,
} from "@/lib/admin/adapters/postiz";
import {
  checkTwentyStatus,
  createTwentyPersonSafe,
  loadTwentyWorkspace,
} from "@/lib/admin/adapters/twenty";
import { buildGmailAuthUrl, checkGmailStatus } from "@/lib/admin/adapters/gmail";
import { buildPlatformCards, checkGitHubStatus } from "@/lib/admin/adapters/platforms";

const SAVED_ENV = { ...process.env };
const SAVED_FETCH = globalThis.fetch;

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in SAVED_ENV)) delete process.env[key];
  }
  Object.assign(process.env, SAVED_ENV);
  globalThis.fetch = SAVED_FETCH;
  resetIdempotencyKeysForTests();
});

describe("Listmonk adapter & outbound send safety gates", () => {
  it("reports needs_setup when env vars are missing and hides secrets on 401/offline", async () => {
    delete process.env.LISTMONK_URL;
    const unconfigured = await checkListmonkStatus();
    assert.equal(unconfigured.state, "needs_setup");

    process.env.LISTMONK_URL = "https://mail.studio.test";
    process.env.LISTMONK_API_USER = "api-user";
    process.env.LISTMONK_API_TOKEN = "super-secret-listmonk-token";

    globalThis.fetch = (async () => new Response("Unauthorized", { status: 401 })) as typeof fetch;
    const unauthorized = await checkListmonkStatus();
    assert.equal(unauthorized.state, "error");
    assert.equal(unauthorized.detail.includes("super-secret-listmonk-token"), false);

    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const offline = await checkListmonkStatus();
    assert.equal(offline.state, "offline");
  });

  it("blocks outbound campaign dispatch unless confirmation phrase, env gate, and unique key all pass", async () => {
    process.env.LISTMONK_URL = "https://mail.studio.test";
    process.env.LISTMONK_API_USER = "api-user";
    process.env.LISTMONK_API_TOKEN = "secret-token";
    delete process.env.LISTMONK_ALLOW_LIVE_SEND;

    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ data: { id: 42 } }), { status: 200 });
    }) as typeof fetch;

    // 1. Draft creation succeeds safely
    const draft = await createListmonkDraft({
      name: "Test Draft",
      subject: "Subject",
      body: "<p>Hello</p>",
      listIds: [1],
    });
    assert.equal(draft.ok, true);
    assert.equal(fetchCalls, 1);

    // 2. Dispatch blocked when confirmation phrase missing
    const noConfirm = await dispatchListmonkCampaign({
      campaignId: 42,
      targetStatus: "running",
      confirmOutbound: true,
      confirmationPhrase: "wrong",
      idempotencyKey: "key-1",
    });
    assert.equal(noConfirm.ok, false);
    assert.equal(noConfirm.code, "confirmation_required");
    assert.equal(fetchCalls, 1, "must NOT hit remote API before confirmation");

    // 3. Dispatch blocked when LISTMONK_ALLOW_LIVE_SEND is not true
    const locked = await dispatchListmonkCampaign({
      campaignId: 42,
      targetStatus: "running",
      confirmOutbound: true,
      confirmationPhrase: LISTMONK_CONFIRM_PHRASE,
      idempotencyKey: "key-2",
    });
    assert.equal(locked.ok, false);
    assert.equal(locked.code, "live_send_disabled");
    assert.equal(fetchCalls, 1, "must NOT hit remote API while live send is locked");

    // 4. Enable live send: first dispatch succeeds, duplicate idempotency key is rejected
    process.env.LISTMONK_ALLOW_LIVE_SEND = "true";
    const allowed = await dispatchListmonkCampaign({
      campaignId: 42,
      targetStatus: "scheduled",
      confirmOutbound: true,
      confirmationPhrase: LISTMONK_CONFIRM_PHRASE,
      idempotencyKey: "key-3",
    });
    assert.equal(allowed.ok, true);
    assert.equal(fetchCalls, 2);

    const dup = await dispatchListmonkCampaign({
      campaignId: 42,
      targetStatus: "scheduled",
      confirmOutbound: true,
      confirmationPhrase: LISTMONK_CONFIRM_PHRASE,
      idempotencyKey: "key-3",
    });
    assert.equal(dup.ok, false);
    assert.equal(dup.code, "duplicate_request");
    assert.equal(fetchCalls, 2);
  });
});

describe("Postiz adapter & outbound publish safety gates", () => {
  it("allows drafts when connected but strictly gates schedule/now behind confirmation and env lock", async () => {
    delete process.env.POSTIZ_URL;
    assert.equal((await checkPostizStatus()).state, "needs_setup");

    process.env.POSTIZ_URL = "https://social.studio.test";
    process.env.POSTIZ_API_KEY = "postiz-secret-key";
    delete process.env.POSTIZ_ALLOW_LIVE_PUBLISH;

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify([{ id: "ch_1", name: "LinkedIn", identifier: "linkedin" }]), { status: 200 });
    }) as typeof fetch;

    const status = await checkPostizStatus();
    assert.equal(status.state, "connected");

    const draft = await createPostizPost({
      mode: "draft",
      content: "Draft social post",
      channels: [{ id: "ch_1", provider: "linkedin" }],
    });
    assert.equal(draft.ok, true);
    assert.equal(calls, 2);

    const blockedNoPhrase = await createPostizPost({
      mode: "now",
      content: "Live post",
      channels: [{ id: "ch_1", provider: "linkedin" }],
      confirmOutbound: false,
    });
    assert.equal(blockedNoPhrase.ok, false);
    assert.equal(blockedNoPhrase.code, "confirmation_required");
    assert.equal(calls, 2);

    const blockedLocked = await createPostizPost({
      mode: "schedule",
      content: "Scheduled post",
      publishDate: "2026-12-01T10:00:00Z",
      channels: [{ id: "ch_1", provider: "linkedin" }],
      confirmOutbound: true,
      confirmationPhrase: POSTIZ_CONFIRM_PHRASE,
      idempotencyKey: "pz-1",
    });
    assert.equal(blockedLocked.ok, false);
    assert.equal(blockedLocked.code, "live_publish_disabled");
    assert.equal(calls, 2);

    process.env.POSTIZ_ALLOW_LIVE_PUBLISH = "true";
    const allowed = await createPostizPost({
      mode: "schedule",
      content: "Scheduled post",
      publishDate: "2026-12-01T10:00:00Z",
      channels: [{ id: "ch_1", provider: "linkedin" }],
      confirmOutbound: true,
      confirmationPhrase: POSTIZ_CONFIRM_PHRASE,
      idempotencyKey: "pz-2",
    });
    assert.equal(allowed.ok, true);
    assert.equal(calls, 3);
  });
});

describe("Twenty CRM adapter — live sync & duplicate-safe creation", () => {
  it("loads synced entities and prevents silent duplicate contacts by email", async () => {
    delete process.env.TWENTY_URL;
    assert.equal((await checkTwentyStatus()).state, "needs_setup");

    process.env.TWENTY_URL = "https://crm.studio.test";
    process.env.TWENTY_API_KEY = "twenty-secret-token";

    let postCalls = 0;
    globalThis.fetch = (async (url, init) => {
      const urlStr = String(url);
      if (init?.method === "POST") {
        postCalls += 1;
        return new Response(
          JSON.stringify({
            data: {
              createPerson: {
                id: "p_new",
                name: { firstName: "New", lastName: "Lead" },
                emails: { primaryEmail: "new@client.test" },
              },
            },
          }),
          { status: 201 },
        );
      }
      if (urlStr.includes("existing%40client.test")) {
        return new Response(
          JSON.stringify({
            data: {
              people: [
                {
                  id: "p_existing",
                  name: { firstName: "Existing", lastName: "Client" },
                  emails: { primaryEmail: "existing@client.test" },
                },
              ],
            },
          }),
          { status: 200 },
        );
      }
      if (urlStr.includes("/people")) {
        return new Response(
          JSON.stringify({
            data: {
              people: [
                {
                  id: "p_1",
                  name: { firstName: "Ali", lastName: "Test" },
                  emails: { primaryEmail: "ali@test.invalid" },
                },
              ],
            },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ data: { companies: [], opportunities: [], tasks: [] } }), { status: 200 });
    }) as typeof fetch;

    const ws = await loadTwentyWorkspace();
    assert.equal(ws.ok, true);
    assert.equal(ws.people[0].source, "twenty");

    const dupResult = await createTwentyPersonSafe({
      firstName: "Existing",
      lastName: "Client",
      email: "EXISTING@client.test",
    });
    assert.equal(dupResult.ok, true);
    assert.equal(dupResult.created, false);
    assert.equal(postCalls, 0, "must not POST duplicate contact when email already exists");

    const newResult = await createTwentyPersonSafe({
      firstName: "New",
      lastName: "Lead",
      email: "new@client.test",
    });
    assert.equal(newResult.ok, true);
    assert.equal(newResult.created, true);
    assert.equal(postCalls, 1);
  });
});

describe("Gmail OAuth & Platform boundary cards", () => {
  it("builds least-privilege gmail.readonly OAuth URL and reports unconfigured cleanly", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal((await checkGmailStatus()).state, "needs_setup");

    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    const authUrl = new URL(buildGmailAuthUrl("csrf-state-123", "https://www.aliarshad.co"));
    assert.equal(authUrl.origin, "https://accounts.google.com");
    assert.equal(authUrl.searchParams.get("state"), "csrf-state-123");
    assert.equal(authUrl.searchParams.get("access_type"), "offline");
    assert.ok((authUrl.searchParams.get("scope") ?? "").includes("gmail.readonly"));
    assert.equal(authUrl.searchParams.get("redirect_uri"), "https://www.aliarshad.co/api/admin/gmail/callback");
  });

  it("reports GitHub status and honest platform cards for Instagram, LinkedIn, Facebook, Upwork, GitHub", async () => {
    delete process.env.GITHUB_USERNAME;
    const ghUnconfigured = await checkGitHubStatus();
    assert.equal(ghUnconfigured.state, "needs_setup");

    process.env.GITHUB_USERNAME = "aliarshad0909";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ html_url: "https://github.com/aliarshad0909", public_repos: 12 }), {
        status: 200,
      })) as typeof fetch;

    const gh = await checkGitHubStatus();
    assert.equal(gh.state, "connected");
    assert.equal(gh.publicRepos, 12);

    const cards = buildPlatformCards([{ id: "ch_li", name: "Ali LinkedIn", provider: "linkedin" }], gh);
    assert.deepEqual(
      cards.map((c) => c.id),
      ["instagram", "linkedin", "facebook", "upwork", "github"],
    );
    assert.equal(cards.find((c) => c.id === "linkedin")?.connectionState, "connected");
    assert.equal(cards.find((c) => c.id === "instagram")?.connectionState, "needs_setup");
    assert.equal(cards.find((c) => c.id === "upwork")?.connectionState, "needs_setup");
  });
});

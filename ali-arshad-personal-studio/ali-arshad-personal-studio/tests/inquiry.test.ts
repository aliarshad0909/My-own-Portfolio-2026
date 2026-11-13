import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { BUDGET_OPTIONS, LIMITS, SERVICE_OPTIONS, TIMELINE_OPTIONS, normaliseInquiry, validateInquiry, type InquiryInput } from "@/lib/inquiry";
import { deliverInquiry, deliveryChannels, isDeliveryConfigured } from "@/lib/inquiry-server";
import { rateLimit } from "@/lib/rate-limit";
import { SERVICES } from "@/lib/services";

const VALID: InquiryInput = {
  name: "Test Person",
  email: "test@example.com",
  company: "Example Ltd",
  service: SERVICE_OPTIONS[0],
  description: "A short but sufficiently detailed description of a project.",
  budget: BUDGET_OPTIONS[1],
  timeline: TIMELINE_OPTIONS[1],
  consent: true,
};

describe("inquiry validation", () => {
  it("accepts a complete, well-formed inquiry", () => {
    assert.deepEqual(validateInquiry(VALID), {});
  });

  it("requires name, email, service, description and consent", () => {
    const errors = validateInquiry({ ...VALID, name: "", email: "", service: "", description: "", consent: false });
    assert.deepEqual(Object.keys(errors).sort(), ["consent", "description", "email", "name", "service"]);
  });

  it("rejects malformed email addresses but accepts ordinary ones", () => {
    for (const bad of ["notanemail", "a@b", "a@b.c", "a b@c.com", "@x.com"]) {
      assert.ok(validateInquiry({ ...VALID, email: bad }).email, `should reject "${bad}"`);
    }
    for (const good of ["name@company.com", "first.last+tag@sub.domain.co.uk"]) {
      assert.equal(validateInquiry({ ...VALID, email: good }).email, undefined, `should accept "${good}"`);
    }
  });

  it("enforces the description minimum and maximum", () => {
    assert.match(validateInquiry({ ...VALID, description: "too short" }).description ?? "", /at least/);
    assert.match(validateInquiry({ ...VALID, description: "x".repeat(LIMITS.description + 1) }).description ?? "", /under/);
  });

  it("only accepts a service, budget and timeline from the published lists", () => {
    assert.ok(validateInquiry({ ...VALID, service: "Something else" }).service);
    assert.ok(validateInquiry({ ...VALID, budget: "£1" }).budget);
    assert.ok(validateInquiry({ ...VALID, timeline: "yesterday" }).timeline);
  });

  it("treats budget and timeline as optional", () => {
    assert.deepEqual(validateInquiry({ ...VALID, budget: "", timeline: "" }), {});
  });

  it("the service list is derived from the services data, so the two cannot drift", () => {
    for (const s of SERVICES) assert.ok(SERVICE_OPTIONS.includes(s.title), s.title);
    assert.equal(SERVICE_OPTIONS.at(-1), "Not sure yet");
  });
});

describe("inquiry normalisation", () => {
  it("trims strings, lowercases email and coerces consent", () => {
    const n = normaliseInquiry({ name: "  Ali  ", email: " Test@Example.COM ", consent: "on", description: 42 });
    assert.equal(n.name, "Ali");
    assert.equal(n.email, "test@example.com");
    assert.equal(n.consent, true);
    assert.equal(n.description, "", "a non-string becomes empty rather than being stringified");
  });

  it("never trusts a non-boolean consent", () => {
    assert.equal(normaliseInquiry({ consent: "yes" }).consent, false);
    assert.equal(normaliseInquiry({ consent: 1 }).consent, false);
    assert.equal(normaliseInquiry({ consent: true }).consent, true);
  });
});

describe("delivery configuration", () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ["INQUIRY_WEBHOOK_URL", "INQUIRY_WEBHOOK_SECRET", "RESEND_API_KEY", "INQUIRY_TO_EMAIL", "INQUIRY_FROM_EMAIL"];
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("reports no channel when nothing is configured — the default in this repository", () => {
    assert.deepEqual(deliveryChannels(), { webhook: false, email: false });
    assert.equal(isDeliveryConfigured(), false);
  });

  it("email needs all three Resend variables, not just the key", () => {
    process.env.RESEND_API_KEY = "re_test";
    assert.equal(deliveryChannels().email, false);
    process.env.INQUIRY_TO_EMAIL = "in@example.com";
    assert.equal(deliveryChannels().email, false);
    process.env.INQUIRY_FROM_EMAIL = "Studio <studio@example.com>";
    assert.equal(deliveryChannels().email, true);
  });

  it("a whitespace-only value does not count as configured", () => {
    process.env.INQUIRY_WEBHOOK_URL = "   ";
    assert.equal(isDeliveryConfigured(), false);
  });
});

describe("delivery", () => {
  const realFetch = globalThis.fetch;
  const saved: Record<string, string | undefined> = {};
  const KEYS = ["INQUIRY_WEBHOOK_URL", "INQUIRY_WEBHOOK_SECRET", "RESEND_API_KEY", "INQUIRY_TO_EMAIL", "INQUIRY_FROM_EMAIL"];
  let calls: { url: string; init: RequestInit }[] = [];

  beforeEach(() => {
    calls = [];
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  const stubFetch = (respond: (url: string) => Response | Promise<Response>) => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      calls.push({ url, init: init ?? {} });
      return respond(url);
    }) as typeof fetch;
  };

  it("posts the inquiry to the webhook with the shared secret header", async () => {
    process.env.INQUIRY_WEBHOOK_URL = "https://hooks.example.test/inquiry";
    process.env.INQUIRY_WEBHOOK_SECRET = "s3cret";
    stubFetch(() => new Response("ok", { status: 200 }));

    const result = await deliverInquiry(VALID);
    assert.equal(result.delivered, true);
    assert.deepEqual(result.failures, []);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://hooks.example.test/inquiry");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers["x-inquiry-secret"], "s3cret");
    const body = JSON.parse(String(calls[0].init.body));
    assert.equal(body.source, "ali-arshad-studio");
    assert.equal(body.inquiry.email, VALID.email);
    assert.match(body.receivedAt, /^\d{4}-\d\d-\d\dT/);
  });

  it("sends through Resend with reply-to set to the enquirer", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.INQUIRY_TO_EMAIL = "inbox@example.test";
    process.env.INQUIRY_FROM_EMAIL = "Studio <studio@example.test>";
    stubFetch(() => new Response(JSON.stringify({ id: "x" }), { status: 200 }));

    const result = await deliverInquiry(VALID);
    assert.equal(result.delivered, true);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const body = JSON.parse(String(calls[0].init.body));
    assert.deepEqual(body.to, ["inbox@example.test"]);
    assert.equal(body.reply_to, VALID.email);
    assert.match(body.subject, /Test Person/);
    assert.ok(body.text.includes(VALID.description));
  });

  it("escapes HTML in the email so a hostile description cannot inject markup", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.INQUIRY_TO_EMAIL = "inbox@example.test";
    process.env.INQUIRY_FROM_EMAIL = "studio@example.test";
    stubFetch(() => new Response("{}", { status: 200 }));
    await deliverInquiry({ ...VALID, description: '<script>alert("x")</script> and a real sentence here.' });
    const body = JSON.parse(String(calls[0].init.body));
    assert.equal(body.html.includes("<script>"), false);
    assert.ok(body.html.includes("&lt;script&gt;"));
  });

  it("reports failure when the provider rejects the request", async () => {
    process.env.INQUIRY_WEBHOOK_URL = "https://hooks.example.test/inquiry";
    stubFetch(() => new Response("nope", { status: 500 }));
    const result = await deliverInquiry(VALID);
    assert.equal(result.delivered, false);
    assert.equal(result.failures.length, 1);
    assert.match(result.failures[0], /500/);
  });

  it("counts as delivered if at least one of two channels succeeds, and records the other failure", async () => {
    process.env.INQUIRY_WEBHOOK_URL = "https://hooks.example.test/inquiry";
    process.env.RESEND_API_KEY = "re_test";
    process.env.INQUIRY_TO_EMAIL = "inbox@example.test";
    process.env.INQUIRY_FROM_EMAIL = "studio@example.test";
    stubFetch((url) => new Response("", { status: url.includes("resend") ? 502 : 200 }));
    const result = await deliverInquiry(VALID);
    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    assert.equal(result.failures.length, 1);
  });

  it("makes no network call at all when nothing is configured", async () => {
    stubFetch(() => new Response("", { status: 200 }));
    const result = await deliverInquiry(VALID);
    assert.equal(result.delivered, false);
    assert.equal(calls.length, 0);
  });
});

describe("rate limit", () => {
  it("allows the configured number of hits then blocks with a retry hint", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) assert.equal(rateLimit(key).allowed, true, `hit ${i + 1}`);
    const blocked = rateLimit(key);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 600);
  });

  it("keeps keys independent", () => {
    const a = `a-${Date.now()}`;
    const b = `b-${Date.now()}`;
    for (let i = 0; i < 5; i++) rateLimit(a);
    assert.equal(rateLimit(a).allowed, false);
    assert.equal(rateLimit(b).allowed, true);
  });
});

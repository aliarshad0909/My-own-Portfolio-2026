import assert from "node:assert/strict";
import test from "node:test";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "../src/lib/crypto";
import { checkRateLimit, clearRateLimitsForTests } from "../src/lib/rate-limit";
import { verifyCsrfOrigin } from "../src/lib/security";
import {
  autoCategorizeTicket,
  calculateSlaDueAt,
  computeSlaStatus,
  generateAiDraftSuggestion,
} from "../src/lib/support-engine";

test("autoCategorizeTicket deterministically classifies incident, billing, onboarding, feature_request, technical", () => {
  assert.equal(
    autoCategorizeTicket("HTTP 500 production outage", "Users in EU cannot log in"),
    "incident",
  );
  assert.equal(
    autoCategorizeTicket("Duplicate invoice charge", "Please refund our October credit card payment"),
    "billing",
  );
  assert.equal(
    autoCategorizeTicket("Okta SAML SSO setup", "Need help configuring workspace provisioning"),
    "onboarding",
  );
  assert.equal(
    autoCategorizeTicket("Feature request: dark mode", "Would love a roadmap enhancement"),
    "feature_request",
  );
  assert.equal(
    autoCategorizeTicket("Webhook signature mismatch", "HMAC digest fails on Node.js handler"),
    "technical",
  );
});

test("calculateSlaDueAt & computeSlaStatus enforce priority SLA policy windows", () => {
  const created = new Date("2026-11-20T10:00:00.000Z");
  const urgentDue = calculateSlaDueAt("urgent", created);
  assert.equal(urgentDue.getTime() - created.getTime(), 3_600_000);

  const highDue = calculateSlaDueAt("high", created);
  assert.equal(highDue.getTime() - created.getTime(), 4 * 3_600_000);

  // Breached check
  const breached = computeSlaStatus(
    {
      status: "open",
      priority: "urgent",
      slaDueAt: urgentDue,
      firstRespondedAt: null,
      resolvedAt: null,
    },
    new Date("2026-11-20T11:30:00.000Z"),
  );
  assert.equal(breached.state, "breached");

  // Met SLA when resolved within window
  const met = computeSlaStatus(
    {
      status: "resolved",
      priority: "high",
      slaDueAt: highDue,
      firstRespondedAt: new Date("2026-11-20T11:00:00.000Z"),
      resolvedAt: new Date("2026-11-20T12:00:00.000Z"),
    },
    new Date("2026-11-20T15:00:00.000Z"),
  );
  assert.equal(met.state, "met");
});

test("generateAiDraftSuggestion grounds draft in matching published KB articles and never auto-sends", () => {
  const result = generateAiDraftSuggestion({
    ticket: {
      ticketNumber: "SUP-1099",
      subject: "Duplicate invoice refund request",
      description: "We were charged twice on our billing statement after adding seats.",
      category: "billing",
      priority: "high",
    },
    customerName: "Marcus Vance",
    customerCompany: "Northstar Fintech",
    customerPlan: "enterprise",
    kbArticles: [
      {
        id: "kb-1",
        slug: "billing-refunds",
        title: "Understanding Prorated Invoices & Refunds",
        category: "billing",
        summary: "Duplicate payment retries are refunded within 3-5 business days.",
        body: "Refund details",
        published: true,
      },
      {
        id: "kb-2",
        slug: "draft-unpublished",
        title: "Internal Billing Draft",
        category: "billing",
        summary: "Should not appear because unpublished",
        body: "Hidden",
        published: false,
      },
    ],
  });

  assert.equal(result.autoSent, false);
  assert.equal(result.matchedArticles.length, 1);
  assert.equal(result.matchedArticles[0]?.slug, "billing-refunds");
  assert.ok(result.draft.includes("Hi Marcus"));
  assert.ok(result.draft.includes("Understanding Prorated Invoices & Refunds"));
});

test("crypto helpers hash/verify scrypt passwords and guard production session secrets", () => {
  const hash = hashPassword("SupportDemo2026!");
  assert.equal(verifyPassword("SupportDemo2026!", hash), true);
  assert.equal(verifyPassword("WrongPassword!", hash), false);
  assert.equal(generateLockedPassword().length, 64);

  const prevRender = process.env.RENDER;
  const prevSecret = process.env.SESSION_SECRET;
  try {
    process.env.RENDER = "true";
    process.env.SESSION_SECRET = "too-short";
    assert.throws(() => resolveSessionSecret(), /at least 32/);

    process.env.SESSION_SECRET = "a".repeat(32);
    assert.equal(resolveSessionSecret(), "a".repeat(32));
  } finally {
    if (prevRender === undefined) delete process.env.RENDER;
    else process.env.RENDER = prevRender;
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  }
});

test("CSRF origin validation and sliding-window rate limiter enforce security boundaries", () => {
  const badReq = new Request("http://127.0.0.1:3070/api/tickets", {
    method: "POST",
    headers: { host: "127.0.0.1:3070", origin: "https://evil.example.com" },
  });
  const rejected = verifyCsrfOrigin(badReq);
  assert.ok(rejected);
  assert.equal(rejected.status, 403);

  const goodReq = new Request("http://127.0.0.1:3070/api/tickets", {
    method: "POST",
    headers: { host: "127.0.0.1:3070", origin: "http://127.0.0.1:3070" },
  });
  assert.equal(verifyCsrfOrigin(goodReq), null);

  clearRateLimitsForTests();
  assert.equal(checkRateLimit("test:ip", 2, 60_000).allowed, true);
  assert.equal(checkRateLimit("test:ip", 2, 60_000).allowed, true);
  assert.equal(checkRateLimit("test:ip", 2, 60_000).allowed, false);
});

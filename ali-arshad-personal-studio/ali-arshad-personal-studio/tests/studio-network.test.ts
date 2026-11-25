import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COLLABORATOR_AVAILABILITY,
  COLLABORATOR_SKILLS,
  VERIFIED_COLLABORATORS,
  normaliseCollaborator,
  validateCollaborator,
} from "@/lib/studio-network";
import {
  deliverCollaboratorApplication,
  isNetworkDeliveryConfigured,
  networkDeliveryChannels,
} from "@/lib/studio-network-server";
import { SITE, siteBaseUrl } from "@/lib/site";

const VALID_RAW = {
  name: "  Jordan Ellis  ",
  email: "  JORDAN@EXAMPLE.COM ",
  locationTimezone: "  Austin, TX (US Central)  ",
  skills: [COLLABORATOR_SKILLS[0], COLLABORATOR_SKILLS[2], "Unknown Skill"],
  portfolioUrl: "  https://github.com/jordan-ellis  ",
  availability: COLLABORATOR_AVAILABILITY[0],
  introduction:
    "Full-stack Next.js and n8n engineer with six years building B2B operational tools for US teams.",
  consent: true,
};

describe("studio network collaborator validation", () => {
  it("normalises fields and strips unknown skill values", () => {
    const clean = normaliseCollaborator(VALID_RAW);
    assert.equal(clean.name, "Jordan Ellis");
    assert.equal(clean.email, "jordan@example.com");
    assert.equal(clean.locationTimezone, "Austin, TX (US Central)");
    assert.deepEqual(clean.skills, [COLLABORATOR_SKILLS[0], COLLABORATOR_SKILLS[2]]);
    assert.equal(clean.portfolioUrl, "https://github.com/jordan-ellis");
    assert.equal(clean.consent, true);
  });

  it("accepts a complete, well-formed collaborator submission", () => {
    const clean = normaliseCollaborator(VALID_RAW);
    assert.deepEqual(validateCollaborator(clean), {});
  });

  it("rejects missing required fields, non-http URLs, and missing consent", () => {
    const empty = normaliseCollaborator({
      name: "A",
      email: "not-an-email",
      locationTimezone: "",
      skills: [],
      portfolioUrl: "javascript:alert(1)",
      availability: "Invalid option",
      introduction: "Too short",
      consent: false,
    });
    const errors = validateCollaborator(empty);
    assert.ok(errors.name);
    assert.ok(errors.email);
    assert.ok(errors.locationTimezone);
    assert.ok(errors.skills);
    assert.ok(errors.portfolioUrl);
    assert.ok(errors.availability);
    assert.ok(errors.introduction);
    assert.ok(errors.consent);
  });

  it("never contains unconsented or fabricated collaborator profiles", () => {
    for (const c of VERIFIED_COLLABORATORS) {
      assert.equal(c.consentConfirmed, true);
    }
  });
});

describe("studio network server delivery", () => {
  it("reports unconfigured when no webhook or Resend env vars are set", () => {
    const keys = [
      "STUDIO_NETWORK_WEBHOOK_URL",
      "INQUIRY_WEBHOOK_URL",
      "RESEND_API_KEY",
      "STUDIO_NETWORK_TO_EMAIL",
      "INQUIRY_TO_EMAIL",
      "INQUIRY_FROM_EMAIL",
    ];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      for (const k of keys) delete process.env[k];
      assert.deepEqual(networkDeliveryChannels(), { webhook: false, email: false });
      assert.equal(isNetworkDeliveryConfigured(), false);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it("delivers Studio Network applications via Resend with distinct label, escaped HTML, and shared Gmail recipient", async () => {
    const keys = [
      "RESEND_API_KEY",
      "INQUIRY_TO_EMAIL",
      "INQUIRY_FROM_EMAIL",
      "STUDIO_NETWORK_TO_EMAIL",
      "STUDIO_NETWORK_FROM_EMAIL",
      "STUDIO_NETWORK_WEBHOOK_URL",
      "INQUIRY_WEBHOOK_URL",
    ];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    const prevFetch = globalThis.fetch;
    let capturedUrl = "";
    let capturedBody = "";

    try {
      for (const k of keys) delete process.env[k];
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.INQUIRY_TO_EMAIL = "a.arshad3001@gmail.com";
      process.env.INQUIRY_FROM_EMAIL = "Ali Arshad Studio <hello@aliarshad.co>";
      assert.deepEqual(networkDeliveryChannels(), { webhook: false, email: true });
      assert.equal(isNetworkDeliveryConfigured(), true);

      globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
        capturedUrl = String(url);
        capturedBody = String(init?.body ?? "");
        return new Response(JSON.stringify({ id: "email_net_1" }), { status: 200 });
      }) as typeof fetch;

      const clean = normaliseCollaborator({
        ...VALID_RAW,
        introduction: '<img src=x onerror=alert(1)> Experienced Next.js engineer building reliable US client systems.',
      });
      const res = await deliverCollaboratorApplication(clean);
      assert.equal(res.delivered, true);
      assert.deepEqual(res.failures, []);
      assert.equal(capturedUrl, "https://api.resend.com/emails");
      const parsed = JSON.parse(capturedBody);
      assert.deepEqual(parsed.to, ["a.arshad3001@gmail.com"]);
      assert.equal(parsed.reply_to, "jordan@example.com");
      assert.match(parsed.subject, /^\[Studio Network Application\]/);
      assert.match(parsed.subject, /Jordan Ellis/);
      assert.equal(parsed.headers["X-Portfolio-Form"], "studio-network-application");
      assert.deepEqual(parsed.tags, [{ name: "form", value: "studio_network_application" }]);
      assert.equal(parsed.html.includes("<img"), false);
      assert.ok(parsed.html.includes("&lt;img"));
      assert.ok(parsed.text.includes("STUDIO NETWORK COLLABORATOR APPLICATION"));
    } finally {
      globalThis.fetch = prevFetch;
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it("reports provider errors cleanly without faking delivery", async () => {
    const keys = ["RESEND_API_KEY", "INQUIRY_TO_EMAIL", "INQUIRY_FROM_EMAIL", "STUDIO_NETWORK_WEBHOOK_URL", "INQUIRY_WEBHOOK_URL"];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    const prevFetch = globalThis.fetch;
    try {
      for (const k of keys) delete process.env[k];
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.INQUIRY_TO_EMAIL = "a.arshad3001@gmail.com";
      process.env.INQUIRY_FROM_EMAIL = "Ali Arshad Studio <hello@aliarshad.co>";
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ name: "validation_error", message: "Domain not verified" }), { status: 403 })) as typeof fetch;

      const res = await deliverCollaboratorApplication(normaliseCollaborator(VALID_RAW));
      assert.equal(res.delivered, false);
      assert.equal(res.failures.length, 1);
      assert.match(res.failures[0], /403/);
      assert.match(res.failures[0], /Domain not verified/);
    } finally {
      globalThis.fetch = prevFetch;
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it("delivers to webhook when configured and returns delivered=true", async () => {
    const prevWebhook = process.env.STUDIO_NETWORK_WEBHOOK_URL;
    const prevSecret = process.env.STUDIO_NETWORK_WEBHOOK_SECRET;
    const prevFetch = globalThis.fetch;
    let capturedBody = "";
    let capturedSecret = "";

    try {
      process.env.STUDIO_NETWORK_WEBHOOK_URL = "https://hooks.example.com/studio-network";
      process.env.STUDIO_NETWORK_WEBHOOK_SECRET = "test-secret-123";
      globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
        capturedBody = String(init?.body ?? "");
        const hdrs = (init?.headers ?? {}) as Record<string, string>;
        capturedSecret = hdrs["x-inquiry-secret"] ?? "";
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }) as typeof fetch;

      const clean = normaliseCollaborator(VALID_RAW);
      const res = await deliverCollaboratorApplication(clean);
      assert.equal(res.delivered, true);
      assert.deepEqual(res.failures, []);
      assert.equal(capturedSecret, "test-secret-123");
      assert.ok(capturedBody.includes("ali-arshad-studio-network"));
    } finally {
      globalThis.fetch = prevFetch;
      if (prevWebhook === undefined) delete process.env.STUDIO_NETWORK_WEBHOOK_URL;
      else process.env.STUDIO_NETWORK_WEBHOOK_URL = prevWebhook;
      if (prevSecret === undefined) delete process.env.STUDIO_NETWORK_WEBHOOK_SECRET;
      else process.env.STUDIO_NETWORK_WEBHOOK_SECRET = prevSecret;
    }
  });
});

describe("canonical production host normalization", () => {
  it("normalizes apex aliarshad.co to www.aliarshad.co to match the live 308 redirect", () => {
    const prevUrl = SITE.url;
    try {
      SITE.url = "https://aliarshad.co";
      assert.equal(siteBaseUrl().origin, "https://www.aliarshad.co");
      SITE.url = "https://www.aliarshad.co";
      assert.equal(siteBaseUrl().origin, "https://www.aliarshad.co");
    } finally {
      SITE.url = prevUrl;
    }
  });
});

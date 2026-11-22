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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PLANNER_STATE,
  buildOpenQuestions,
  decodePlannerShareQuery,
  encodePlannerShareQuery,
  formatDiscoveryBrief,
  matchPortfolioRecommendations,
  type PlannerState,
} from "@/lib/project-planner";
import {
  COLLABORATOR_AVAILABILITY,
  COLLABORATOR_REGIONS,
  COLLABORATOR_SKILLS,
  VERIFIED_COLLABORATORS,
  filterPublicGlobeCollaborators,
  normaliseCollaborator,
  validateCollaborator,
  type CollaboratorDirectoryRecord,
} from "@/lib/studio-network";
import { validateModerationAction } from "@/lib/studio-network-directory";

describe("Studio Network privacy-first globe & moderation rules", () => {
  it("keeps collaborator registrations private by default and requires coarse region only on explicit opt-in", () => {
    assert.equal(VERIFIED_COLLABORATORS.length, 0, "no invented collaborators may be hardcoded");

    const privateSubmission = normaliseCollaborator({
      name: "Jordan Lee",
      email: "jordan@example.com",
      locationTimezone: "Austin, TX (CT)",
      skills: [COLLABORATOR_SKILLS[0]],
      portfolioUrl: "https://example.com/work",
      availability: COLLABORATOR_AVAILABILITY[0],
      introduction: "Full-stack Next.js and PostgreSQL contractor available for focused US remote sprints.",
      consent: true,
    });
    assert.equal(privateSubmission.publicListingOptIn, false);
    assert.equal(privateSubmission.approximateRegion, "");
    assert.deepEqual(validateCollaborator(privateSubmission), {});

    const optInMissingRegion = normaliseCollaborator({
      ...privateSubmission,
      publicListingOptIn: true,
      approximateRegion: "",
    });
    const errs = validateCollaborator(optInMissingRegion);
    assert.ok(errs.approximateRegion, "public opt-in without coarse region must fail validation");

    const optInValid = normaliseCollaborator({
      ...privateSubmission,
      publicListingOptIn: true,
      approximateRegion: COLLABORATOR_REGIONS[0].id,
    });
    assert.deepEqual(validateCollaborator(optInValid), {});
  });

  it("blocks unapproved, unverified, or non-opted-in profiles from public globe rendering", () => {
    const records: CollaboratorDirectoryRecord[] = [
      {
        id: "c1",
        name: "Private Only",
        role: "Engineer",
        approximateLocation: "US East",
        regionId: "us-east",
        specialty: "Next.js",
        consentConfirmed: true,
        publicOptInConfirmed: false,
        verified: true,
        moderationStatus: "approved",
      },
      {
        id: "c2",
        name: "Pending Review",
        role: "Designer",
        approximateLocation: "US West",
        regionId: "us-west",
        specialty: "Brand",
        consentConfirmed: true,
        publicOptInConfirmed: true,
        verified: true,
        moderationStatus: "pending",
      },
      {
        id: "c3",
        name: "Invalid Region",
        role: "DevOps",
        approximateLocation: "123 Secret St",
        regionId: "home-street-coords",
        specialty: "Cloud",
        consentConfirmed: true,
        publicOptInConfirmed: true,
        verified: true,
        moderationStatus: "approved",
      },
      {
        id: "c4",
        name: "Approved Coarse Specialist",
        role: "Security Engineer",
        approximateLocation: "US Central metro",
        regionId: "us-central",
        specialty: "Cloud & AppSec reviews",
        consentConfirmed: true,
        publicOptInConfirmed: true,
        verified: true,
        moderationStatus: "approved",
      },
    ];

    const visible = filterPublicGlobeCollaborators(records);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, "c4");
    assert.equal(visible[0].lat, 35.5);
    assert.equal(visible[0].lng, -96.8);
  });

  it("enforces explicit opt-in, verification, and coarse region on admin moderation approval", () => {
    const bad = validateModerationAction({
      collaboratorId: "c-101",
      action: "approve",
      publicOptInConfirmed: false,
      verified: true,
      regionId: "us-east",
    });
    assert.equal(bad.ok, false);

    const good = validateModerationAction({
      collaboratorId: "c-101",
      action: "approve",
      publicOptInConfirmed: true,
      verified: true,
      regionId: "us-east",
    });
    assert.equal(good.ok, true);

    const revoke = validateModerationAction({
      collaboratorId: "c-101",
      action: "revoke",
      reason: "Collaborator requested removal from public globe",
    });
    assert.equal(revoke.ok, true);
  });
});

describe("Visual Project Planner brief generation & privacy-safe sharing", () => {
  it("strips free-text notes & PII from shareable config URLs while preserving all structured choices", () => {
    const custom: PlannerState = {
      ...DEFAULT_PLANNER_STATE,
      projectType: "ecommerce-storefront",
      audience: "consumers-d2c",
      paletteId: "ivory-terracotta",
      typographyId: "editorial-serif",
      buttonStyle: "sharp",
      cardStyle: "elevated",
      navLayout: "centered-brand",
      heroStyle: "centered-editorial",
      projectLabel: "Confidential Acme Secret Project",
      problemNote: "Contact jane.doe@secretcorp.com at 555-0199",
    };

    const query = encodePlannerShareQuery(custom);
    assert.ok(!query.includes("Confidential"), "shareable URL must never include projectLabel");
    assert.ok(!query.includes("secretcorp"), "shareable URL must never include problemNote or emails");
    assert.ok(!query.includes("555-0199"), "shareable URL must never include phone numbers");

    const restored = decodePlannerShareQuery(`?${query}`);
    assert.equal(restored.projectType, "ecommerce-storefront");
    assert.equal(restored.paletteId, "ivory-terracotta");
    assert.equal(restored.typographyId, "editorial-serif");
    assert.equal(restored.buttonStyle, "sharp");
    assert.equal(restored.navLayout, "centered-brand");
    assert.equal(restored.projectLabel, "");
    assert.equal(restored.problemNote, "");
  });

  it("generates an exploratory brief with disclaimer, tailored open questions, and real portfolio matches", () => {
    const state: PlannerState = {
      ...DEFAULT_PLANNER_STATE,
      projectType: "ai-agent-automation",
      features: ["ai-assistant", "n8n-workflows", "crm-forms"],
      integrations: ["hubspot-crm", "postgres-api"],
    };

    const brief = formatDiscoveryBrief(state);
    assert.match(brief, /Exploratory Project & Design Brief/);
    assert.match(brief, /not a binding quote/i);
    assert.match(brief, /AI Agent & n8n Automation/);

    const questions = buildOpenQuestions(state);
    assert.ok(questions.length >= 3);
    assert.ok(questions.some((q) => /ground the AI agent/i.test(q)));

    const matched = matchPortfolioRecommendations(state);
    assert.ok(matched.services.length >= 1);
    assert.ok(matched.projects.length >= 2);
    assert.ok(matched.projects.some((p) => p.slug === "agent-eval-harness"));
  });
});

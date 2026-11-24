/**
 * Shared Studio Network data, privacy-first coarse region catalog,
 * validation, and normalization.
 * Safe for both client components and Node API routes.
 */

export const COLLABORATOR_SKILLS = [
  "Full-Stack Web / Next.js",
  "Mobile Development (React Native / Expo)",
  "AI Agents & Workflow Automation (n8n)",
  "UI/UX & Brand Design",
  "Video Editing, Motion & 3D",
  "Security, Cloud & DevOps",
  "E-Commerce & Operations Consulting",
] as const;

export const COLLABORATOR_AVAILABILITY = [
  "Project-based / Part-time",
  "Dedicated Sprint Availability",
  "Specialist Review / Advisory",
  "Open for Future US-Focused Projects",
] as const;

/**
 * Curated coarse city/metro regions for optional public globe placement.
 * Coordinates are deliberately quantized to broad metro centers so exact
 * home addresses or street locations are never stored or displayed.
 */
export type CoarseRegion = {
  id: string;
  label: string;
  area: "North America" | "Europe" | "Asia-Pacific" | "Latin America" | "Middle East & Africa";
  lat: number;
  lng: number;
};

export const COLLABORATOR_REGIONS: readonly CoarseRegion[] = [
  { id: "us-east", label: "US East Coast (NYC / Boston / DC metro)", area: "North America", lat: 40.7, lng: -74.0 },
  { id: "us-central", label: "US Central (Chicago / Austin / Dallas metro)", area: "North America", lat: 35.5, lng: -96.8 },
  { id: "us-mountain", label: "US Mountain (Denver / Salt Lake metro)", area: "North America", lat: 39.7, lng: -105.0 },
  { id: "us-west", label: "US West Coast (SF Bay / Seattle / LA metro)", area: "North America", lat: 37.8, lng: -122.4 },
  { id: "ca-east", label: "Canada East (Toronto / Montreal metro)", area: "North America", lat: 43.7, lng: -79.4 },
  { id: "ca-west", label: "Canada West (Vancouver / Calgary metro)", area: "North America", lat: 49.3, lng: -123.1 },
  { id: "uk-london", label: "United Kingdom (London / South East)", area: "Europe", lat: 51.5, lng: -0.1 },
  { id: "eu-central", label: "Central Europe (Berlin / Amsterdam / Zurich)", area: "Europe", lat: 52.5, lng: 13.4 },
  { id: "eu-west", label: "Western & Southern Europe (Madrid / Lisbon / Paris)", area: "Europe", lat: 40.4, lng: -3.7 },
  { id: "eu-east", label: "Eastern Europe (Warsaw / Krakow / Tallinn)", area: "Europe", lat: 52.2, lng: 21.0 },
  { id: "south-asia", label: "South Asia (Islamabad / Lahore / Bengaluru)", area: "Asia-Pacific", lat: 33.7, lng: 73.1 },
  { id: "mena-gulf", label: "Middle East (Dubai / Riyadh / Amman)", area: "Middle East & Africa", lat: 25.2, lng: 55.3 },
  { id: "se-asia", label: "Southeast Asia (Singapore / Manila / Kuala Lumpur)", area: "Asia-Pacific", lat: 1.35, lng: 103.8 },
  { id: "au-nz", label: "Australia & New Zealand (Sydney / Melbourne / Auckland)", area: "Asia-Pacific", lat: -33.9, lng: 151.2 },
  { id: "latam", label: "Latin America (Mexico City / Bogota / Buenos Aires)", area: "Latin America", lat: 19.4, lng: -99.1 },
] as const;

export const COLLABORATOR_LIMITS = {
  name: 100,
  email: 200,
  locationTimezone: 120,
  portfolioUrl: 300,
  introMin: 30,
  introMax: 1500,
  maxSkills: 5,
} as const;

export type ModerationStatus = "pending" | "approved" | "rejected" | "revoked";

export type VerifiedCollaborator = {
  id: string;
  name: string;
  role: string;
  /** Approximate city/region label only — never a home or street address. */
  approximateLocation: string;
  /** Curated coarse region ID mapped to broad metro coordinates on the globe. */
  regionId: string;
  specialty: string;
  portfolioUrl?: string;
  consentConfirmed: true;
  publicOptInConfirmed: true;
  verified: true;
  moderationStatus: "approved";
};

/**
 * Raw record shape evaluated by the privacy/moderation gate before public rendering.
 */
export type CollaboratorDirectoryRecord = {
  id: string;
  name: string;
  role: string;
  approximateLocation: string;
  regionId: string;
  specialty: string;
  portfolioUrl?: string;
  consentConfirmed: boolean;
  publicOptInConfirmed: boolean;
  verified: boolean;
  moderationStatus: ModerationStatus;
};

/**
 * Only add real independent collaborators here once their identity, coarse metro
 * region, explicit public-listing opt-in, and written moderation approval have
 * all been confirmed. Never add invented people or fictional demo teams.
 */
export const VERIFIED_COLLABORATORS: VerifiedCollaborator[] = [];

export function findCoarseRegion(regionId: string): CoarseRegion | undefined {
  return COLLABORATOR_REGIONS.find((r) => r.id === regionId);
}

/**
 * Strict privacy gate: only returns records that have ALL FOUR approvals
 * (privacy consent, explicit public-listing opt-in, manual verification, and
 * moderation approval) AND a valid coarse region ID.
 */
export function filterPublicGlobeCollaborators(
  records: readonly CollaboratorDirectoryRecord[],
): (VerifiedCollaborator & { lat: number; lng: number; area: CoarseRegion["area"] })[] {
  const out: (VerifiedCollaborator & { lat: number; lng: number; area: CoarseRegion["area"] })[] = [];
  for (const r of records) {
    if (
      r.consentConfirmed !== true ||
      r.publicOptInConfirmed !== true ||
      r.verified !== true ||
      r.moderationStatus !== "approved"
    ) {
      continue;
    }
    const region = findCoarseRegion(r.regionId);
    if (!region) continue;
    out.push({
      id: r.id,
      name: r.name,
      role: r.role,
      approximateLocation: r.approximateLocation || region.label,
      regionId: region.id,
      specialty: r.specialty,
      portfolioUrl: r.portfolioUrl,
      consentConfirmed: true,
      publicOptInConfirmed: true,
      verified: true,
      moderationStatus: "approved",
      lat: region.lat,
      lng: region.lng,
      area: region.area,
    });
  }
  return out;
}

export type CollaboratorInput = {
  name: string;
  email: string;
  locationTimezone: string;
  skills: string[];
  portfolioUrl: string;
  availability: string;
  introduction: string;
  /** Required: allows private review & follow-up only. */
  consent: boolean;
  /** Optional (OFF by default): request consideration for public globe listing after verification. */
  publicListingOptIn: boolean;
  /** Required ONLY when publicListingOptIn === true; coarse metro region only. */
  approximateRegion: string;
};

export type CollaboratorErrors = Partial<Record<keyof CollaboratorInput, string>>;

export type CollaboratorResponse =
  | { ok: true; privacyState: "private_pending_review" }
  | {
      ok: false;
      code: "invalid" | "rate_limited" | "not_configured" | "delivery_failed" | "bad_request";
      message: string;
      errors?: CollaboratorErrors;
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normaliseCollaborator(raw: Record<string, unknown>): CollaboratorInput {
  const rawSkills = Array.isArray(raw.skills) ? raw.skills : [];
  const skills = Array.from(
    new Set(
      rawSkills
        .map((item) => clean(item))
        .filter((s) => (COLLABORATOR_SKILLS as readonly string[]).includes(s)),
    ),
  );

  const publicListingOptIn = raw.publicListingOptIn === true;
  const approximateRegion = publicListingOptIn ? clean(raw.approximateRegion) : "";

  return {
    name: clean(raw.name),
    email: clean(raw.email).toLowerCase(),
    locationTimezone: clean(raw.locationTimezone),
    skills,
    portfolioUrl: clean(raw.portfolioUrl),
    availability: clean(raw.availability),
    introduction: clean(raw.introduction),
    consent: raw.consent === true,
    publicListingOptIn,
    approximateRegion,
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export function validateCollaborator(input: CollaboratorInput): CollaboratorErrors {
  const errors: CollaboratorErrors = {};

  if (input.name.length < 2) errors.name = "Please enter your name.";
  else if (input.name.length > COLLABORATOR_LIMITS.name) {
    errors.name = `Name must be under ${COLLABORATOR_LIMITS.name} characters.`;
  }

  if (!EMAIL_RE.test(input.email) || input.email.length > COLLABORATOR_LIMITS.email) {
    errors.email = "Please enter a valid email address.";
  }

  if (input.locationTimezone.length < 2) {
    errors.locationTimezone = "Please enter your approximate city/region and time zone (e.g. Austin, TX — CT).";
  } else if (input.locationTimezone.length > COLLABORATOR_LIMITS.locationTimezone) {
    errors.locationTimezone = `Keep location/time zone under ${COLLABORATOR_LIMITS.locationTimezone} characters.`;
  }

  if (input.skills.length === 0) {
    errors.skills = "Select at least one skill area.";
  } else if (input.skills.length > COLLABORATOR_LIMITS.maxSkills) {
    errors.skills = `Select up to ${COLLABORATOR_LIMITS.maxSkills} primary skill areas.`;
  }

  if (!input.portfolioUrl) {
    errors.portfolioUrl = "Please share a portfolio, GitHub, LinkedIn, or work sample URL.";
  } else if (
    input.portfolioUrl.length > COLLABORATOR_LIMITS.portfolioUrl ||
    !isValidHttpUrl(input.portfolioUrl)
  ) {
    errors.portfolioUrl = "Enter a full URL starting with https:// or http://.";
  }

  if (!(COLLABORATOR_AVAILABILITY as readonly string[]).includes(input.availability)) {
    errors.availability = "Please select your availability.";
  }

  if (input.introduction.length < COLLABORATOR_LIMITS.introMin) {
    errors.introduction = `Share a brief introduction (at least ${COLLABORATOR_LIMITS.introMin} characters).`;
  } else if (input.introduction.length > COLLABORATOR_LIMITS.introMax) {
    errors.introduction = `Keep your introduction under ${COLLABORATOR_LIMITS.introMax.toLocaleString()} characters.`;
  }

  if (input.publicListingOptIn && !findCoarseRegion(input.approximateRegion)) {
    errors.approximateRegion =
      "Select an approximate metro/region for the public globe, or uncheck public listing to stay private.";
  }

  if (!input.consent) {
    errors.consent = "Please confirm consent so I can review and respond to your submission.";
  }

  return errors;
}

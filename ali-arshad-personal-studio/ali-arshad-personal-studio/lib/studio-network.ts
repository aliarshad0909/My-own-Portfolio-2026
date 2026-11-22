/**
 * Shared Studio Network data, validation, and normalization.
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

export const COLLABORATOR_LIMITS = {
  name: 100,
  email: 200,
  locationTimezone: 120,
  portfolioUrl: 300,
  introMin: 30,
  introMax: 1500,
  maxSkills: 5,
} as const;

export type VerifiedCollaborator = {
  name: string;
  role: string;
  location: string;
  specialty: string;
  portfolioUrl?: string;
  photoSrc?: string;
  consentConfirmed: true;
};

/**
 * Only add real independent collaborators here once their details and written
 * permission to publish have been confirmed. Never add invented people.
 */
export const VERIFIED_COLLABORATORS: VerifiedCollaborator[] = [];

export type CollaboratorInput = {
  name: string;
  email: string;
  locationTimezone: string;
  skills: string[];
  portfolioUrl: string;
  availability: string;
  introduction: string;
  consent: boolean;
};

export type CollaboratorErrors = Partial<Record<keyof CollaboratorInput, string>>;

export type CollaboratorResponse =
  | { ok: true }
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

  return {
    name: clean(raw.name),
    email: clean(raw.email).toLowerCase(),
    locationTimezone: clean(raw.locationTimezone),
    skills,
    portfolioUrl: clean(raw.portfolioUrl),
    availability: clean(raw.availability),
    introduction: clean(raw.introduction),
    consent: raw.consent === true,
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
    errors.locationTimezone = "Please enter your city/region and time zone (e.g. Austin, TX — CT).";
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

  if (!input.consent) {
    errors.consent = "Please confirm consent so I can review and respond to your submission.";
  }

  return errors;
}

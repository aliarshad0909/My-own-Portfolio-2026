/**
 * Shared validation and normalization for the optional Studio Updates email signup.
 * Never pre-checks consent; never implies a live mailing list when unconfigured.
 */

export const UPDATE_TOPICS = [
  "All studio updates (build notes & AI guides)",
  "AI automation & n8n workflows",
  "Web & SaaS product engineering",
  "Creative production & motion",
] as const;

export type UpdatesInput = {
  email: string;
  topic: string;
  consent: boolean;
};

export type UpdatesErrors = Partial<Record<keyof UpdatesInput, string>>;

export type UpdatesResponse =
  | { ok: true }
  | {
      ok: false;
      code: "invalid" | "rate_limited" | "not_configured" | "delivery_failed" | "bad_request";
      message: string;
      errors?: UpdatesErrors;
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseUpdates(raw: Record<string, unknown>): UpdatesInput {
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const rawTopic = typeof raw.topic === "string" ? raw.topic.trim() : "";
  const topic = (UPDATE_TOPICS as readonly string[]).includes(rawTopic) ? rawTopic : UPDATE_TOPICS[0];
  return { email, topic, consent: raw.consent === true };
}

export function validateUpdates(input: UpdatesInput): UpdatesErrors {
  const errors: UpdatesErrors = {};
  if (!EMAIL_RE.test(input.email) || input.email.length > 200) {
    errors.email = "Please enter a valid email address.";
  }
  if (!input.consent) {
    errors.consent = "Please check the box to confirm you want occasional studio updates.";
  }
  return errors;
}

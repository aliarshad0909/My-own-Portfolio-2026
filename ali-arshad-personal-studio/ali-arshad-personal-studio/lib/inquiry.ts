/**
 * Inquiry schema + validation shared by the contact form (client)
 * and /api/inquiry (server). No secrets in this file.
 */
import { SERVICES } from "@/lib/services";

export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.title), "Not sure yet"];

export const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $15,000",
  "$15,000+",
  "Prefer to discuss",
];

export const TIMELINE_OPTIONS = ["As soon as possible", "Within 1 month", "1 – 3 months", "3+ months", "Flexible"];

export const LIMITS = {
  name: 100,
  email: 200,
  company: 120,
  description: 4000,
  descriptionMin: 20,
} as const;

export type InquiryInput = {
  name: string;
  email: string;
  company: string;
  service: string;
  description: string;
  budget: string;
  timeline: string;
  consent: boolean;
};

export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Normalise unknown input into an InquiryInput (never trusts the client). */
export function normaliseInquiry(raw: Record<string, unknown>): InquiryInput {
  return {
    name: str(raw.name),
    email: str(raw.email).toLowerCase(),
    company: str(raw.company),
    service: str(raw.service),
    description: str(raw.description),
    budget: str(raw.budget),
    timeline: str(raw.timeline),
    consent: raw.consent === true || raw.consent === "true" || raw.consent === "on",
  };
}

export function validateInquiry(input: InquiryInput): InquiryErrors {
  const e: InquiryErrors = {};

  if (!input.name) e.name = "Please enter your name.";
  else if (input.name.length > LIMITS.name) e.name = `Please keep your name under ${LIMITS.name} characters.`;

  if (!input.email) e.email = "Please enter your email address.";
  else if (input.email.length > LIMITS.email || !EMAIL_RE.test(input.email))
    e.email = "Please enter a valid email address, like name@company.com.";

  if (input.company.length > LIMITS.company) e.company = `Please keep this under ${LIMITS.company} characters.`;

  if (!input.service) e.service = "Please choose the service you need.";
  else if (!SERVICE_OPTIONS.includes(input.service)) e.service = "Please choose a service from the list.";

  if (!input.description) e.description = "Please tell me a little about your project.";
  else if (input.description.length < LIMITS.descriptionMin)
    e.description = `Please add a bit more detail (at least ${LIMITS.descriptionMin} characters).`;
  else if (input.description.length > LIMITS.description)
    e.description = `Please keep this under ${LIMITS.description} characters.`;

  if (input.budget && !BUDGET_OPTIONS.includes(input.budget)) e.budget = "Please choose a budget from the list.";
  if (input.timeline && !TIMELINE_OPTIONS.includes(input.timeline)) e.timeline = "Please choose a timeline from the list.";

  if (!input.consent) e.consent = "Please confirm I can use these details to reply to you.";

  return e;
}

/** Response contract for /api/inquiry. */
export type InquiryResponse =
  | { ok: true }
  | {
      ok: false;
      code: "invalid" | "not_configured" | "rate_limited" | "delivery_failed" | "bad_request";
      message: string;
      errors?: InquiryErrors;
    };

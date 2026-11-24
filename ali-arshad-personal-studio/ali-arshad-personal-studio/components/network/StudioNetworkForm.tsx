"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { trackEvent } from "@/lib/analytics";
import {
  COLLABORATOR_AVAILABILITY,
  COLLABORATOR_LIMITS,
  COLLABORATOR_SKILLS,
  normaliseCollaborator,
  validateCollaborator,
  type CollaboratorErrors,
  type CollaboratorInput,
  type CollaboratorResponse,
} from "@/lib/studio-network";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string; setup?: boolean };

const EMPTY: CollaboratorInput = {
  name: "",
  email: "",
  locationTimezone: "",
  skills: [],
  portfolioUrl: "",
  availability: "",
  introduction: "",
  consent: false,
};

const FIELD_ORDER: (keyof CollaboratorInput)[] = [
  "name",
  "email",
  "locationTimezone",
  "skills",
  "portfolioUrl",
  "availability",
  "introduction",
  "consent",
];

type Props = {
  configured: boolean;
  fallbackEmail?: string;
  linkedinUrl?: string;
};

export function StudioNetworkForm({ configured, fallbackEmail = "", linkedinUrl = "" }: Props) {
  const [values, setValues] = useState<CollaboratorInput>(EMPTY);
  const [errors, setErrors] = useState<CollaboratorErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = <K extends keyof CollaboratorInput>(key: K, value: CollaboratorInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleSkill = (skill: string) => {
    setValues((v) => {
      const exists = v.skills.includes(skill);
      const next = exists ? v.skills.filter((s) => s !== skill) : [...v.skills, skill];
      return { ...v, skills: next };
    });
    if (errors.skills) setErrors((e) => ({ ...e, skills: undefined }));
  };

  const focusFirstError = (errs: CollaboratorErrors) => {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (!first) return;
    const selector = first === "skills" ? '[data-field="skills"] input' : `[name="${first}"]`;
    formRef.current?.querySelector<HTMLElement>(selector)?.focus();
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;

    const input = normaliseCollaborator(values as unknown as Record<string, unknown>);
    const found = validateCollaborator(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ kind: "idle" });
      focusFirstError(found);
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/studio-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          companyWebsite: honeypot,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const data = (await res.json().catch(() => null)) as CollaboratorResponse | null;

      if (res.ok && data?.ok === true) {
        trackEvent("studio_network_submit", {
          skillCount: input.skills.length,
          availability: input.availability,
        });
        setStatus({ kind: "success" });
        setValues(EMPTY);
      } else if (data && data.ok === false) {
        if (data.errors) {
          setErrors(data.errors);
          focusFirstError(data.errors);
        }
        setStatus({ kind: "error", message: data.message, setup: data.code === "not_configured" });
      } else {
        setStatus({
          kind: "error",
          message: "Something went wrong while sending your registration. Please try again in a moment.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message: "Your registration could not be sent. Please check your connection and try again.",
      });
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (status.kind === "success") {
    return (
      <div className="form-status form-status--success" role="status" tabIndex={-1} ref={statusRef}>
        <Icon name="check" size={24} />
        <div>
          <h3 className="card-title">Registration received</h3>
          <p>
            Thank you. Your details have been delivered to Ali Arshad. I review submissions personally and reach out when a project scope matches
            your specialty and time zone.
          </p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStatus({ kind: "idle" })}>
            <span>Submit another profile</span>
          </button>
        </div>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const describedBy = (key: keyof CollaboratorInput, hint?: string) =>
    [errors[key] ? `net-${key}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;
  const err = (key: keyof CollaboratorInput) =>
    errors[key] ? (
      <p className="field__error" id={`net-${key}-error`}>
        <Icon name="alert" size={14} />
        <span>{errors[key]}</span>
      </p>
    ) : null;

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate aria-busy={submitting}>
      {!configured ? (
        <div className="form-status form-status--setup" role="note">
          <Icon name="alert" size={22} />
          <div>
            <h3 className="card-title">Form inbox not connected yet</h3>
            <p>
              Submissions cannot be delivered through this form until an email provider or webhook is configured on the server.
              {fallbackEmail ? (
                <>
                  {" "}
                  Email <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> instead
                </>
              ) : null}
              {linkedinUrl ? (
                <>
                  {fallbackEmail ? ", or connect on " : " You can connect directly on "}
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                  .
                </>
              ) : (
                " Please check back once delivery is configured."
              )}
            </p>
          </div>
        </div>
      ) : null}

      <div className="form__row">
        <div className="field">
          <label htmlFor="net-name">Full name *</label>
          <input
            id="net-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={COLLABORATOR_LIMITS.name}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {err("name")}
        </div>
        <div className="field">
          <label htmlFor="net-email">Email *</label>
          <input
            id="net-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={COLLABORATOR_LIMITS.email}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {err("email")}
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="net-locationTimezone">Location &amp; time zone *</label>
          <input
            id="net-locationTimezone"
            name="locationTimezone"
            type="text"
            placeholder="e.g. Austin, TX (US Central) or Remote (EST overlap)"
            required
            maxLength={COLLABORATOR_LIMITS.locationTimezone}
            value={values.locationTimezone}
            onChange={(e) => set("locationTimezone", e.target.value)}
            aria-invalid={errors.locationTimezone ? true : undefined}
            aria-describedby={describedBy("locationTimezone")}
          />
          {err("locationTimezone")}
        </div>
        <div className="field">
          <label htmlFor="net-availability">Availability *</label>
          <select
            id="net-availability"
            name="availability"
            required
            value={values.availability}
            onChange={(e) => set("availability", e.target.value)}
            aria-invalid={errors.availability ? true : undefined}
            aria-describedby={describedBy("availability")}
          >
            <option value="">Select availability</option>
            {COLLABORATOR_AVAILABILITY.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {err("availability")}
        </div>
      </div>

      <fieldset className="form__fieldset" data-field="skills">
        <legend className="form__legend">Primary skills * (select up to {COLLABORATOR_LIMITS.maxSkills})</legend>
        <div className="skill-check-grid">
          {COLLABORATOR_SKILLS.map((skill) => {
            const checked = values.skills.includes(skill);
            return (
              <label key={skill} className={`skill-check ${checked ? "is-checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSkill(skill)}
                  disabled={!checked && values.skills.length >= COLLABORATOR_LIMITS.maxSkills}
                />
                <span>{skill}</span>
              </label>
            );
          })}
        </div>
        {err("skills")}
      </fieldset>

      <div className="field">
        <label htmlFor="net-portfolioUrl">Portfolio, GitHub, or work samples URL *</label>
        <input
          id="net-portfolioUrl"
          name="portfolioUrl"
          type="url"
          placeholder="https://..."
          required
          maxLength={COLLABORATOR_LIMITS.portfolioUrl}
          value={values.portfolioUrl}
          onChange={(e) => set("portfolioUrl", e.target.value)}
          aria-invalid={errors.portfolioUrl ? true : undefined}
          aria-describedby={describedBy("portfolioUrl")}
        />
        {err("portfolioUrl")}
      </div>

      <div className="field">
        <label htmlFor="net-introduction">Short introduction *</label>
        <textarea
          id="net-introduction"
          name="introduction"
          rows={5}
          required
          maxLength={COLLABORATOR_LIMITS.introMax}
          value={values.introduction}
          onChange={(e) => set("introduction", e.target.value)}
          aria-invalid={errors.introduction ? true : undefined}
          aria-describedby={describedBy("introduction", "net-intro-hint net-intro-count")}
        />
        <div className="field__meta">
          <p className="field__hint" id="net-intro-hint">
            Summarize your core craft, relevant US-client or remote experience, and the kinds of builds you do best.
          </p>
          <p
            className={`field__count ${values.introduction.length > 0 && values.introduction.length < COLLABORATOR_LIMITS.introMin ? "is-short" : ""}`.trim()}
            id="net-intro-count"
            aria-live="polite"
          >
            {values.introduction.length < COLLABORATOR_LIMITS.introMin
              ? `${COLLABORATOR_LIMITS.introMin - values.introduction.length} more to go`
              : `${values.introduction.length.toLocaleString()} / ${COLLABORATOR_LIMITS.introMax.toLocaleString()}`}
          </p>
        </div>
        {err("introduction")}
      </div>

      {/* Honeypot anti-spam trap */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="companyWebsite">Leave this field empty</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="field field--check">
        <input
          id="net-consent"
          name="consent"
          type="checkbox"
          required
          checked={values.consent}
          onChange={(e) => set("consent", e.target.checked)}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={describedBy("consent")}
        />
        <label htmlFor="net-consent">
          I agree that Ali Arshad may review and store these details solely to evaluate independent project collaboration, as described in the{" "}
          <a href="/privacy">Privacy Notice</a>. Nothing I submit will be published publicly without my explicit written permission. *
        </label>
        {err("consent")}
      </div>

      {status.kind === "error" ? (
        <div
          className={`form-status ${status.setup ? "form-status--setup" : "form-status--error"}`}
          role="alert"
          tabIndex={-1}
          ref={statusRef}
        >
          <Icon name="alert" size={22} />
          <div>
            <h3 className="card-title">{status.setup ? "Not sent: form not connected" : "Submission not sent"}</h3>
            <p>{status.message}</p>
          </div>
        </div>
      ) : null}

      <button type="submit" className="btn btn--primary btn--md form__submit" disabled={submitting}>
        {submitting ? <span className="spinner" aria-hidden="true" /> : <Icon name="send" size={18} />}
        <span>{submitting ? "Sending…" : "Register collaboration interest"}</span>
      </button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  BUDGET_OPTIONS,
  LIMITS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
  normaliseInquiry,
  validateInquiry,
  type InquiryErrors,
  type InquiryInput,
  type InquiryResponse,
} from "@/lib/inquiry";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string; setup?: boolean };

const EMPTY: InquiryInput = { name: "", email: "", company: "", service: "", description: "", budget: "", timeline: "", consent: false };

const FIELD_ORDER: (keyof InquiryInput)[] = ["name", "email", "company", "service", "description", "budget", "timeline", "consent"];

type Props = {
  /** Whether a delivery channel is configured on the server. */
  configured: boolean;
  fallbackEmail?: string;
};

export function InquiryForm({ configured, fallbackEmail = "" }: Props) {
  const [values, setValues] = useState<InquiryInput>(EMPTY);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Record when the form became interactive, and preselect ?service= from /services.
  useEffect(() => {
    startedAt.current = Date.now();
    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && SERVICE_OPTIONS.includes(requested)) setValues((v) => ({ ...v, service: requested }));
  }, []);

  const set = <K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusFirstError = (errs: InquiryErrors) => {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;

    const input = normaliseInquiry(values as unknown as Record<string, unknown>);
    const found = validateInquiry(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ kind: "idle" });
      focusFirstError(found);
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, website: honeypot, elapsedMs: Date.now() - startedAt.current }),
      });
      const data = (await res.json().catch(() => null)) as InquiryResponse | null;

      // Success is only shown when the server confirms delivery.
      if (res.ok && data?.ok === true) {
        setStatus({ kind: "success" });
        setValues(EMPTY);
      } else if (data && data.ok === false) {
        if (data.errors) {
          setErrors(data.errors);
          focusFirstError(data.errors);
        }
        setStatus({ kind: "error", message: data.message, setup: data.code === "not_configured" });
      } else {
        setStatus({ kind: "error", message: "Something went wrong while sending your inquiry. Please try again in a moment." });
      }
    } catch {
      setStatus({ kind: "error", message: "Your inquiry could not be sent. Please check your connection and try again." });
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (status.kind === "success") {
    return (
      <div className="form-status form-status--success" role="status" tabIndex={-1} ref={statusRef}>
        <Icon name="check" size={24} />
        <div>
          <h3 className="card-title">Inquiry sent</h3>
          <p>Thank you. Your message has been delivered, and I&rsquo;ll reply to the email address you provided.</p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStatus({ kind: "idle" })}>
            <span>Send another inquiry</span>
          </button>
        </div>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const describedBy = (key: keyof InquiryInput, hint?: string) => [errors[key] ? `${key}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;
  const err = (key: keyof InquiryInput) =>
    errors[key] ? (
      <p className="field__error" id={`${key}-error`}>
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
            <h3 className="card-title">The inquiry form isn&rsquo;t connected yet</h3>
            <p>
              Messages can&rsquo;t be delivered from this form until it is connected to an inbox.
              {fallbackEmail ? (
                <>
                  {" "}
                  Please email <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> instead.
                </>
              ) : (
                " Please check back soon."
              )}
            </p>
          </div>
        </div>
      ) : null}

      <div className="form__row">
        <div className="field">
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={LIMITS.name} value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy("name")} />
          {err("name")}
        </div>
        <div className="field">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={LIMITS.email} value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy("email")} />
          {err("email")}
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="company">
            Company or brand <span className="field__optional">(optional)</span>
          </label>
          <input id="company" name="company" type="text" autoComplete="organization" maxLength={LIMITS.company} value={values.company} onChange={(e) => set("company", e.target.value)} aria-invalid={errors.company ? true : undefined} aria-describedby={describedBy("company")} />
          {err("company")}
        </div>
        <div className="field">
          <label htmlFor="service">Service required *</label>
          <select id="service" name="service" required value={values.service} onChange={(e) => set("service", e.target.value)} aria-invalid={errors.service ? true : undefined} aria-describedby={describedBy("service")}>
            <option value="">Select a service</option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {err("service")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Project description *</label>
        <textarea id="description" name="description" rows={6} required maxLength={LIMITS.description} value={values.description} onChange={(e) => set("description", e.target.value)} aria-invalid={errors.description ? true : undefined} aria-describedby={describedBy("description", "description-hint")} />
        <p className="field__hint" id="description-hint">
          What are you building, who is it for, and what does success look like?
        </p>
        {err("description")}
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="budget">
            Budget range <span className="field__optional">(optional)</span>
          </label>
          <select id="budget" name="budget" value={values.budget} onChange={(e) => set("budget", e.target.value)} aria-invalid={errors.budget ? true : undefined} aria-describedby={describedBy("budget")}>
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {err("budget")}
        </div>
        <div className="field">
          <label htmlFor="timeline">
            Expected timeline <span className="field__optional">(optional)</span>
          </label>
          <select id="timeline" name="timeline" value={values.timeline} onChange={(e) => set("timeline", e.target.value)} aria-invalid={errors.timeline ? true : undefined} aria-describedby={describedBy("timeline")}>
            <option value="">Select a timeline</option>
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {err("timeline")}
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="field field--check">
        <input id="consent" name="consent" type="checkbox" required checked={values.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={errors.consent ? true : undefined} aria-describedby={describedBy("consent")} />
        <label htmlFor="consent">I agree that Ali Arshad may store and use these details to respond to my inquiry. *</label>
        {err("consent")}
      </div>

      {status.kind === "error" ? (
        <div className={`form-status ${status.setup ? "form-status--setup" : "form-status--error"}`} role="alert" tabIndex={-1} ref={statusRef}>
          <Icon name="alert" size={22} />
          <div>
            <h3 className="card-title">{status.setup ? "Not sent — form not connected" : "Your inquiry was not sent"}</h3>
            <p>{status.message}</p>
          </div>
        </div>
      ) : null}

      <button type="submit" className="btn btn--primary btn--md form__submit" disabled={submitting}>
        {submitting ? <span className="spinner" aria-hidden="true" /> : <Icon name="send" size={18} />}
        <span>{submitting ? "Sending…" : "Send inquiry"}</span>
      </button>
    </form>
  );
}

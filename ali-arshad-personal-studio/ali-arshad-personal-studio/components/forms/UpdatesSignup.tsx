"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  UPDATE_TOPICS,
  normaliseUpdates,
  validateUpdates,
  type UpdatesErrors,
  type UpdatesResponse,
} from "@/lib/updates";

type Props = {
  configured: boolean;
};

export function UpdatesSignup({ configured }: Props) {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(UPDATE_TOPICS[0]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<UpdatesErrors>({});
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; message: string; setup?: boolean }
  >({ kind: "idle" });
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    const input = normaliseUpdates({ email, topic, consent });
    const found = validateUpdates(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, website: honeypot, elapsedMs: Date.now() - startedAt.current }),
      });
      const data = (await res.json().catch(() => null)) as UpdatesResponse | null;
      if (res.ok && data?.ok === true) {
        setStatus({ kind: "success" });
        setEmail("");
        setConsent(false);
      } else if (data && data.ok === false) {
        if (data.errors) setErrors(data.errors);
        setStatus({ kind: "error", message: data.message, setup: data.code === "not_configured" });
      } else {
        setStatus({ kind: "error", message: "Could not complete signup right now. Please try again later." });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error while signing up. Please try again." });
    }
  }

  return (
    <section className="section section--tight" aria-labelledby="updates-signup-title">
      <div className="container">
        <div className="panel updates-box">
          <div className="updates-box__copy">
            <p className="eyebrow eyebrow--plain">Occasional studio updates</p>
            <h2 className="section-title section-title--sm" id="updates-signup-title">
              Build notes &amp; practical AI/automation guides — no weekly spam
            </h2>
            <p className="section-sub">
              Get occasional notes when new product demos, workflow templates, or engineering breakdowns go live. Unsubscribe anytime; details are
              handled under the <Link href="/privacy">privacy policy</Link>.
            </p>
          </div>

          {!configured ? (
            <div className="form-status form-status--setup" role="note">
              <Icon name="alert" size={20} />
              <div>
                <h3 className="card-title">Mailing list not connected yet</h3>
                <p>
                  Email delivery for updates is not configured on the server yet, so signup is paused rather than pretending to subscribe you. Follow
                  new posts directly here or connect on LinkedIn.
                </p>
              </div>
            </div>
          ) : status.kind === "success" ? (
            <div className="form-status form-status--success" role="status">
              <Icon name="check" size={22} />
              <div>
                <h3 className="card-title">You&rsquo;re on the list</h3>
                <p>Your signup was confirmed. Expect occasional project notes and practical guides — nothing noisy.</p>
              </div>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="form__row">
                <div className="field">
                  <label htmlFor="upd-email">Email address *</label>
                  <input
                    id="upd-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    aria-invalid={errors.email ? true : undefined}
                  />
                  {errors.email ? <p className="field__error">{errors.email}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="upd-topic">Topic focus</label>
                  <select id="upd-topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    {UPDATE_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form__trap" aria-hidden="true">
                <label htmlFor="upd-website">Leave empty</label>
                <input
                  id="upd-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="field field--check">
                <input
                  id="upd-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (errors.consent) setErrors((p) => ({ ...p, consent: undefined }));
                  }}
                  aria-invalid={errors.consent ? true : undefined}
                />
                <label htmlFor="upd-consent">
                  Yes, send me occasional project updates and practical AI/engineering notes (not pre-checked; unsubscribe anytime). *
                </label>
                {errors.consent ? <p className="field__error">{errors.consent}</p> : null}
              </div>

              {status.kind === "error" ? (
                <div className={`form-status ${status.setup ? "form-status--setup" : "form-status--error"}`} role="alert">
                  <Icon name="alert" size={20} />
                  <p>{status.message}</p>
                </div>
              ) : null}

              <button type="submit" className="btn btn--primary btn--sm" disabled={status.kind === "submitting"}>
                <span>{status.kind === "submitting" ? "Subscribing…" : "Subscribe to updates"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

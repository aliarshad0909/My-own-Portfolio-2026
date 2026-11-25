"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({
  authConfigured,
  sessionExpired,
}: {
  authConfigured: boolean;
  sessionExpired: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Sign-in failed. Check your credentials and try again.");
        setSubmitting(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error while signing in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-item-row" style={{ justifyContent: "flex-start" }}>
          <span className="adm-brand-mark" aria-hidden="true">
            A
          </span>
          <div>
            <h1>Studio Admin Console</h1>
            <p className="adm-card-sub">Private operations workspace — owner access only</p>
          </div>
        </div>

        {sessionExpired && (
          <div className="adm-alert adm-alert--warn" role="status">
            Your previous admin session expired. Sign in again to continue.
          </div>
        )}

        {!authConfigured ? (
          <div className="adm-alert adm-alert--warn" role="alert">
            <strong>Admin authentication is not configured on this environment yet.</strong>
            <p style={{ margin: "0.45rem 0 0" }}>
              Set <code className="adm-code">ADMIN_EMAIL</code>, <code className="adm-code">ADMIN_PASSWORD_HASH</code>{" "}
              (generated with <code className="adm-code">npm run admin:hash-password</code>), and{" "}
              <code className="adm-code">ADMIN_SESSION_SECRET</code> (32+ random characters) in Vercel or{" "}
              <code className="adm-code">.env.local</code>.
            </p>
          </div>
        ) : (
          <form className="adm-form" onSubmit={handleSubmit}>
            {error && (
              <div className="adm-alert adm-alert--error" role="alert">
                {error}
              </div>
            )}

            <div className="adm-field">
              <label htmlFor="admin-email" className="adm-label">
                Owner Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                className="adm-input"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@domain.com"
              />
            </div>

            <div className="adm-field">
              <label htmlFor="admin-password" className="adm-label">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                className="adm-input"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <button type="submit" className="adm-btn adm-btn--primary" disabled={submitting}>
              {submitting ? "Verifying…" : "Sign In to Studio Console"}
            </button>
          </form>
        )}

        <p className="adm-hint" style={{ margin: 0 }}>
          Protected by HTTP-only signed sessions, CSRF tokens, rate limiting, and strict{" "}
          <code className="adm-code">noindex</code> headers.
        </p>
      </div>
    </div>
  );
}

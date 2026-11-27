"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ServiceHealthState } from "@/lib/admin/types";

const STATE_LABELS: Record<ServiceHealthState, string> = {
  connected: "Connected",
  needs_setup: "Needs Setup",
  offline: "Offline",
  error: "Error",
};

export function StatusBadge({ state, label }: { state: ServiceHealthState; label?: string }) {
  return (
    <span className={`adm-badge adm-badge--${state}`}>
      <span className="adm-badge-dot" aria-hidden="true" />
      {label ?? STATE_LABELS[state]}
    </span>
  );
}

export function DemoBadge({ label = "Local Demo" }: { label?: string }) {
  return <span className="adm-badge adm-badge--demo">{label}</span>;
}

export function EmptyConnectState({
  title,
  detail,
  actionLabel = "Open Integrations & Setup",
  actionHref = "/admin/integrations",
}: {
  title: string;
  detail: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="adm-empty">
      <h3>{title}</h3>
      <p>{detail}</p>
      <div>
        <Link href={actionHref} className="adm-btn adm-btn--sm">
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export function OutboundConfirmModal({
  open,
  title,
  summary,
  confirmPhrase,
  liveAllowed,
  liveLockNote,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  summary: ReactNode;
  confirmPhrase: string;
  liveAllowed: boolean;
  liveLockNote: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (phrase: string) => void;
}) {
  const [phrase, setPhrase] = useState("");
  if (!open) return null;
  const matches = phrase.trim() === confirmPhrase;

  return (
    <div className="adm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="adm-confirm-title">
      <div className="adm-modal">
        <div className="adm-item-row">
          <h2 id="adm-confirm-title" className="adm-card-title">
            {title}
          </h2>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="adm-item">{summary}</div>

        {!liveAllowed ? (
          <div className="adm-alert adm-alert--warn">{liveLockNote}</div>
        ) : (
          <div className="adm-field">
            <label htmlFor="adm-confirm-phrase" className="adm-label">
              Type <code className="adm-code">{confirmPhrase}</code> to confirm this outbound action
            </label>
            <input
              id="adm-confirm-phrase"
              className="adm-input"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
            />
          </div>
        )}

        <div className="adm-item-row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
            Go Back
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            disabled={!liveAllowed || !matches || submitting}
            onClick={() => onConfirm(phrase.trim())}
          >
            {submitting ? "Executing…" : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CertificateViewer } from "@/components/credentials/CertificateViewer";
import { Icon } from "@/components/ui/Icon";
import { formatCredentialDate, isExpired, type Credential } from "@/lib/credentials";

/**
 * One credential. The text is the record — title, issuer, dates, code,
 * skills — and the image is a preview of the certificate, never the only
 * carrier of the facts. Cards without an image render the same information
 * with an issuer mark in place of the preview.
 */
export function CredentialCard({ credential, compact = false }: { credential: Credential; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const expired = isExpired(credential);

  return (
    <article className={`cred ${compact ? "cred--compact" : ""}`.trim()} aria-labelledby={`cred-${credential.id}-title`}>
      {credential.image ? (
        <button
          ref={triggerRef}
          type="button"
          className="cred__preview"
          onClick={() => setOpen(true)}
          aria-label={`View the ${credential.issuer} certificate at full size`}
        >
          <Image
            src={credential.image.thumb}
            alt=""
            width={570}
            height={440}
            sizes={compact ? "(min-width: 760px) 320px, 90vw" : "(min-width: 1024px) 420px, 90vw"}
            className="cred__thumb"
          />
          <span className="cred__zoom" aria-hidden="true">
            <Icon name="arrow-up-right" size={15} />
            View certificate
          </span>
        </button>
      ) : (
        <div className="cred__preview cred__preview--mark" aria-hidden="true">
          <span className="cred__mark">{credential.mark}</span>
          <span className="cred__issuer-line">{credential.programme ?? credential.issuer}</span>
        </div>
      )}

      <div className="cred__body">
        <div className="cred__meta">
          <span className={`badge ${expired ? "badge--neutral" : "badge--verified"}`}>{expired ? "Expired" : "Active"}</span>
          {credential.programme ? <span className="cred__prog">{credential.programme}</span> : null}
        </div>

        <h3 className="cred__title" id={`cred-${credential.id}-title`}>
          {credential.title}
        </h3>
        <p className="cred__issuer">
          Issued by <strong>{credential.issuer}</strong>
        </p>

        <dl className="cred__dates">
          <div>
            <dt>Issued</dt>
            <dd>
              <time dateTime={credential.issued}>{formatCredentialDate(credential.issued)}</time>
            </dd>
          </div>
          {credential.expires ? (
            <div>
              <dt>{expired ? "Expired" : "Expires"}</dt>
              <dd>
                <time dateTime={credential.expires}>{formatCredentialDate(credential.expires)}</time>
              </dd>
            </div>
          ) : null}
          {!compact && credential.credentialId ? (
            <div className="cred__code">
              <dt>Code</dt>
              <dd>
                <code>{credential.credentialId}</code>
              </dd>
            </div>
          ) : null}
        </dl>

        {!compact ? (
          <ul className="cred__skills" aria-label="Topics covered">
            {credential.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}

        <div className="cred__actions">
          {credential.verifyUrl ? (
            <a href={credential.verifyUrl} target="_blank" rel="noopener noreferrer" className="cred__verify">
              Verify credential
              <Icon name="arrow-up-right" size={14} />
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="cred__noverify">No public verification link was issued; the code above identifies the award.</span>
          )}
        </div>
      </div>

      <CertificateViewer credential={credential} open={open} onClose={() => setOpen(false)} returnFocusTo={triggerRef} />
    </article>
  );
}

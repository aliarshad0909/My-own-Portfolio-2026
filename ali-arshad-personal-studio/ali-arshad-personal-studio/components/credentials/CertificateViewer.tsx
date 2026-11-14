"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Credential } from "@/lib/credentials";

/**
 * Full-size certificate view using the native <dialog> element.
 *
 * showModal() gives focus trapping, Escape-to-close, inert background and a
 * top-layer backdrop for free, so there is no modal library. On close, focus
 * is returned to the element that opened it — the parent passes the trigger
 * ref — which is the part most hand-rolled modals forget.
 */
export function CertificateViewer({
  credential,
  open,
  onClose,
  returnFocusTo,
}: {
  credential: Credential;
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      // Return focus after the dialog has actually closed.
      requestAnimationFrame(() => returnFocusTo.current?.focus());
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, returnFocusTo]);

  if (!credential.image) return null;

  return (
    <dialog
      ref={dialogRef}
      className="cert-dialog"
      aria-labelledby={`cert-dialog-${credential.id}-title`}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside its content) closes.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="cert-dialog__inner">
        <header className="cert-dialog__head">
          <div>
            <h2 className="cert-dialog__title" id={`cert-dialog-${credential.id}-title`}>
              {credential.displayTitle ?? credential.title}
            </h2>
            <p className="cert-dialog__sub">
              {credential.issuer}
              {credential.credentialId ? <> · Certification code <code>{credential.credentialId}</code></> : null}
            </p>
          </div>
          <button type="button" className="cert-dialog__close" onClick={() => dialogRef.current?.close()} aria-label="Close certificate view">
            <Icon name="close" size={20} />
          </button>
        </header>
        <Image
          src={credential.image.src}
          alt={credential.image.alt}
          width={credential.image.width}
          height={credential.image.height}
          sizes="(min-width: 1024px) 900px, 96vw"
          className="cert-dialog__img"
        />
      </div>
    </dialog>
  );
}

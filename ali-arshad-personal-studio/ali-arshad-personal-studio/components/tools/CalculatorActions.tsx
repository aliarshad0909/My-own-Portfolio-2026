"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Props = {
  /** Plain-text summary copied to the clipboard when the user clicks Copy results. */
  summaryText: string;
  /** Reset handler restoring default calculator inputs. */
  onReset: () => void;
  /** Optional custom copy label. */
  copyLabel?: string;
};

export function CalculatorActions({ summaryText, onReset, copyLabel = "Copy results" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = summaryText;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="calc__actions">
      <button type="button" className="btn btn--secondary btn--sm calc__action-btn" onClick={handleCopy}>
        <Icon name={copied ? "check" : "copy"} size={15} />
        <span>{copied ? "Copied summary" : copyLabel}</span>
      </button>
      <button type="button" className="btn btn--ghost btn--sm calc__action-btn" onClick={onReset}>
        <Icon name="rotate-ccw" size={15} />
        <span>Reset</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Calculator summary copied to clipboard." : ""}
      </span>
    </div>
  );
}


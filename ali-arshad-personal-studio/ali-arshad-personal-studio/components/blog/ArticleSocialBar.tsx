"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { SocialLink } from "@/lib/site";

type Props = {
  articleUrl: string;
  articleTitle: string;
  socials: SocialLink[];
};

/**
 * Unobtrusive author follow + share bar for Studio Blog articles.
 * Uses only verified social URLs configured in lib/site.ts (never guessed).
 */
export function ArticleSocialBar({ articleUrl, articleTitle, socials }: Props) {
  const [copied, setCopied] = useState(false);

  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="panel article-social-bar" aria-label="Share article and follow Ali Arshad">
      <div className="article-social-bar__group">
        <p className="eyebrow eyebrow--plain">Follow Ali Arshad</p>
        <p className="fine-print" style={{ marginTop: "4px" }}>
          New build logs, sourcing notes, and studio updates across verified public profiles:
        </p>
        <div className="article-social-bar__links">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="location-pill"
              aria-label={`Follow Ali Arshad on ${s.label} (opens in new tab)`}
            >
              <Icon name={s.icon} size={14} />
              <span>{s.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="article-social-bar__group">
        <p className="eyebrow eyebrow--plain">Share this dispatch</p>
        <p className="fine-print" style={{ marginTop: "4px" }}>
          Found this breakdown useful? Share a direct link with your team:
        </p>
        <div className="article-social-bar__links">
          <a
            href={shareLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="location-pill"
            aria-label={`Share "${articleTitle}" on LinkedIn (opens in new tab)`}
          >
            <Icon name="linkedin" size={14} />
            <span>Share on LinkedIn</span>
          </a>
          <a
            href={shareFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className="location-pill"
            aria-label={`Share "${articleTitle}" on Facebook (opens in new tab)`}
          >
            <Icon name="facebook" size={14} />
            <span>Share on Facebook</span>
          </a>
          <button type="button" className="location-pill" onClick={handleCopy}>
            <Icon name={copied ? "check" : "arrow-up-right"} size={14} />
            <span>{copied ? "Link copied" : "Copy link"}</span>
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Article link copied to clipboard." : ""}
          </span>
        </div>
      </div>
    </aside>
  );
}

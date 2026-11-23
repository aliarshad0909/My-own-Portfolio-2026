"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics";

type Props = {
  href: string;
  event: AnalyticsEventName;
  props?: AnalyticsPayload;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export function TrackedLink({ href, event, props, external = false, className, ariaLabel, children }: Props) {
  const onClick = () => trackEvent(event, { href, ...props });

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  );
}

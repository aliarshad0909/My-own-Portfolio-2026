"use client";

/**
 * Privacy-conscious, zero-cookie conversion event helper.
 * - Respects browser Do Not Track (`navigator.doNotTrack === "1"`).
 * - Uses no third-party cookies or paid services.
 * - Forwards events to Plausible, Umami, or gtag ONLY when already configured
 *   in the deployment, and dispatches a CustomEvent (`studio:analytics`) so
 *   lightweight listeners or automated tests can observe conversion events.
 */

export type AnalyticsEventName =
  | "demo_launch"
  | "mobile_preview_launch"
  | "cta_click"
  | "contact_submit"
  | "studio_network_submit"
  | "video_play";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
    umami?: { track?: (event: string, data?: Record<string, string | number | boolean>) => void };
    gtag?: (command: "event", event: string, params?: Record<string, string | number | boolean>) => void;
  }
}

function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
}

export function trackEvent(name: AnalyticsEventName, props: AnalyticsPayload = {}): void {
  if (typeof window === "undefined" || isDoNotTrackEnabled()) return;

  const cleanProps: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined) cleanProps[k] = v;
  }

  try {
    if (typeof window.plausible === "function") {
      window.plausible(name, { props: cleanProps });
    }
    if (typeof window.umami?.track === "function") {
      window.umami.track(name, cleanProps);
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", name, cleanProps);
    }
    window.dispatchEvent(new CustomEvent("studio:analytics", { detail: { name, props: cleanProps } }));
  } catch {
    // Analytics must never interrupt user navigation or form submission.
  }
}

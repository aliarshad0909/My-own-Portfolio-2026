"use client";

import { useEffect, useState } from "react";

const FOCUS_ITEMS = [
  "Next.js & PostgreSQL Web Apps",
  "Self-Hosted n8n Automations",
  "Grounded AI Support & Sales Agents",
  "Accessible Brand & Visual Systems",
  "Reproducible 3D & Media Pipelines",
] as const;

/**
 * Subtle rotating studio focus pill.
 * - Pauses on hover/focus.
 * - Renders a clean static summary under `prefers-reduced-motion: reduce`.
 * - Screen-reader friendly (`aria-hidden` on cycling label, static full text in `.visually-hidden`).
 */
export function ChangingFocus() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % FOCUS_ITEMS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  return (
    <div
      className="focus-ticker"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="focus-ticker__dot" aria-hidden="true" />
      <span className="focus-ticker__label">Now building:</span>
      <span className="focus-ticker__value" aria-hidden="true" key={reduced ? "static" : index}>
        {reduced ? "Web Apps · AI Agents · n8n · Brand Systems" : FOCUS_ITEMS[index]}
      </span>
      <span className="visually-hidden">
        Core studio focus areas: {FOCUS_ITEMS.join(", ")}.
      </span>
    </div>
  );
}

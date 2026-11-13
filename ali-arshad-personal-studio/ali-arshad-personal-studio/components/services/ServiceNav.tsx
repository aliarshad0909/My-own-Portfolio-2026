"use client";

import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/services";

/**
 * Sticky service navigation with an active-section indicator.
 *
 * Scroll position is tracked with IntersectionObserver rather than a scroll
 * handler, so there is no work on the main thread between sections. The
 * observer's root margin pins "active" to whichever section occupies the band
 * just below the sticky bar; without it the last section can never become
 * active, because a short final section never reaches the middle of the
 * viewport.
 *
 * The links are real anchors, so the page works with JavaScript disabled and
 * deep links from other routes (/services#ai-automation) still land correctly.
 */
export function ServiceNav({ services }: { services: Service[] }) {
  const [active, setActive] = useState(services[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = services
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // The observer root is collapsed to a single horizontal line just below the
    // sticky bar. Because the sections are contiguous, exactly one of them can
    // cross that line at a time, so "active" is unambiguous.
    //
    // Ranking by intersectionRatio instead does not work here: the ratio is a
    // fraction of each target, so a tall section is never more than partly
    // visible while a short one reaches 1.0, and the indicator sticks to the
    // shortest section on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-172px 0px -100% 0px", threshold: 0 },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [services]);

  // Keep the active chip in view on the mobile horizontal scroller.
  //
  // The container's scrollLeft is set directly rather than calling
  // chip.scrollIntoView(): that method also moves the document's sequential
  // focus navigation starting point, so the next Tab would jump into this nav
  // and skip the skip link and the header entirely.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const chip = list.querySelector<HTMLElement>(`[data-service="${active}"]`);
    if (!chip) return;

    const left = chip.offsetLeft - list.offsetLeft;
    const right = left + chip.offsetWidth;
    const viewLeft = list.scrollLeft;
    const viewRight = viewLeft + list.clientWidth;
    if (left >= viewLeft && right <= viewRight) return; // already visible

    const target = left - (list.clientWidth - chip.offsetWidth) / 2;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav className="service-nav" aria-label="Service areas">
      <div className="container">
        <ul className="service-nav__list" ref={listRef}>
          {services.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                data-service={s.id}
                className={`service-nav__link ${active === s.id ? "is-active" : ""}`.trim()}
                aria-current={active === s.id ? "true" : undefined}
              >
                <span className="service-nav__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.shortTitle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

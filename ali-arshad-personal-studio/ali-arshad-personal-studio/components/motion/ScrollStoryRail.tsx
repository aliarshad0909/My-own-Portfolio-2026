"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type ScrollStoryStep = {
  step: string;
  label: string;
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
};

type Props = {
  eyebrow: string;
  heading: string;
  lead: string;
  steps: ScrollStoryStep[];
  id?: string;
};

/**
 * Meaningful, non-intrusive GSAP ScrollTrigger storytelling rail.
 *
 * Accessibility & reading safety:
 *  - Never hijacks wheel scrolling or blocks keyboard navigation.
 *  - All steps are 100% visible in SSR HTML at full contrast from frame 0.
 *  - On desktop (>= 900px) with `prefers-reduced-motion: no-preference`, GSAP
 *    ScrollTrigger smoothly drives a coral progress indicator and highlights
 *    the step currently aligned in the reading viewport.
 */
export function ScrollStoryRail({ eyebrow, heading, lead, steps, id }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 900px)").matches) return;

    let ctx: { revert: () => void } | null = null;
    let cancelled = false;
    let started = false;

    const initGsap = async () => {
      if (started || cancelled) return;
      started = true;
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !containerRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        if (progressRef.current) {
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0.14 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 72%",
                end: "bottom 42%",
                scrub: 0.35,
              },
            },
          );
        }

        const cards = containerRef.current?.querySelectorAll<HTMLElement>("[data-story-step]");
        cards?.forEach((card, idx) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top 68%",
            end: "bottom 38%",
            onEnter: () => setActiveIndex(idx),
            onEnterBack: () => setActiveIndex(idx),
          });
        });
      }, containerRef);
    };

    // Defer GSAP chunk download until the rail approaches the viewport so initial hero paint stays instant.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void initGsap();
        }
      },
      { rootMargin: "260px 0px" },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      ctx?.revert();
    };
  }, [steps.length]);

  return (
    <div ref={containerRef} className="story-rail panel" id={id}>
      <div className="story-rail__head">
        <div>
          <p className="eyebrow eyebrow--plain">{eyebrow}</p>
          <h2 className="section-title section-title--sm">{heading}</h2>
        </div>
        <p className="section-sub" style={{ marginTop: 0 }}>
          {lead}
        </p>
      </div>

      <div className="story-rail__track" aria-hidden="true">
        <div ref={progressRef} className="story-rail__fill" />
      </div>

      <ol className="story-rail__grid">
        {steps.map((s, i) => (
          <li
            key={s.step}
            data-story-step={i}
            className={`story-rail__card ${activeIndex === i ? "is-active" : ""}`.trim()}
          >
            <div className="story-rail__top">
              <span className="hub-process__num">{s.step}</span>
              <span className="story-rail__label">{s.label}</span>
            </div>
            <h3 className="story-rail__title">{s.title}</h3>
            <p className="story-rail__detail">{s.detail}</p>
            {s.href && s.linkLabel ? (
              <Link href={s.href} className="arrow-link story-rail__link">
                <span>{s.linkLabel}</span>
                <Icon name="arrow-right" size={14} />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

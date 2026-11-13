"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { THREADS, type ExperienceEntry, type ExperienceKind } from "@/lib/experience";
import { PROJECTS } from "@/lib/projects";

type Filter = "all" | ExperienceKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "work", label: "Work" },
  { id: "internship", label: "Internships" },
  { id: "education", label: "Education" },
];

const KIND: Record<ExperienceKind, { label: string; icon: IconName }> = {
  work: { label: "Experience", icon: "briefcase" },
  internship: { label: "Internship", icon: "clock" },
  education: { label: "Education", icon: "graduation" },
};

/**
 * Career timeline with a kind filter and expandable detail.
 *
 * It only ever renders what lib/experience.ts contains. Where a period,
 * employer or exact title is not set, nothing is shown in its place — no
 * "2023 – present", no placeholder company. Those fields appear the moment
 * they are filled in, and nowhere before.
 *
 * Everything is rendered server-side with every entry expanded; the filter
 * and the expand/collapse are enhancements layered on top, so the content is
 * complete with JavaScript disabled.
 */
export function ExperienceTimeline({ entries }: { entries: ExperienceEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const groupId = useId();

  const visible = useMemo(() => (filter === "all" ? entries : entries.filter((e) => e.kind === filter)), [entries, filter]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = visible.every((e) => open.has(e.id));

  return (
    <div className="xp">
      <div className="xp__controls">
        <div className="filter-bar" role="group" aria-label="Filter the timeline">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-chip ${filter === f.id ? "is-active" : ""}`.trim()}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="xp__toggle-all"
          onClick={() => setOpen(allOpen ? new Set() : new Set(entries.map((e) => e.id)))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? "entry" : "entries"} shown.
      </p>

      <ol className="xp__list">
        {visible.map((e, i) => {
          const isOpen = open.has(e.id);
          const panelId = `${groupId}-${e.id}`;
          const related = (e.relatedSlugs ?? [])
            .map((slug) => PROJECTS.find((p) => p.slug === slug))
            .filter((p): p is NonNullable<typeof p> => p !== undefined);
          const thread = THREADS[e.thread];

          return (
            <li key={e.id} className={`xp__item xp__item--${e.thread} reveal`} data-kind={e.kind}>
              <span className="xp__rail" aria-hidden="true">
                <span className="xp__dot">
                  <Icon name={KIND[e.kind].icon} size={15} />
                </span>
              </span>

              <article className="xp__card" aria-labelledby={`${panelId}-title`}>
                <header className="xp__head">
                  <div className="xp__meta">
                    <span className="badge badge--neutral">{KIND[e.kind].label}</span>
                    <span className={`xp__thread xp__thread--${e.thread}`}>{thread.label}</span>
                    {e.period ? <span className="xp__period">{e.period}</span> : null}
                  </div>
                  <h3 className="xp__title" id={`${panelId}-title`}>
                    {e.title ?? e.area}
                  </h3>
                  {(e.title && e.kind !== "education") || e.organization ? (
                    <p className="xp__org">{[e.title && e.kind !== "education" ? e.area : null, e.organization].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  <button
                    type="button"
                    className="xp__expand"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(e.id)}
                  >
                    <span>{isOpen ? "Hide detail" : "Show detail"}</span>
                    <Icon name="arrow-right" size={14} className={`xp__chev ${isOpen ? "is-open" : ""}`.trim()} />
                  </button>
                </header>

                <div id={panelId} className="xp__body" hidden={!isOpen}>
                  <p className="xp__summary">{e.summary}</p>

                  <div className="xp__cols">
                    <div>
                      <h4 className="label">Responsibilities</h4>
                      <ul className="check-list">
                        {e.highlights.map((h) => (
                          <li key={h}>
                            <Icon name="check" size={15} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {related.length > 0 ? (
                      <div>
                        <h4 className="label">Demonstrated in</h4>
                        <ul className="xp__related">
                          {related.map((p) => (
                            <li key={p.slug}>
                              <Link href={p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`} className="xp__related-link">
                                <span>{p.title}</span>
                                <Icon name="arrow-up-right" size={14} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <p className="xp__related-note">Portfolio demonstrations of this kind of work, not deliverables for an employer.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>

              {i < visible.length - 1 ? <span className="xp__connector" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      {visible.length === 0 ? <p className="muted">Nothing in this category yet.</p> : null}
    </div>
  );
}

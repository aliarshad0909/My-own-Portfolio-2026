"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from "@/lib/projects";

type Filter = "All" | ProjectCategory;
const FILTERS: Filter[] = ["All", ...PROJECT_CATEGORIES];

export function WorkGallery({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const visible = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.categories.includes(filter))),
    [filter, projects],
  );

  return (
    <div className="work-gallery">
      <div className="filter-bar" role="group" aria-label="Filter projects by category">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`filter-chip ${filter === f ? "is-active" : ""}`.trim()} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {visible.length === 1 ? "1 project shown" : `${visible.length} projects shown`} for {filter}.
      </p>

      {visible.length > 0 ? (
        <div className="project-grid">
          {visible.map((p) => (
            <ProjectCard key={p.slug} project={p} showRole headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="empty-state__title">Nothing published in {filter} yet</h2>
          <p>Work in this category is being prepared for the portfolio. If you have a project like this in mind, I&rsquo;m happy to talk it through.</p>
          <div className="empty-state__actions">
            <button type="button" className="btn btn--secondary btn--md" onClick={() => setFilter("All")}>
              <span>Show all projects</span>
            </button>
            <ButtonLink href="/contact">Discuss a project</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

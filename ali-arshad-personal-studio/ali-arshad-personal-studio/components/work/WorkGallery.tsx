"use client";

import { useEffect, useMemo, useState } from "react";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from "@/lib/projects";
import { SERVICES } from "@/lib/services";

type Filter = "All" | ProjectCategory;
const FILTERS: Filter[] = ["All", ...PROJECT_CATEGORIES];

/**
 * Reads ?service=<id> so "View related work" on /services lands on the right
 * subset. The parameter is read from the URL after mount rather than through
 * useSearchParams, so the page stays statically rendered and needs no Suspense
 * boundary; the server-rendered markup is the full gallery, which is also what
 * a crawler should see.
 */
function serviceFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("service");
  if (!id) return null;
  return SERVICES.some((s) => s.id === id) ? id : null;
}

export function WorkGallery({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    setServiceId(serviceFromLocation());
  }, []);

  const service = serviceId ? SERVICES.find((s) => s.id === serviceId) : undefined;

  const visible = useMemo(() => {
    let list = projects;
    if (service) list = list.filter((p) => service.projectSlugs.includes(p.slug));
    if (filter !== "All") list = list.filter((p) => p.categories.includes(filter));
    return list;
  }, [filter, projects, service]);

  const clearService = () => {
    setServiceId(null);
    // Drop the parameter so a refresh or a shared link matches what is on screen.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("service");
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <div className="work-gallery">
      {service ? (
        <div className="active-filter" role="status">
          <span>
            Showing work behind <strong>{service.title}</strong>
          </span>
          <button type="button" className="active-filter__clear" onClick={clearService}>
            Show all projects
          </button>
        </div>
      ) : null}

      <div className="filter-bar" role="group" aria-label="Filter projects by category">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`filter-chip ${filter === f ? "is-active" : ""}`.trim()} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {visible.length === 1 ? "1 project shown" : `${visible.length} projects shown`} for {filter}
        {service ? ` within ${service.title}` : ""}.
      </p>

      {visible.length > 0 ? (
        <div className="project-grid">
          {visible.map((p) => (
            <ProjectCard key={p.slug} project={p} showRole headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="empty-state__title">
            Nothing in {filter}
            {service ? ` for ${service.title}` : ""} yet
          </h2>
          <p>Work in this category is being prepared for the portfolio. If you have a project like this in mind, I&rsquo;m happy to talk it through.</p>
          <div className="empty-state__actions">
            <button
              type="button"
              className="btn btn--secondary btn--md"
              onClick={() => {
                setFilter("All");
                clearService();
              }}
            >
              <span>Show all projects</span>
            </button>
            <ButtonLink href="/contact">Discuss a project</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

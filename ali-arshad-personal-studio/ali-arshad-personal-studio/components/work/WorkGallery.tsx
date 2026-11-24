"use client";

import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectCard } from "@/components/work/ProjectCard";
import { PROJECT_CATEGORIES, type Project } from "@/lib/projects";
import { SERVICES } from "@/lib/services";
import {
  AVAILABILITY_OPTIONS,
  STACK_FILTERS,
  filterProjects,
  type AvailabilityFilter,
  type CategoryFilter,
  type StackFilterId,
} from "@/lib/work-finder";

const CATEGORY_FILTERS: CategoryFilter[] = ["All", ...PROJECT_CATEGORIES];

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
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [stackId, setStackId] = useState<StackFilterId>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setServiceId(serviceFromLocation());
  }, []);

  const service = serviceId ? SERVICES.find((s) => s.id === serviceId) : undefined;

  const visible = useMemo(
    () =>
      filterProjects(projects, {
        category,
        serviceId,
        availability,
        stackId,
        query,
      }),
    [availability, category, projects, query, serviceId, stackId],
  );

  const hasActiveFilters =
    category !== "All" ||
    serviceId !== null ||
    availability !== "all" ||
    stackId !== "all" ||
    query.trim() !== "";

  const syncServiceUrl = (nextId: string | null) => {
    setServiceId(nextId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextId) url.searchParams.set("service", nextId);
      else url.searchParams.delete("service");
      window.history.replaceState({}, "", url);
    }
  };

  const resetAll = () => {
    setCategory("All");
    setAvailability("all");
    setStackId("all");
    setQuery("");
    syncServiceUrl(null);
  };

  return (
    <div className="work-gallery">
      <div className="panel work-finder" aria-label="Project finder controls">
        <div className="work-finder__row">
          <label className="work-finder__field">
            <span className="work-finder__label">Search builds &amp; tech</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PostgreSQL, n8n, BM25, CRM, Blender..."
              className="work-finder__input"
              aria-label="Search portfolio projects by title, problem, or technology"
            />
          </label>

          <label className="work-finder__field">
            <span className="work-finder__label">Service area</span>
            <select
              value={serviceId ?? ""}
              onChange={(e) => syncServiceUrl(e.target.value || null)}
              className="work-finder__select"
              aria-label="Filter projects by studio service"
            >
              <option value="">All 6 studio services</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <label className="work-finder__field">
            <span className="work-finder__label">Technology stack</span>
            <select
              value={stackId}
              onChange={(e) => setStackId(e.target.value as StackFilterId)}
              className="work-finder__select"
              aria-label="Filter projects by technology stack"
            >
              {STACK_FILTERS.map((sf) => (
                <option key={sf.id} value={sf.id}>
                  {sf.label}
                </option>
              ))}
            </select>
          </label>

          <label className="work-finder__field">
            <span className="work-finder__label">Demo availability</span>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as AvailabilityFilter)}
              className="work-finder__select"
              aria-label="Filter projects by demo status"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="work-finder__bottom">
          <div className="filter-bar" role="group" aria-label="Filter projects by category">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${category === f ? "is-active" : ""}`.trim()}
                aria-pressed={category === f}
                onClick={() => setCategory(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="work-finder__meta">
            <span className="work-finder__count" role="status" aria-live="polite">
              Showing <strong>{visible.length}</strong> of {projects.length} studio builds
              {service ? ` · ${service.shortTitle}` : ""}
            </span>
            {hasActiveFilters ? (
              <button type="button" className="active-filter__clear" onClick={resetAll}>
                Reset filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="project-grid">
          {visible.map((p) => (
            <ProjectCard key={p.slug} project={p} showRole headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="empty-state__title">No matching builds for that filter combination</h2>
          <p>
            Try clearing one of the active filters to see related studio demonstrations, or reach out directly if you have a specific build in mind.
          </p>
          <div className="empty-state__actions">
            <button type="button" className="btn btn--secondary btn--md" onClick={resetAll}>
              <span>Show all {projects.length} projects</span>
            </button>
            <ButtonLink href="/contact">Discuss a project</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

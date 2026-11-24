"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectCard } from "@/components/work/ProjectCard";
import type { Project } from "@/lib/projects";
import { SERVICES } from "@/lib/services";
import {
  CURATED_FEATURED_SLUGS,
  WORK_COLLECTIONS,
  collectionForProject,
  groupProjectsByCollection,
  type WorkCollectionId,
} from "@/lib/work-collections";
import {
  AVAILABILITY_OPTIONS,
  STACK_FILTERS,
  filterProjects,
  type AvailabilityFilter,
  type StackFilterId,
} from "@/lib/work-finder";

function readInitialParams(): { serviceId: string | null; collectionId: WorkCollectionId | "all" } {
  if (typeof window === "undefined") return { serviceId: null, collectionId: "all" };
  const params = new URLSearchParams(window.location.search);
  const rawService = params.get("service");
  const rawCol = params.get("collection");
  const serviceId = rawService && SERVICES.some((s) => s.id === rawService) ? rawService : null;
  const collectionId =
    rawCol && WORK_COLLECTIONS.some((c) => c.id === rawCol) ? (rawCol as WorkCollectionId) : "all";
  return { serviceId, collectionId };
}

export function WorkGallery({ projects }: { projects: Project[] }) {
  const [collectionId, setCollectionId] = useState<WorkCollectionId | "all">("all");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [stackId, setStackId] = useState<StackFilterId>("all");
  const [query, setQuery] = useState("");
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const init = readInitialParams();
    setServiceId(init.serviceId);
    setCollectionId(init.collectionId);
  }, []);

  const service = serviceId ? SERVICES.find((s) => s.id === serviceId) : undefined;
  const activeCollection = collectionId !== "all" ? WORK_COLLECTIONS.find((c) => c.id === collectionId) : undefined;

  const featuredBuilds = useMemo(
    () =>
      CURATED_FEATURED_SLUGS.map((slug) => projects.find((p) => p.slug === slug)).filter(
        (p): p is Project => Boolean(p),
      ),
    [projects],
  );

  // Per-collection counts across the full catalog (used on the 7 collection nav pills)
  const collectionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      const id = collectionForProject(p);
      map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  }, [projects]);

  const visible = useMemo(() => {
    const base = filterProjects(projects, {
      category: "All",
      serviceId,
      availability,
      stackId,
      query,
    });
    if (collectionId === "all") return base;
    return base.filter((p) => collectionForProject(p) === collectionId);
  }, [availability, collectionId, projects, query, serviceId, stackId]);

  const groupedCollections = useMemo(() => groupProjectsByCollection(visible), [visible]);

  const hasActiveFilters =
    collectionId !== "all" ||
    serviceId !== null ||
    availability !== "all" ||
    stackId !== "all" ||
    query.trim() !== "";

  const syncUrlParams = (nextService: string | null, nextCol: WorkCollectionId | "all") => {
    setServiceId(nextService);
    setCollectionId(nextCol);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextService) url.searchParams.set("service", nextService);
      else url.searchParams.delete("service");
      if (nextCol !== "all") url.searchParams.set("collection", nextCol);
      else url.searchParams.delete("collection");
      window.history.replaceState({}, "", url);
    }
  };

  const resetAll = () => {
    setAvailability("all");
    setStackId("all");
    setQuery("");
    setExpandedCollections({});
    syncUrlParams(null, "all");
  };

  const toggleExpandCollection = (id: string) => {
    setExpandedCollections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="work-gallery">
      {/* 1. Curated Flagship Spotlight — shown cleanly in default unfiltered browse view */}
      {!hasActiveFilters ? (
        <section className="work-curated" aria-labelledby="curated-spotlight-title">
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow eyebrow--plain">Curated highlights · Verified builds</p>
              <h2 className="section-title section-title--sm" id="curated-spotlight-title">
                Start with the strongest representative builds
              </h2>
            </div>
            <p className="section-sub section-sub--inline">
              Six multi-screen flagship demonstrations spanning live SaaS sandboxes, e-commerce, grounded AI agents, n8n
              automation, and executive analytics.
            </p>
          </div>

          <div className="project-grid">
            {featuredBuilds.map((p) => (
              <ProjectCard
                key={p.slug}
                project={p}
                linkTo={p.caseStudy && !p.isCatalogExpansion ? "case-study" : "detail"}
                showRole
                headingLevel="h3"
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Collection Navigation & Smart Finder Controls */}
      <div className="panel work-finder" aria-label="Collection navigation and project finder">
        <div className="work-collections-nav">
          <p className="work-finder__label">Browse by problem area (7 collections)</p>
          <div className="filter-bar" role="group" aria-label="Filter projects by collection">
            <button
              type="button"
              className={`filter-chip ${collectionId === "all" ? "is-active" : ""}`.trim()}
              aria-pressed={collectionId === "all"}
              onClick={() => syncUrlParams(serviceId, "all")}
            >
              All Collections ({projects.length})
            </button>
            {WORK_COLLECTIONS.map((col) => (
              <button
                key={col.id}
                type="button"
                className={`filter-chip ${collectionId === col.id ? "is-active" : ""}`.trim()}
                aria-pressed={collectionId === col.id}
                onClick={() => syncUrlParams(serviceId, col.id)}
              >
                {col.shortTitle} ({collectionCounts[col.id] ?? 0})
              </button>
            ))}
          </div>
        </div>

        <div className="work-finder__row">
          <label className="work-finder__field">
            <span className="work-finder__label">Search builds &amp; tech</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PostgreSQL, n8n, MCP, CRM, Blender, Signal..."
              className="work-finder__input"
              aria-label="Search portfolio projects by title, problem, or technology"
            />
          </label>

          <label className="work-finder__field">
            <span className="work-finder__label">Build status</span>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as AvailabilityFilter)}
              className="work-finder__select"
              aria-label="Filter projects by build status"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="work-finder__field">
            <span className="work-finder__label">Service area</span>
            <select
              value={serviceId ?? ""}
              onChange={(e) => syncUrlParams(e.target.value || null, collectionId)}
              className="work-finder__select"
              aria-label="Filter projects by studio service"
            >
              <option value="">All studio services</option>
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
        </div>

        <div className="work-finder__meta">
          <span className="work-finder__count" role="status" aria-live="polite">
            {hasActiveFilters ? (
              <>
                Showing <strong>{visible.length}</strong> matching build{visible.length === 1 ? "" : "s"}
                {activeCollection ? ` in ${activeCollection.title}` : ""}
                {service ? ` · ${service.shortTitle}` : ""}
              </>
            ) : (
              <>
                Organized into <strong>7 collections</strong> covering <strong>{projects.length}</strong> builds,
                prototypes, concepts &amp; personal games — showing representative highlights first.
              </>
            )}
          </span>
          {hasActiveFilters ? (
            <button type="button" className="active-filter__clear" onClick={resetAll}>
              Reset filters
            </button>
          ) : null}
        </div>
      </div>

      {/* 3. Results: Curated Collection Bands (default) OR Focused Filtered View */}
      {visible.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">No matching builds for that filter combination</h2>
          <p>
            Try clearing one of the active filters to explore related studio demonstrations, or reach out directly if you
            have a specific build in mind.
          </p>
          <div className="empty-state__actions">
            <button type="button" className="btn btn--secondary btn--md" onClick={resetAll}>
              <span>Show all collections</span>
            </button>
            <ButtonLink href="/contact">Discuss a project</ButtonLink>
          </div>
        </div>
      ) : hasActiveFilters ? (
        <div className="work-filtered-results">
          {activeCollection ? (
            <div className="panel work-collection-banner">
              <div className="work-collection-banner__copy">
                <div className="work-collection-band__title-row">
                  <Icon name={activeCollection.icon} size={20} className="work-collection-band__icon" />
                  <h2 className="section-title section-title--sm">{activeCollection.title}</h2>
                  <span className="mono-tag">{visible.length} builds</span>
                </div>
                <p className="section-sub">{activeCollection.summary}</p>
                <p className="fine-print">{activeCollection.deliveryNote}</p>
              </div>
              <Link href={activeCollection.serviceHref} className="btn btn--secondary btn--sm">
                <span>{activeCollection.serviceLabel}</span>
                <Icon name="arrow-up-right" size={15} />
              </Link>
            </div>
          ) : null}

          <div className="project-grid">
            {visible.map((p) => (
              <ProjectCard
                key={p.slug}
                project={p}
                linkTo={p.caseStudy && !p.isCatalogExpansion ? "case-study" : "detail"}
                showRole
                headingLevel="h2"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="work-collection-bands">
          {groupedCollections.map(({ collection, items }) => {
            const isExpanded = Boolean(expandedCollections[collection.id]);
            const topCards = items.slice(0, collection.previewLimit);
            const restItems = items.slice(collection.previewLimit);

            return (
              <section
                key={collection.id}
                id={`collection-${collection.id}`}
                className="work-collection-band"
                aria-labelledby={`col-heading-${collection.id}`}
              >
                <div className="work-collection-band__head">
                  <div className="work-collection-band__meta">
                    <div className="work-collection-band__title-row">
                      <span className="work-collection-band__icon" aria-hidden="true">
                        <Icon name={collection.icon} size={18} />
                      </span>
                      <h2 className="section-title section-title--sm" id={`col-heading-${collection.id}`}>
                        {collection.title}
                      </h2>
                      <span className="mono-tag work-collection-band__count">{items.length} entries</span>
                    </div>
                    <p className="section-sub">{collection.summary}</p>
                    <p className="fine-print">{collection.deliveryNote}</p>
                  </div>

                  <div className="work-collection-band__actions">
                    <Link href={collection.serviceHref} className="location-pill location-pill--all">
                      {collection.serviceLabel} →
                    </Link>
                    <button
                      type="button"
                      className="chip chip--sm"
                      onClick={() => syncUrlParams(serviceId, collection.id)}
                    >
                      Open full collection ({items.length})
                    </button>
                  </div>
                </div>

                {/* Top representative visual cards (real screenshots / bespoke visuals / GameCoverArt) */}
                <div className="project-grid project-grid--2x2">
                  {topCards.map((p) => (
                    <ProjectCard
                      key={p.slug}
                      project={p}
                      linkTo={p.caseStudy && !p.isCatalogExpansion ? "case-study" : "detail"}
                      headingLevel="h3"
                    />
                  ))}
                </div>

                {/* Compact comparison index for the remaining related prototypes/concepts/games */}
                {restItems.length > 0 ? (
                  <div className="work-collection-more">
                    <button
                      type="button"
                      className="work-collection-more__toggle"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpandCollection(collection.id)}
                    >
                      <span>
                        {isExpanded
                          ? `Hide ${restItems.length} additional ${collection.shortTitle.toLowerCase()} builds`
                          : `Compare ${restItems.length} more ${collection.shortTitle.toLowerCase()} builds, prototypes & concepts`}
                      </span>
                      <Icon name="arrow-right" size={15} className={isExpanded ? "is-rotated" : ""} />
                    </button>

                    {isExpanded ? (
                      <ul className="work-compare-list" aria-label={`Additional builds in ${collection.title}`}>
                        {restItems.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={item.playUrl ? `/work/${item.slug}` : `/work/${item.slug}`}
                              className="work-compare-row"
                            >
                              <div className="work-compare-row__main">
                                <strong>{item.title}</strong>
                                <p>{item.summary}</p>
                              </div>
                              <div className="work-compare-row__side">
                                <StatusBadge status={item.status} />
                                <span className="work-compare-row__stack">
                                  {item.technologies.slice(0, 3).join(" · ")}
                                </span>
                                {item.sourceRepoPath ? (
                                  <code className="work-compare-row__repo">{item.sourceRepoPath}</code>
                                ) : null}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

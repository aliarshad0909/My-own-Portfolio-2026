"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ResourcePreviewMedia } from "@/components/creator-library/ResourcePreviewMedia";
import { Icon } from "@/components/ui/Icon";
import {
  CREATOR_LIBRARY_CATEGORIES,
  CREATOR_LIBRARY_PATH,
  type CreatorLibraryCategory,
  type CreatorLibraryItem,
} from "@/lib/creator-library";

type Props = {
  items: readonly CreatorLibraryItem[];
};

type OriginFilter = "all" | "third-party" | "studio";
type SortKey = "featured" | "smallest" | "largest" | "az";

export function CreatorLibraryBrowser({ items }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CreatorLibraryCategory>("all");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const c of CREATOR_LIBRARY_CATEGORIES) {
      map[c] = items.filter((i) => i.category === c).length;
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (origin === "third-party" && !item.isThirdParty) return false;
      if (origin === "studio" && item.isThirdParty) return false;
      if (!q) return true;
      const hay = [
        item.title,
        item.category,
        item.summary,
        item.fileFormat,
        item.compatibility,
        item.creatorCredit,
        item.licenseLabel,
        item.sourceFilename,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    if (sort === "smallest") return [...list].sort((a, b) => a.sizeBytes - b.sizeBytes);
    if (sort === "largest") return [...list].sort((a, b) => b.sizeBytes - a.sizeBytes);
    if (sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [items, query, category, origin, sort]);

  return (
    <div className="clib-browser">
      <div className="panel clib-controls">
        <div className="clib-controls__row">
          <div className="clib-search">
            <label htmlFor="clib-search-input" className="visually-hidden">
              Search Creator Resource Library
            </label>
            <input
              id="clib-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Blender, After Effects, transitions, Oculus SFX, WAV, CC0, Mixkit..."
              className="clib-input"
            />
          </div>

          <div className="clib-selects">
            <label className="clib-select-wrap">
              <span className="visually-hidden">Filter by origin</span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as OriginFilter)}
                className="clib-select"
                aria-label="Filter by asset origin"
              >
                <option value="all">All Sources ({items.length})</option>
                <option value="third-party">Curated Third-Party Assets</option>
                <option value="studio">Ali Arshad Studio Originals</option>
              </select>
            </label>

            <label className="clib-select-wrap">
              <span className="visually-hidden">Sort resources</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="clib-select"
                aria-label="Sort resources"
              >
                <option value="featured">Sort: Featured</option>
                <option value="smallest">Sort: Smallest First</option>
                <option value="largest">Sort: Largest First</option>
                <option value="az">Sort: Title A–Z</option>
              </select>
            </label>
          </div>
        </div>

        <div className="clib-pills" role="tablist" aria-label="Filter library by category">
          <button
            type="button"
            role="tab"
            aria-selected={category === "all"}
            className={`location-pill ${category === "all" ? "location-pill--all" : ""}`.trim()}
            onClick={() => setCategory("all")}
          >
            All Categories ({categoryCounts.all})
          </button>
          {CREATOR_LIBRARY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              className={`location-pill ${category === cat ? "location-pill--all" : ""}`.trim()}
              onClick={() => setCategory(cat)}
            >
              {cat} ({categoryCounts[cat] ?? 0})
            </button>
          ))}
        </div>

        <div className="clib-results-bar">
          <p className="fine-print">
            Showing <strong>{filtered.length}</strong> of {items.length} downloadable resource packages
            {query.trim() ? ` matching “${query.trim()}”` : ""}.
          </p>
          {query || category !== "all" || origin !== "all" ? (
            <button
              type="button"
              className="clib-reset"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setOrigin("all");
                setSort("featured");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "20px" }}>
          <h3 className="empty-state__title">No resources match that filter</h3>
          <p>Try broadening your keyword (for example “Blender”, “Premiere”, “Oculus”, or “CC0”) or reset filters.</p>
          <div className="empty-state__actions">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setOrigin("all");
              }}
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card-grid card-grid--3 clib-grid">
          {filtered.map((item) => (
            <article key={item.slug} className="panel clib-card">
              <ResourcePreviewMedia item={item} mode="card" />

              <div className="clib-card__body">
                <div className="clib-card__top">
                  <span className="clib-card__cat">{item.category}</span>
                  <span className={`badge ${item.isThirdParty ? "badge--concept" : "badge--demo"}`}>
                    {item.isThirdParty ? "Curated Third-Party" : "Studio Original"}
                  </span>
                </div>

                <h3 className="card-title clib-card__title">
                  <Link href={`${CREATOR_LIBRARY_PATH}/${item.slug}`}>{item.title}</Link>
                </h3>

                <p className="clib-card__summary">{item.summary}</p>

                <dl className="clib-card__specs">
                  <div>
                    <dt>Format</dt>
                    <dd>{item.fileFormat}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{item.sizeLabel}</dd>
                  </div>
                  <div>
                    <dt>Creator / Source</dt>
                    <dd>{item.creatorCredit}</dd>
                  </div>
                  <div>
                    <dt>License</dt>
                    <dd>{item.licenseLabel}</dd>
                  </div>
                </dl>

                <div className="clib-card__actions">
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.downloadFilename}
                    className="btn btn--primary btn--sm"
                  >
                    <span>Download ({item.sizeLabel})</span>
                    <Icon name="arrow-up-right" size={14} className="btn__icon" />
                  </a>
                  <Link href={`${CREATOR_LIBRARY_PATH}/${item.slug}`} className="btn btn--secondary btn--sm">
                    <span>Details</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

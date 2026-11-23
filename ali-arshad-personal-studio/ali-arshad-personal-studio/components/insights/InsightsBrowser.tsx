"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InsightCoverArt } from "@/components/insights/InsightCoverArt";
import { Icon } from "@/components/ui/Icon";
import {
  INSIGHT_CATEGORIES,
  type InsightCategory,
  type InsightKind,
  type InsightPost,
} from "@/lib/content/insights";

const KINDS: ("All" | InsightKind)[] = ["All", "Project Notes", "Original Opinion", "Sourced Guide"];

export function InsightsBrowser({ posts }: { posts: InsightPost[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | InsightCategory>("All");
  const [kind, setKind] = useState<"All" | InsightKind>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "All" && post.category !== category) return false;
      if (kind !== "All" && post.kind !== kind) return false;
      if (!q) return true;
      const hay = `${post.title} ${post.excerpt} ${post.category} ${post.kind} ${post.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [posts, query, category, kind]);

  return (
    <div className="insights-browser">
      <div className="insights-controls">
        <div className="insights-search">
          <label htmlFor="insights-query" className="sr-only">
            Search insights
          </label>
          <input
            id="insights-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search build notes, AI automation, PostgreSQL, motion…"
            className="insights-search__input"
          />
        </div>

        <div className="insights-filters" role="group" aria-label="Filter by content type">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`filter-pill ${kind === k ? "is-active" : ""}`}
              aria-pressed={kind === k}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="insights-filters" role="group" aria-label="Filter by topic category">
          <button
            type="button"
            onClick={() => setCategory("All")}
            className={`filter-pill ${category === "All" ? "is-active" : ""}`}
            aria-pressed={category === "All"}
          >
            All topics
          </button>
          {INSIGHT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`filter-pill ${category === cat ? "is-active" : ""}`}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ marginTop: "20px" }}>
          <p className="card-title">No matching articles</p>
          <p className="section-sub">Try clearing your search or switching back to all topics.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            style={{ marginTop: "12px" }}
            onClick={() => {
              setQuery("");
              setCategory("All");
              setKind("All");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="insights-grid">
          {filtered.map((post) => (
            <article key={post.slug} className="insight-card">
              <Link href={`/insights/${post.slug}`} className="insight-card__media" aria-label={`Read ${post.title}`}>
                <InsightCoverArt variant={post.coverVariant} title={post.title} />
              </Link>
              <div className="insight-card__body">
                <div className="insight-card__meta">
                  <span className="badge badge--type">{post.kind}</span>
                  <span className="insight-card__cat">{post.category}</span>
                </div>
                <h2 className="insight-card__title">
                  <Link href={`/insights/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="insight-card__excerpt">{post.excerpt}</p>
                <div className="insight-card__foot">
                  <span>
                    {post.publishedAt} · {post.readingMinutes} min read
                  </span>
                  <Link href={`/insights/${post.slug}`} className="insight-card__go">
                    <span>Read</span>
                    <Icon name="arrow-right" size={14} />
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

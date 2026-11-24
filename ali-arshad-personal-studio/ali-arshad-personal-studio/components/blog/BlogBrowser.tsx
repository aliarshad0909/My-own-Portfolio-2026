"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  BLOG_CATEGORIES,
  estimateReadingMinutes,
  type BlogCategory,
  type BlogPost,
} from "@/lib/content/blog";

export function BlogBrowser({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<"All" | BlogCategory>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (q) {
        const hay = `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [category, posts, query]);

  return (
    <div className="games-browser">
      <div className="panel games-filter-panel" aria-label="Filter blog articles">
        <div className="games-filter-row">
          <div className="filter-bar" role="group" aria-label="Filter articles by category">
            {(["All", ...BLOG_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${category === cat ? "is-active" : ""}`.trim()}
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles (e.g. MCP, n8n, WCAG, games)…"
            className="work-finder__input"
            style={{ maxWidth: "340px" }}
            aria-label="Search blog articles"
          />
        </div>

        <div className="work-finder__meta">
          <span className="work-finder__count" role="status" aria-live="polite">
            Showing <strong>{visible.length}</strong> of {posts.length} published dispatches
          </span>
          {category !== "All" || query.trim() !== "" ? (
            <button
              type="button"
              className="active-filter__clear"
              onClick={() => {
                setCategory("All");
                setQuery("");
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="blog-grid">
          {visible.map((post) => (
            <li key={post.slug} className="blog-card">
              {post.visual ? (
                <Link href={`/blog/${post.slug}`} className="blog-card__thumb" tabIndex={-1} aria-hidden="true">
                  <Image
                    src={post.visual.src}
                    alt=""
                    width={post.visual.width}
                    height={post.visual.height}
                    sizes="(min-width: 1024px) 540px, 94vw"
                  />
                </Link>
              ) : null}
              <div className="blog-card__meta">
                <span className="badge badge--concept">{post.category}</span>
                <span>{post.publishedAt}</span>
                <span>·</span>
                <span>{estimateReadingMinutes(post)} min read</span>
              </div>
              <h2 className="card-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {post.excerpt}
              </p>
              <ul className="game-card__meta" aria-label="Article tags">
                {post.tags.slice(0, 4).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                <Link href={`/blog/${post.slug}`} className="text-link">
                  Read article <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <h2 className="empty-state__title">No articles match that filter</h2>
          <p>Reset the search or category chip to view all {posts.length} studio dispatches.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setCategory("All");
              setQuery("");
            }}
          >
            <span>Show all articles</span>
          </button>
        </div>
      )}
    </div>
  );
}

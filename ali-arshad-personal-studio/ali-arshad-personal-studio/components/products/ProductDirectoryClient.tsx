"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type StudioProduct,
} from "@/lib/products/catalog";

export function ProductDirectoryClient({ products }: { products: StudioProduct[] }) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | ProductCategory>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (q) {
        const hay = `${p.name} ${p.tagline} ${p.shortDescription} ${p.category} ${p.technologies.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCategory, query]);

  return (
    <div className="prod-dir">
      <div className="prod-dir__controls">
        <div className="prod-dir__tabs" role="tablist" aria-label="Filter products by category">
          {(["All", ...PRODUCT_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            const count =
              cat === "All"
                ? products.length
                : products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`prod-dir__tab ${active ? "is-active" : ""}`}
              >
                <span>{cat}</span>
                <span className="prod-dir__tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <label className="prod-dir__search">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, capability, or stack..."
          />
        </label>
      </div>

      <p className="fine-print prod-dir__count">
        Showing {filtered.length} of {products.length} standalone software products
      </p>

      <div className="prod-grid">
        {filtered.map((product) => (
          <article key={product.slug} className="prod-card">
            <Link
              href={`/products/${product.slug}`}
              className="prod-card__media"
              aria-label={`Inspect ${product.name}`}
            >
              <Image
                src={product.cover.src}
                alt={product.cover.alt}
                width={product.cover.width}
                height={product.cover.height}
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 48vw, 94vw"
                className={`prod-card__img ${product.cover.mobile ? "prod-card__img--mobile" : ""}`}
              />
              <span className="prod-card__cat-pill">{product.category}</span>
            </Link>

            <div className="prod-card__body">
              <div className="prod-card__head">
                <span
                  className="prod-card__logo"
                  style={{ backgroundColor: product.accentColor }}
                  aria-hidden="true"
                >
                  {product.monogram}
                </span>
                <div className="prod-card__title-wrap">
                  <h2 className="prod-card__title">
                    <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  </h2>
                  <p className="prod-card__tagline">{product.tagline}</p>
                </div>
              </div>

              <div className="prod-card__statuses">
                <span className="prod-badge prod-badge--primary">{product.status}</span>
                <span className="prod-badge prod-badge--muted">{product.secondaryStatus}</span>
                <span className="prod-badge prod-badge--theme">{product.identityLabel}</span>
              </div>

              <p className="prod-card__desc">{product.shortDescription}</p>

              <ul className="prod-card__caps" aria-label={`${product.name} key capabilities`}>
                {product.capabilities.slice(0, 3).map((cap) => (
                  <li key={cap}>
                    <Icon name="check" size={14} />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>

              <ul className="tag-list prod-card__stack" aria-label="Technology stack">
                {product.technologies.slice(0, 4).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              <div className="prod-card__actions">
                <Link href={`/products/${product.slug}`} className="btn btn--primary btn--sm">
                  <span>Inspect Product</span>
                  <Icon name="arrow-right" size={15} className="btn__icon" />
                </Link>
                {product.liveUrl ? (
                  <a
                    href={product.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--secondary btn--sm"
                  >
                    <span>Live Demo</span>
                    <Icon name="arrow-up-right" size={15} className="btn__icon" />
                  </a>
                ) : product.caseStudyUrl ? (
                  <Link href={product.caseStudyUrl} className="btn btn--secondary btn--sm">
                    <span>Case Study</span>
                  </Link>
                ) : (
                  <Link href={`/products/${product.slug}#demo-access`} className="btn btn--secondary btn--sm">
                    <span>Demo Access</span>
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PRODUCT_SOURCING_CONTACT_SERVICE } from "@/lib/sourcing";
import type {
  SourcingCatalogCategoryId,
  SourcingCatalogIndexItem,
} from "@/lib/sourcing-catalog";

const PAGE_SIZE = 24;

const CATEGORIES: { id: "all" | SourcingCatalogCategoryId; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "kitchen-appliances", label: "Kitchen Appliances" },
  { id: "bags-luggage", label: "Luggage & Travel" },
  { id: "mobile-accessories", label: "Mobile & Power" },
  { id: "lighting-solar", label: "LED & Solar Lighting" },
  { id: "toys", label: "Toys & Play" },
  { id: "apparel-sportswear", label: "Apparel & Sportswear" },
  { id: "fashion-jewelry", label: "Fashion Jewelry" },
];

type Props = {
  items: SourcingCatalogIndexItem[];
  initialCategory?: "all" | SourcingCatalogCategoryId;
};

export function SourcingCatalogBrowser({ items, initialCategory = "all" }: Props) {
  const [category, setCategory] = useState<"all" | SourcingCatalogCategoryId>(initialCategory);
  const [subcategory, setSubcategory] = useState<string>("all");
  const [specFilter, setSpecFilter] = useState<"all" | "documented" | "quote-only">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const item of items) {
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (category === "all" || item.categoryId === category) {
        set.add(item.subcategory);
      }
    }
    return ["all", ...Array.from(set).sort()];
  }, [items, category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (subcategory !== "all" && item.subcategory !== subcategory) return false;
      if (specFilter === "documented" && !item.hasSpecSheet) return false;
      if (specFilter === "quote-only" && item.hasSpecSheet) return false;
      if (q) {
        const hay = `${item.modelCode} ${item.title} ${item.categoryLabel} ${item.subcategory} ${item.referenceCode} ${item.variantCodes.join(" ")} ${item.topSpecs.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, subcategory, specFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const contactBase = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}`;

  const handleCategoryChange = (next: "all" | SourcingCatalogCategoryId) => {
    setCategory(next);
    setSubcategory("all");
    setPage(1);
  };

  return (
    <div className="catalog-browser">
      <div className="panel catalog-filter-panel" aria-label="Search and filter product sourcing catalogue">
        <div className="sourcing-catalog__bar" role="tablist" aria-label="Filter catalogue by category">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`location-pill ${active ? "location-pill--all" : ""}`.trim()}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.label} ({categoryCounts[cat.id] ?? 0})
              </button>
            );
          })}
        </div>

        <div className="catalog-filter-controls">
          <label className="catalog-filter-field">
            <span className="label">Search model, SKU, or spec</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. TS-201, HB001, PW-SP-001, B0391, N0127, GaN, Magnetic…"
              className="work-finder__input"
              aria-label="Search products by model code, title, or specification"
            />
          </label>

          <label className="catalog-filter-field">
            <span className="label">Subcategory</span>
            <select
              value={subcategory}
              onChange={(e) => {
                setSubcategory(e.target.value);
                setPage(1);
              }}
              className="work-finder__input"
            >
              {subcategories.map((sc) => (
                <option key={sc} value={sc}>
                  {sc === "all" ? "All subcategories" : sc}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-filter-field">
            <span className="label">Specification status</span>
            <select
              value={specFilter}
              onChange={(e) => {
                setSpecFilter(e.target.value as "all" | "documented" | "quote-only");
                setPage(1);
              }}
              className="work-finder__input"
            >
              <option value="all">All products ({items.length})</option>
              <option value="documented">Documented spec sheet</option>
              <option value="quote-only">Visual reference / spec on request</option>
            </select>
          </label>
        </div>

        <div className="work-finder__meta">
          <span className="work-finder__count" role="status" aria-live="polite">
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> matching products
            {totalPages > 1 ? ` (Page ${safePage} of ${totalPages})` : ""}
          </span>
          {category !== "all" || subcategory !== "all" || specFilter !== "all" || query.trim() !== "" ? (
            <button
              type="button"
              className="active-filter__clear"
              onClick={() => {
                setCategory("all");
                setSubcategory("all");
                setSpecFilter("all");
                setQuery("");
                setPage(1);
              }}
            >
              Reset all filters
            </button>
          ) : null}
        </div>
      </div>

      {pageItems.length > 0 ? (
        <>
          <div className="card-grid card-grid--3 catalog-product-grid">
            {pageItems.map((item) => (
              <article key={item.slug} className="panel sourcing-item-card">
                <Link href={item.pagePath} className="sourcing-item-card__media" aria-label={`Inspect ${item.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="sourcing-item-card__img catalog-thumb-img"
                  />
                  <span className="sourcing-item-card__badge">
                    {item.modelCode}
                    {item.variantCount > 1 ? ` · ${item.variantCount} SKUs` : ""}
                  </span>
                </Link>

                <div className="sourcing-item-card__body">
                  <div className="catalog-card__meta">
                    <span className="eyebrow eyebrow--plain">{item.subcategory}</span>
                    <span className={`badge ${item.hasSpecSheet ? "badge--verified" : "badge--demo"}`}>
                      {item.hasSpecSheet ? "Spec sheet" : "Visual ref"}
                    </span>
                  </div>

                  <h3 className="card-title">
                    <Link href={item.pagePath} className="catalog-card__title-link">
                      {item.title}
                    </Link>
                  </h3>

                  {item.topSpecs.length > 0 ? (
                    <ul className="check-list sourcing-item-card__specs">
                      {item.topSpecs.map((spec, idx) => (
                        <li key={`${item.slug}-sp-${idx}`}>
                          <Icon name="check" size={14} />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="fine-print sourcing-item-card__compliance">
                    Availability, MOQ, price, and lead time confirmed on request; supplier stock may change.
                  </p>

                  <div className="sourcing-item-card__actions">
                    <Link href={item.pagePath} className="btn btn--secondary btn--sm">
                      <span>View details</span>
                    </Link>
                    <a
                      href={item.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${item.slug}.pdf`}
                      className="btn btn--primary btn--sm"
                      aria-label={`Download PDF specification sheet for ${item.title}`}
                    >
                      <span>PDF</span>
                      <Icon name="arrow-up-right" size={14} className="btn__icon" />
                    </a>
                    <Link
                      href={`${contactBase}&summary=${encodeURIComponent(
                        `Sourcing Quote Request — ${item.title} (${item.referenceCode})\nModel: ${item.modelCode}\nDestination country:\nTarget quantity:`,
                      )}`}
                      className="text-link"
                    >
                      Quote →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="catalog-pagination" aria-label="Catalogue pagination">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={safePage <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 320, behavior: "smooth" });
                }}
              >
                ← Previous
              </button>
              <span className="fine-print">
                Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> ({filtered.length} products)
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={safePage >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 320, behavior: "smooth" });
                }}
              >
                Next →
              </button>
            </nav>
          ) : null}
        </>
      ) : (
        <div className="empty-state">
          <h3 className="empty-state__title">No matching products found</h3>
          <p>Try a broader keyword (such as a category name or model prefix) or reset the filters to browse all {items.length} catalog items.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setCategory("all");
              setSubcategory("all");
              setSpecFilter("all");
              setQuery("");
              setPage(1);
            }}
          >
            <span>Show all {items.length} products</span>
          </button>
        </div>
      )}
    </div>
  );
}

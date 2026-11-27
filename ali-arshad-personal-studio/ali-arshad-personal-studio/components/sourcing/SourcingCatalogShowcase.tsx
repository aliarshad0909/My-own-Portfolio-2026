"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  PRODUCT_SOURCING_CONTACT_SERVICE,
  SOURCING_CATALOG_EXAMPLES,
  SOURCING_LOOKBOOK_PDF_PATH,
  type SourcingCatalogExample,
} from "@/lib/sourcing";
import { MASTER_CATALOG_PDF_PATH, SOURCING_CATALOG_PATH, SOURCING_CATALOG_STATS } from "@/lib/sourcing-catalog";

const FILTER_OPTIONS: { id: "all" | SourcingCatalogExample["categoryId"]; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "kitchen-appliances", label: "Kitchen Appliances" },
  { id: "bags-luggage", label: "Luggage & Travel" },
  { id: "mobile-accessories", label: "Mobile & Power" },
  { id: "lighting-solar", label: "LED & Solar Lighting" },
  { id: "toys", label: "Toys & Learning" },
];

type Props = {
  /** Render all 12 curated examples (with category filter) or a compact 6-item highlight grid. */
  compact?: boolean;
};

export function SourcingCatalogShowcase({ compact = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<"all" | SourcingCatalogExample["categoryId"]>("all");

  const items = compact
    ? [
        SOURCING_CATALOG_EXAMPLES[0], // Toasters
        SOURCING_CATALOG_EXAMPLES[1], // Stand mixers
        SOURCING_CATALOG_EXAMPLES[3], // Hard-shell luggage lineup
        SOURCING_CATALOG_EXAMPLES[5], // Woven/MagSafe phone cases
        SOURCING_CATALOG_EXAMPLES[8], // Architectural COB LED downlights
        SOURCING_CATALOG_EXAMPLES[10], // Magnetic building blocks
      ]
    : activeCategory === "all"
      ? SOURCING_CATALOG_EXAMPLES
      : SOURCING_CATALOG_EXAMPLES.filter((item) => item.categoryId === activeCategory);

  const contactHref = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}`;

  return (
    <div className="sourcing-catalog">
      {!compact ? (
        <div className="sourcing-catalog__bar" role="tablist" aria-label="Filter catalog-backed sourcing examples">
          {FILTER_OPTIONS.map((opt) => {
            const active = activeCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`location-pill ${active ? "location-pill--all" : ""}`.trim()}
                onClick={() => setActiveCategory(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="card-grid card-grid--3 sourcing-catalog__grid">
        {items.map((item) => (
          <article key={item.id} className="panel sourcing-item-card">
            <div className={`sourcing-item-card__media ${item.darkSurface ? "is-dark" : ""}`.trim()}>
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 46vw, 94vw"
                className="sourcing-item-card__img"
              />
              <span className="sourcing-item-card__badge">Catalog Reference · OEM Product</span>
            </div>

            <div className="sourcing-item-card__body">
              <p className="eyebrow eyebrow--plain">{item.categoryLabel}</p>
              <h3 className="card-title">{item.title}</h3>
              <p className="sourcing-item-card__summary">{item.summary}</p>

              <ul className="check-list sourcing-item-card__specs">
                {item.specs.map((spec) => (
                  <li key={spec}>
                    <Icon name="check" size={14} />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>

              <p className="fine-print sourcing-item-card__compliance">{item.packagingAndCompliance}</p>
              <p className="fine-print sourcing-item-card__attr">{item.attributionNote}</p>

              <div className="sourcing-item-card__actions">
                <Link href={item.calculatorHref} className="btn btn--secondary btn--sm">
                  <span>{item.calculatorLabel}</span>
                </Link>
                <Link
                  href={`${contactHref}&summary=${encodeURIComponent(`Sourcing Quote Request — ${item.title} (${item.categoryLabel})\nDestination country:\nTarget quantity:\nPackaging / customization notes:`)}`}
                  className="text-link"
                >
                  Request quote →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="panel sourcing-lookbook-cta">
        <div>
          <p className="eyebrow eyebrow--plain">
            Master Catalogue PDF &amp; Searchable Directory · {SOURCING_CATALOG_STATS.totalUniqueProducts} Unique Models
          </p>
          <h3 className="card-title" style={{ marginTop: "4px" }}>
            Download “Ali Arshad — Product Sourcing Catalogue” or search individual product PDFs
          </h3>
          <p className="fine-print" style={{ marginTop: "6px" }}>
            Browse all {SOURCING_CATALOG_STATS.totalUniqueProducts} deduplicated OEM reference models and lighting series across 5 categories — each
            with its own branded downloadable specification PDF, honest availability status, and zero confidential supplier contacts or outdated prices.
          </p>
        </div>
        <div className="sourcing-lookbook-cta__actions">
          <a
            href={MASTER_CATALOG_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            download="Ali-Arshad-Product-Sourcing-Catalogue.pdf"
            className="btn btn--primary btn--sm"
          >
            <span>Master Catalogue (PDF)</span>
            <Icon name="arrow-up-right" size={15} className="btn__icon" />
          </a>
          <Link href={SOURCING_CATALOG_PATH} className="btn btn--secondary btn--sm">
            <span>Search all {SOURCING_CATALOG_STATS.totalUniqueProducts} products</span>
          </Link>
          <a
            href={SOURCING_LOOKBOOK_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            download="Ali-Arshad-Studio-Sourcing-Lookbook.pdf"
            className="text-link"
          >
            3-page Executive Lookbook (PDF) →
          </a>
        </div>
      </div>
    </div>
  );
}

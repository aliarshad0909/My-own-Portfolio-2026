import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { SourcingCatalogBrowser } from "@/components/sourcing/SourcingCatalogBrowser";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import {
  PRODUCT_SOURCING_CONTACT_SERVICE,
  PRODUCT_SOURCING_PATH,
  SOURCING_TOOLS,
} from "@/lib/sourcing";
import {
  MASTER_CATALOG_PDF_PATH,
  SOURCING_CATALOG_INDEX,
  SOURCING_CATALOG_PATH,
  SOURCING_CATALOG_STATS,
} from "@/lib/sourcing-catalog";
import { siteBaseUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Product Sourcing Catalogue — Searchable Models & PDFs",
  description: `Search and filter ${SOURCING_CATALOG_STATS.totalUniqueProducts} deduplicated OEM product models and fixture series across kitchen appliances, hard-shell luggage, mobile accessories, LED lighting, and toys — each with its own branded downloadable PDF.`,
  path: SOURCING_CATALOG_PATH,
});

export default function ProductSourcingCatalogPage() {
  const contactHref = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}`;
  const origin = siteBaseUrl().origin;

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ali Arshad — Product Sourcing Catalogue",
    url: `${origin}${SOURCING_CATALOG_PATH}`,
    description: `Searchable product sourcing reference catalogue indexing ${SOURCING_CATALOG_STATS.totalUniqueProducts} deduplicated OEM product models and series across 5 categories, each with an individual downloadable PDF.`,
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#studio` },
    numberOfItems: SOURCING_CATALOG_STATS.totalUniqueProducts,
    inLanguage: "en",
  };

  return (
    <>
      <JsonLd data={catalogSchema} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Product Sourcing", path: PRODUCT_SOURCING_PATH },
          { name: "Product Catalogue", path: SOURCING_CATALOG_PATH },
        ]}
      />

      <PageHero
        eyebrow={`Product Sourcing Catalogue · ${SOURCING_CATALOG_STATS.totalUniqueProducts} Unique Models & Series`}
        title={
          <>
            Ali Arshad — <span className="accent">Product Sourcing Catalogue</span>
          </>
        }
        lead={`Search ${SOURCING_CATALOG_STATS.totalUniqueProducts} deduplicated OEM product models and lighting series (covering ${SOURCING_CATALOG_STATS.totalVariantCodes.toLocaleString()} documented SKU variants) across five categories. Every item includes its own branded downloadable PDF specification sheet and quote coordination path.`}
      >
        <div className="hero__actions">
          <a
            href={MASTER_CATALOG_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            download="Ali-Arshad-Product-Sourcing-Catalogue.pdf"
            className="btn btn--primary btn--md"
          >
            <span>Download Master Catalogue (PDF)</span>
            <Icon name="arrow-up-right" size={16} className="btn__icon" />
          </a>
          <ButtonLink href={contactHref} variant="secondary" icon={null}>
            Request fresh supplier quotes
          </ButtonLink>
          <ButtonLink href={PRODUCT_SOURCING_PATH} variant="secondary" icon={null}>
            Sourcing process &amp; 9 guides
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Catalogue availability and coordinator disclosure">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Independent coordinator notice:</strong> Physical products shown in this catalogue are manufactured by third-party OEM/ODM factories.
            Ali Arshad Personal Studio acts strictly as your independent sourcing coordinator — never as factory owner or manufacturer.{" "}
            <strong>Availability, MOQ, price, and lead time are confirmed on request; supplier stock may change.</strong> Zero confidential supplier
            names, contacts, or expired wholesale price sheets are published.
          </span>
        </p>
      </section>

      <section className="section section--tight" aria-labelledby="catalog-browser-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Interactive catalogue search &amp; individual PDFs</p>
            <h2 className="section-title section-title--sm" id="catalog-browser-title">
              Filter by category, subcategory, spec status, or model code
            </h2>
            <p className="section-sub">
              {SOURCING_CATALOG_STATS.withSpecSheet} entries carry documented source specifications and {SOURCING_CATALOG_STATS.visualOnly} visual
              reference plates invite a fresh specification &amp; quote check. Every single entry includes a downloadable PDF.
            </p>
          </div>

          <SourcingCatalogBrowser items={SOURCING_CATALOG_INDEX} />
        </div>
      </section>

      <section className="section section--surface section--tight" aria-labelledby="catalog-tools-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Connected calculators &amp; sourcing guides</p>
            <h2 className="section-title section-title--sm" id="catalog-tools-title">
              Model landed cost, MOQ, and carton volume alongside any product
            </h2>
          </div>

          <ul className="hub-card-grid">
            {SOURCING_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="hub-link-card">
                  <span className="hub-link-card__kind">Free Calculator</span>
                  <span className="hub-link-card__title">
                    <span>{tool.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{tool.description}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog/product-sourcing-landed-cost-catalog-checklist" className="hub-link-card">
                <span className="hub-link-card__kind">Studio Dispatch</span>
                <span className="hub-link-card__title">
                  <span>Why Factory Unit Price Misleads Buyers</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  How carton CBM, Incoterms normalization, and internal component checks protect import margins.
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Request fresh factory quotes"
        title="Have target model codes or custom specs ready?"
        text="Reference any catalogue model code or share your own specification brief. You will receive an honest feasibility read and fresh comparable supplier quotes."
        button="Request sourcing quote"
        href={contactHref}
        secondaryHref={`${PRODUCT_SOURCING_PATH}/quote-comparison`}
        secondaryLabel="How quote comparison works"
      />
    </>
  );
}

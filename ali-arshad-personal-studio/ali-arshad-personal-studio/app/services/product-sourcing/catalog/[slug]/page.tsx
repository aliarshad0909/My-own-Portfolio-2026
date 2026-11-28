import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import {
  PRODUCT_SOURCING_CONTACT_SERVICE,
  PRODUCT_SOURCING_PATH,
} from "@/lib/sourcing";
import {
  ALL_SOURCING_PRODUCTS,
  MASTER_CATALOG_PDF_PATH,
  SOURCING_CATALOG_PATH,
  SOURCING_CATALOG_STATS,
  getSourcingProduct,
  relatedSourcingProducts,
} from "@/lib/sourcing-catalog";
import { siteBaseUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_SOURCING_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prod = getSourcingProduct(slug);
  if (!prod) return {};
  return pageMetadata({
    title: `${prod.title} — Sourcing Catalogue`,
    description: `${prod.summary} ${prod.availabilityStatus}`,
    path: prod.pagePath,
    // Index spec-documented entries; keep visual-only no-spec plates noindex so search engines never flag thin pages.
    index: prod.hasSpecSheet,
  });
}

export default async function SourcingProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prod = getSourcingProduct(slug);
  if (!prod) notFound();

  const related = relatedSourcingProducts(prod, 4);
  const contactHref = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}&summary=${encodeURIComponent(
    `Sourcing Quote Request — ${prod.title}\nReference: ${prod.referenceCode} (${prod.modelCode})\nDestination country:\nTarget quantity:\nPackaging / compliance notes:`,
  )}`;
  const origin = siteBaseUrl().origin;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: prod.title,
    url: `${origin}${prod.pagePath}`,
    description: `${prod.summary} ${prod.availabilityStatus}`,
    isPartOf: { "@id": `${origin}/#website` },
    mainEntity: {
      "@type": "Product",
      name: prod.title,
      sku: prod.modelCode,
      category: `${prod.categoryLabel} > ${prod.subcategory}`,
      description: `${prod.summary} ${prod.availabilityStatus} ${prod.attributionNote}`,
      image: `${origin}${prod.image}`,
      url: `${origin}${prod.pagePath}`,
    },
    inLanguage: "en",
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Product Sourcing", path: PRODUCT_SOURCING_PATH },
          { name: "Catalogue", path: SOURCING_CATALOG_PATH },
          { name: prod.modelCode, path: prod.pagePath },
        ]}
      />

      <PageHero
        eyebrow={`${prod.categoryLabel} · ${prod.subcategory} · ${prod.referenceCode}`}
        title={prod.title}
        lead={prod.summary}
        aside={
          <figure className="panel catalog-detail-media">
            <div className="catalog-detail-media__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prod.image}
                alt={prod.imageAlt}
                className="catalog-detail-media__img"
              />
              <span className="sourcing-item-card__badge">OEM Reference · {prod.modelCode}</span>
            </div>
            <figcaption className="fine-print" style={{ padding: "12px 14px" }}>
              {prod.attributionNote}
            </figcaption>
          </figure>
        }
      >
        <div className="hero__actions">
          <a
            href={prod.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            download={`${prod.slug}.pdf`}
            className="btn btn--primary btn--md"
          >
            <span>Download Product PDF</span>
            <Icon name="arrow-up-right" size={16} className="btn__icon" />
          </a>
          <ButtonLink href={contactHref} variant="secondary" icon={null}>
            Request fresh quote &amp; MOQ
          </ButtonLink>
          <ButtonLink href={SOURCING_CATALOG_PATH} variant="secondary" icon={null}>
            ← Back to full catalogue
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Availability and sourcing boundary">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Availability &amp; Terms:</strong> {prod.availabilityStatus} Ali Arshad Personal Studio coordinates supplier shortlisting,
            quote comparison, samples, and quality checkpoints independently and is <strong>not</strong> the product manufacturer.
          </span>
        </p>
      </section>

      <section className="section section--tight" aria-labelledby="spec-table-title">
        <div className="container subhub-body">
          <div className="panel">
            <div className="panel__head">
              <div>
                <p className="eyebrow eyebrow--plain">
                  {prod.hasSpecSheet ? "Source-documented specifications" : "Specification status"}
                </p>
                <h2 className="section-title section-title--sm" id="spec-table-title">
                  {prod.hasSpecSheet
                    ? `Documented details for ${prod.modelCode}`
                    : `No technical specification sheet in reference catalog`}
                </h2>
              </div>
              <a
                href={prod.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                download={`${prod.slug}.pdf`}
                className="arrow-link"
              >
                <span>Download branded spec PDF</span>
                <Icon name="arrow-up-right" size={15} />
              </a>
            </div>

            {!prod.hasSpecSheet ? (
              <p className="measure" style={{ marginTop: "10px", color: "var(--muted)" }}>
                This entry originates from a visual reference plate ({prod.referenceCode}, {prod.sourceLocation}) that did not include a full
                specification sheet. Rather than inventing dimensions, materials, or compliance claims, Ali Arshad verifies current specifications,
                sample availability, MOQ, unit pricing, and lead time directly with qualified factories upon request.
              </p>
            ) : null}

            <div className="decision-table-wrap" style={{ marginTop: "14px" }}>
              <table className="decision-table">
                <thead>
                  <tr>
                    <th scope="col">Attribute</th>
                    <th scope="col">Documented Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Model / Reference Code</th>
                    <td>{prod.modelCode}</td>
                  </tr>
                  <tr>
                    <th scope="row">Category &amp; Subcategory</th>
                    <td>
                      {prod.categoryLabel} — {prod.subcategory}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Availability &amp; Pricing</th>
                    <td>{prod.availabilityStatus}</td>
                  </tr>
                  {prod.specs.map((sp, idx) => (
                    <tr key={`${sp.label}-${idx}`}>
                      <th scope="row">{sp.label}</th>
                      <td>{sp.value}</td>
                    </tr>
                  ))}
                  {prod.variantCodes.length > 1 ? (
                    <tr>
                      <th scope="row">Included Series SKUs ({prod.variantCodes.length})</th>
                      <td>{prod.variantCodes.join(", ")}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <th scope="row">Reference Source</th>
                    <td>
                      {prod.referenceCode} · {prod.referenceCatalogLabel} ({prod.sourceLocation})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow eyebrow--plain">Connected sourcing tools, guides &amp; downloads</p>
            <h2 className="card-title" style={{ marginBottom: "14px" }}>
              Next steps for {prod.modelCode}
            </h2>
            <ul className="hub-card-grid">
              <li>
                <Link href={prod.calculatorHref} className="hub-link-card">
                  <span className="hub-link-card__kind">Planning Calculator</span>
                  <span className="hub-link-card__title">
                    <span>{prod.calculatorLabel}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Model landed cost, volumetric shipping, or MOQ carton economics before requesting bulk production.
                  </span>
                </Link>
              </li>
              <li>
                <Link href={prod.guideHref} className="hub-link-card">
                  <span className="hub-link-card__kind">Sourcing Guide</span>
                  <span className="hub-link-card__title">
                    <span>{prod.guideLabel}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Review inspection checkpoints, packaging standards, and Incoterms boundaries relevant to this category.
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href={MASTER_CATALOG_PDF_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Ali-Arshad-Product-Sourcing-Catalogue.pdf"
                  className="hub-link-card"
                >
                  <span className="hub-link-card__kind">Master PDF Download</span>
                  <span className="hub-link-card__title">
                    <span>Ali Arshad — Product Sourcing Catalogue</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Download the complete branded directory spanning all 7 reference categories and {SOURCING_CATALOG_STATS.totalUniqueProducts.toLocaleString()} models/series.
                  </span>
                </a>
              </li>
              <li>
                <Link href="/blog/product-sourcing-landed-cost-catalog-checklist" className="hub-link-card">
                  <span className="hub-link-card__kind">Studio Dispatch</span>
                  <span className="hub-link-card__title">
                    <span>Why Factory Unit Price Misleads Buyers</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Practical breakdown of quote normalization, sample verification, and landed-cost pitfalls.
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {related.length > 0 ? (
            <div>
              <div className="section-head" style={{ marginBottom: "16px" }}>
                <p className="eyebrow eyebrow--plain">More in {prod.categoryLabel}</p>
                <h2 className="section-title section-title--sm">Related catalogue models</h2>
              </div>
              <ul className="hub-card-grid">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link href={rel.pagePath} className="hub-link-card">
                      <span className="hub-link-card__kind">
                        {rel.modelCode} · {rel.subcategory}
                      </span>
                      <span className="hub-link-card__title">
                        <span>{rel.title}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">{rel.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Request fresh factory quotation"
        title={`Interested in sourcing ${prod.modelCode} or a customized variant?`}
        text="Share your target quantity, destination market, and any packaging or compliance needs. Ali will verify current availability, MOQ, and comparable quotes."
        button="Request sourcing quote"
        href={contactHref}
        secondaryHref={SOURCING_CATALOG_PATH}
        secondaryLabel="Browse full product catalogue"
      />
    </>
  );
}

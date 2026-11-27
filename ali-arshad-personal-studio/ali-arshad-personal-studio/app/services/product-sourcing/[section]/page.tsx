import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { SourcingCatalogShowcase } from "@/components/sourcing/SourcingCatalogShowcase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import {
  INCOTERMS_TABLE,
  PRODUCT_SOURCING_CONTACT_SERVICE,
  PRODUCT_SOURCING_PATH,
  SOURCING_CATEGORIES,
  SOURCING_RESPONSIBILITY_SPLIT,
  SOURCING_SUBPAGES,
  SOURCING_TOOLS,
  getSourcingSubpage,
} from "@/lib/sourcing";
import { SOURCING_CATALOG_PATH, SOURCING_CATALOG_STATS } from "@/lib/sourcing-catalog";
import { singleServiceSchema } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOURCING_SUBPAGES.map((p) => ({ section: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const page = getSourcingSubpage(section);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.lead,
    path: `${PRODUCT_SOURCING_PATH}/${page.slug}`,
  });
}

export default async function ProductSourcingSubpage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = getSourcingSubpage(section);
  if (!page) notFound();

  const contactHref = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}`;
  const idx = SOURCING_SUBPAGES.findIndex((p) => p.slug === page.slug);
  const nextPage = SOURCING_SUBPAGES[(idx + 1) % SOURCING_SUBPAGES.length];

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: page.title,
          description: page.lead,
          path: `${PRODUCT_SOURCING_PATH}/${page.slug}`,
          serviceType: "Product Sourcing & Supply Chain Coordination",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Product Sourcing", path: PRODUCT_SOURCING_PATH },
          { name: page.navLabel, path: `${PRODUCT_SOURCING_PATH}/${page.slug}` },
        ]}
      />

      <PageHero
        eyebrow={page.eyebrow}
        title={page.h1}
        lead={page.lead}
        aside={
          <EditorialMedia
            src={page.photo.src}
            alt={page.photo.alt}
            badge={page.photo.badge ?? "Illustrative editorial photo"}
            caption={page.photo.caption}
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Request a sourcing quote</ButtonLink>
          <ButtonLink href={PRODUCT_SOURCING_PATH} variant="secondary" icon={null}>
            Product Sourcing Overview
          </ButtonLink>
        </div>
      </PageHero>

      <nav className="container subhub-nav" aria-label="Product Sourcing topics">
        <div className="location-pill-list">
          <Link href={PRODUCT_SOURCING_PATH} className="location-pill">
            Overview
          </Link>
          <Link href={SOURCING_CATALOG_PATH} className="location-pill">
            Full Catalogue ({SOURCING_CATALOG_STATS.totalUniqueProducts})
          </Link>
          {SOURCING_SUBPAGES.map((sub) => (
            <Link
              key={sub.slug}
              href={`${PRODUCT_SOURCING_PATH}/${sub.slug}`}
              className={`location-pill ${sub.slug === page.slug ? "location-pill--all" : ""}`}
              aria-current={sub.slug === page.slug ? "page" : undefined}
            >
              {sub.navLabel}
            </Link>
          ))}
        </div>
      </nav>

      <section className="section section--tight">
        <div className="container subhub-body">
          {page.sections.map((sec) => (
            <article key={sec.heading} className="panel subhub-section">
              <h2 className="section-title section-title--sm">{sec.heading}</h2>
              {sec.paragraphs.map((p, i) => (
                <p key={i} className="subhub-para">
                  {p}
                </p>
              ))}
              {sec.bullets && sec.bullets.length > 0 ? (
                <ul className="check-list check-list--spaced" style={{ marginTop: "14px" }}>
                  {sec.bullets.map((b) => (
                    <li key={b}>
                      <Icon name="check" size={16} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}

          {page.showCatalogExamples ? (
            <div style={{ marginTop: "8px" }}>
              <div className="section-head" style={{ marginBottom: "18px" }}>
                <p className="eyebrow eyebrow--plain">Catalog-backed product examples</p>
                <h2 className="section-title section-title--sm">
                  Filter representative product lines by category
                </h2>
              </div>
              <SourcingCatalogShowcase />
            </div>
          ) : null}

          {page.showCategories ? (
            <div className="card-grid card-grid--3">
              {SOURCING_CATEGORIES.map((cat) => (
                <article key={cat.id} className="panel feature-card">
                  <span className={`badge ${cat.pathType === "Reference catalog experience" ? "badge--verified" : "badge--demo"}`}>
                    {cat.pathType}
                  </span>
                  <h3 className="card-title">{cat.name}</h3>
                  <p>{cat.summary}</p>
                  <ul className="check-list" style={{ marginTop: "6px" }}>
                    {cat.typicalChecks.map((chk) => (
                      <li key={chk}>
                        <Icon name="check" size={15} />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="fine-print" style={{ marginTop: "auto", paddingTop: "8px" }}>
                    {cat.caveat}
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          {page.showResponsibilitySplit ? (
            <div className="split-cards">
              <div className="panel">
                <p className="eyebrow eyebrow--plain">Direct coordination</p>
                <h2 className="card-title" style={{ marginBottom: "12px" }}>
                  What Ali Arshad coordinates directly
                </h2>
                <ul className="check-list check-list--spaced">
                  {SOURCING_RESPONSIBILITY_SPLIT.directCoordination.map((item) => (
                    <li key={item}>
                      <Icon name="check" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel">
                <p className="eyebrow eyebrow--plain">Licensed &amp; specialized providers</p>
                <h2 className="card-title" style={{ marginBottom: "12px" }}>
                  What requires suppliers, labs &amp; licensed brokers
                </h2>
                <ul className="check-list check-list--spaced">
                  {SOURCING_RESPONSIBILITY_SPLIT.externalSpecialists.map((item) => (
                    <li key={item}>
                      <Icon name="shield" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {page.showIncoterms ? (
            <div className="panel">
              <h2 className="section-title section-title--sm" style={{ marginBottom: "14px" }}>
                EXW, FOB, CIF, DAP, and DDP comparison
              </h2>
              <div className="decision-table-wrap">
                <table className="decision-table">
                  <thead>
                    <tr>
                      <th scope="col">Term</th>
                      <th scope="col">Seller handles</th>
                      <th scope="col">Buyer handles</th>
                      <th scope="col">Practical caveat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INCOTERMS_TABLE.map((row) => (
                      <tr key={row.term}>
                        <th scope="row">
                          {row.term} <small className="muted" style={{ display: "block", fontWeight: 400 }}>{row.fullName}</small>
                        </th>
                        <td>{row.sellerHandles}</td>
                        <td>{row.buyerHandles}</td>
                        <td>{row.practicalNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="panel">
            <p className="eyebrow eyebrow--plain">Connected sourcing calculators</p>
            <h2 className="card-title" style={{ marginBottom: "14px" }}>
              Test your numbers before requesting supplier quotes
            </h2>
            <ul className="hub-card-grid">
              {SOURCING_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className="hub-link-card">
                    <span className="hub-link-card__kind">Calculator</span>
                    <span className="hub-link-card__title">
                      <span>{tool.title}</span>
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                    <span className="hub-link-card__desc">{tool.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Faq
        id={`faq-sourcing-${page.slug}`}
        eyebrow="Practical answers"
        title={`${page.navLabel}: common questions`}
        items={page.faqs}
        surface
      />

      <ContactCTA
        standalone
        eyebrow="Request a sourcing quote"
        title="Ready to scope your product brief?"
        text="Share your product requirements, target volume, and destination country. You will receive an honest feasibility review before quotes are requested."
        button="Send sourcing requirements"
        href={contactHref}
        secondaryHref={`${PRODUCT_SOURCING_PATH}/${nextPage.slug}`}
        secondaryLabel={`Next guide: ${nextPage.navLabel}`}
      />
    </>
  );
}

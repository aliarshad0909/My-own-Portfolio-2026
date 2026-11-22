import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { LIVE_PRODUCT_SLUGS, PROJECTS, type Project } from "@/lib/projects";
import { STUDIO_PRODUCTS } from "@/lib/products/catalog";

const PRODUCT_META: Record<
  (typeof LIVE_PRODUCT_SLUGS)[number],
  {
    badgeLabel: string;
    subtitle: string;
    highlights: string[];
    accentClass: string;
  }
> = {
  "pipelineos-crm": {
    badgeLabel: "CRM & Sales SaaS",
    subtitle: "Full-stack B2B pipeline, contacts, leads & revenue analytics",
    highlights: [
      "Persistent PostgreSQL CRUD across contacts, leads, deals & tasks",
      "Atomic 1-click Lead → Contact + Deal conversion with stage history",
      "6-stage Kanban pipeline board & live database-computed analytics",
      "scrypt/HttpOnly RBAC auth, rate limiting & 1-click demo reset",
    ],
    accentClass: "demo-card--pipeline",
  },
  "stockflow-inventory": {
    badgeLabel: "Inventory SaaS + Mobile App",
    subtitle: "Multi-warehouse inventory platform + 11-screen React Native Expo app",
    highlights: [
      "Atomic stock receipts, cycle counts, issues & inter-warehouse transfers",
      "Purchase Order receiving & Sales Order reserve → fulfil → ship",
      "Real 11-screen React Native + Expo mobile app with barcode scanner",
      "Shared /api/v1 REST backend syncing web & mobile in real time",
    ],
    accentClass: "demo-card--stockflow",
  },
};

export function LiveProductDemos() {
  const products = LIVE_PRODUCT_SLUGS.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter(
    (p): p is Project => p !== undefined,
  );

  if (products.length === 0) return null;

  return (
    <section
      className="section live-demos"
      id="live-product-demonstrations"
      aria-labelledby="live-demos-title"
    >
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Live Product Demonstrations</p>
            <h2 className="section-title" id="live-demos-title">
              Real, interactive SaaS products — not static mockups
            </h2>
            <p className="lead live-demos__lead">
              Two complete full-stack applications engineered on permissively licensed open-source
              foundations with persistent PostgreSQL databases, authentication, seeded workspaces,
              and a real React Native + Expo mobile companion.
            </p>
          </div>
        </div>

        <div className="demo-grid">
          {products.map((product) => {
            const slug = product.slug as (typeof LIVE_PRODUCT_SLUGS)[number];
            const meta = PRODUCT_META[slug];
            const hasPublicUrl = Boolean(product.liveUrl);

            return (
              <article key={product.slug} className={`demo-card ${meta.accentClass} reveal`}>
                <Link
                  href={`/case-studies/${product.slug}`}
                  className="demo-card__media"
                  aria-label={`Inspect ${product.title} case study`}
                >
                  <Image
                    src={product.cover.src}
                    alt={product.cover.alt}
                    width={product.cover.width}
                    height={product.cover.height}
                    sizes="(min-width: 1024px) 580px, 94vw"
                    className="demo-card__img"
                  />
                  <span className="demo-card__media-pill">{meta.badgeLabel}</span>
                </Link>

                <div className="demo-card__body">
                  <div className="demo-card__badges">
                    <TypeBadge type={product.projectType} />
                    <StatusBadge status={product.status} />
                  </div>

                  <h3 className="demo-card__title">
                    <Link href={`/case-studies/${product.slug}`}>{product.title}</Link>
                  </h3>
                  <p className="demo-card__subtitle">{meta.subtitle}</p>
                  <p className="demo-card__desc">{product.summary}</p>

                  <ul className="demo-card__features" aria-label={`${product.title} core features`}>
                    {meta.highlights.map((item) => (
                      <li key={item}>
                        <Icon name="check" size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <ul className="tag-list demo-card__stack" aria-label="Technology stack">
                    {product.technologies.slice(0, 6).map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>

                  <div className="demo-card__actions">
                    {hasPublicUrl ? (
                      <a
                        href={product.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary btn--sm"
                      >
                        <span>Launch Live Demo</span>
                        <Icon name="arrow-up-right" size={16} className="btn__icon" />
                      </a>
                    ) : (
                      <Link
                        href={`/case-studies/${product.slug}#demo-access`}
                        className="btn btn--primary btn--sm"
                      >
                        <span>Launch Live Demo</span>
                        <Icon name="arrow-right" size={16} className="btn__icon" />
                      </Link>
                    )}

                    <Link
                      href={`/case-studies/${product.slug}#architecture`}
                      className="btn btn--secondary btn--sm"
                    >
                      <span>View Architecture</span>
                    </Link>

                    {product.mobilePreview ? (
                      <Link
                        href={`/case-studies/${product.slug}#mobile-preview`}
                        className="btn btn--secondary btn--sm"
                      >
                        <span>Mobile Preview</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="ecosystem-strip reveal" aria-label="Full 12-product software ecosystem">
          <div className="ecosystem-strip__head">
            <div>
              <p className="eyebrow eyebrow--plain">Full 12-Product Studio Ecosystem</p>
              <h3 className="ecosystem-strip__title">
                CRM, Inventory, ERP, AI Workflows, Sourcing, EdTech, Support, PM, BI, HR &amp; Booking
              </h3>
            </div>
            <Link href="/products" className="btn btn--primary btn--sm">
              <span>Explore All {STUDIO_PRODUCTS.length} Products</span>
              <Icon name="arrow-right" size={16} className="btn__icon" />
            </Link>
          </div>

          <ul className="ecosystem-strip__pills">
            {STUDIO_PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="ecosystem-pill">
                  <span
                    className="ecosystem-pill__dot"
                    style={{ backgroundColor: p.accentColor }}
                    aria-hidden="true"
                  />
                  <span className="ecosystem-pill__name">{p.name}</span>
                  <span className="ecosystem-pill__cat">{p.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="fine-print live-demos__note">
          All twelve applications are built and locally verified with automated PostgreSQL, security,
          and Chromium E2E test suites; public demo links activate as each subdomain deploys.
        </p>
      </div>
    </section>
  );
}


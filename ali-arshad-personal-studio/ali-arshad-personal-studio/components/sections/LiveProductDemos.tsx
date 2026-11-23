import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { LIVE_PRODUCT_SLUGS, PROJECTS, type Project } from "@/lib/projects";

const PRODUCT_PRESENTATION: Record<
  (typeof LIVE_PRODUCT_SLUGS)[number],
  {
    badgeLabel: string;
    subtitle: string;
    plainSummary: string;
    highlights: string[];
    accentClass: string;
  }
> = {
  "pipelineos-crm": {
    badgeLabel: "Live CRM Demo",
    subtitle: "B2B sales pipeline, contacts, lead conversion & live revenue reporting",
    plainSummary:
      "A working sales CRM you can test right now: sign in to the sandbox workspace, add contacts, convert leads into deals, drag opportunities across stages, and see analytics update in real time.",
    highlights: [
      "Contacts, lead qualification & one-click lead-to-deal conversion",
      "Six-stage Kanban sales pipeline with follow-up tasks",
      "Real PostgreSQL persistence with one-click sandbox reset",
    ],
    accentClass: "demo-card--pipeline",
  },
  "stockflow-inventory": {
    badgeLabel: "Live Inventory + Mobile Demo",
    subtitle: "Multi-warehouse inventory platform paired with a mobile web companion",
    plainSummary:
      "A live multi-warehouse inventory system connected to an interactive mobile preview: manage SKUs and barcodes, transfer stock across warehouses, receive purchase orders, and test live web-to-mobile sync.",
    highlights: [
      "Multi-warehouse stock levels, receipts, adjustments & transfers",
      "Purchase order receiving & sales order reservation and fulfillment",
      "Live mobile web companion sharing the same backend & database",
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
              Test two live full-stack applications — not static mockups
            </h2>
            <p className="lead live-demos__lead">
              Before hiring a developer, try the actual software. Both products run live with real databases and safe sandbox demo accounts so you can
              evaluate code quality and UX firsthand.
            </p>
          </div>
        </div>

        <div className="demo-grid">
          {products.map((product) => {
            const slug = product.slug as (typeof LIVE_PRODUCT_SLUGS)[number];
            const meta = PRODUCT_PRESENTATION[slug];
            const liveUrl = product.liveUrl;
            const mobileWebUrl = product.mobilePreview?.interactiveWebUrl;

            return (
              <article key={product.slug} className={`demo-card ${meta.accentClass} reveal`}>
                <Link
                  href={`/case-studies/${product.slug}`}
                  className="demo-card__media"
                  aria-label={`Read the ${product.title} case study`}
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
                    <span className="badge badge--live">Live Sandbox</span>
                    <span className="badge badge--type">Studio Demonstration</span>
                  </div>

                  <h3 className="demo-card__title">
                    <Link href={`/case-studies/${product.slug}`}>{product.title}</Link>
                  </h3>
                  <p className="demo-card__subtitle">{meta.subtitle}</p>
                  <p className="demo-card__desc">{meta.plainSummary}</p>

                  <ul className="demo-card__features" aria-label={`${product.title} highlights`}>
                    {meta.highlights.map((item) => (
                      <li key={item}>
                        <Icon name="check" size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="demo-card__actions">
                    {liveUrl ? (
                      <TrackedLink
                        href={liveUrl}
                        external
                        event="demo_launch"
                        props={{ product: product.slug, placement: "homepage" }}
                        className="btn btn--primary btn--sm"
                        ariaLabel={`Launch live ${product.title} demo (opens in a new tab)`}
                      >
                        <span>Launch Live Demo</span>
                        <Icon name="arrow-up-right" size={16} className="btn__icon" />
                      </TrackedLink>
                    ) : null}

                    {mobileWebUrl ? (
                      <TrackedLink
                        href={mobileWebUrl}
                        external
                        event="mobile_preview_launch"
                        props={{ product: product.slug, placement: "homepage" }}
                        className="btn btn--secondary btn--sm"
                        ariaLabel="Open StockFlow interactive mobile web preview (opens in a new tab)"
                      >
                        <span>Mobile Web Preview</span>
                        <Icon name="arrow-up-right" size={15} className="btn__icon" />
                      </TrackedLink>
                    ) : null}

                    <Link
                      href={`/case-studies/${product.slug}`}
                      className="btn btn--ghost btn--sm"
                    >
                      <span>Case Study</span>
                      <Icon name="arrow-right" size={15} className="btn__icon" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="fine-print live-demos__note">
          Both live demos are self-initiated studio demonstrations using fictional data — not paid client deployments. Technical architecture,
          open-source attribution, and sandbox credentials are documented in each case study, and broader software concepts live in the{" "}
          <Link href="/products">product directory</Link>.
        </p>
      </div>
    </section>
  );
}

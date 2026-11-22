import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { STUDIO_PRODUCTS, getStudioProduct } from "@/lib/products/catalog";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return STUDIO_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getStudioProduct(slug);
  if (!product) return {};
  return pageMetadata({
    title: `${product.name} — ${product.tagline} | Ali Arshad Personal Studio`,
    description: product.shortDescription,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getStudioProduct(slug);
  if (!product) notFound();

  const related = product.relatedSlugs
    .map((s) => getStudioProduct(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Product Ecosystem", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />

      <article className="detail">
        <header className="page-hero">
          <div className="container enter">
            <Link href="/products" className="back-link">
              <Icon name="arrow-right" size={16} className="flip" />
              <span>All 12 SaaS products</span>
            </Link>

            <div className="detail__meta">
              <span
                className="prod-card__logo"
                style={{ backgroundColor: product.accentColor }}
                aria-hidden="true"
              >
                {product.monogram}
              </span>
              <span className="eyebrow eyebrow--plain">
                Product {product.number} · {product.category}
              </span>
              <span className="prod-badge prod-badge--primary">{product.status}</span>
              <span className="prod-badge prod-badge--muted">{product.secondaryStatus}</span>
            </div>

            <h1 className="page-title">
              {product.name} — {product.tagline}
            </h1>
            <p className="lead">{product.shortDescription}</p>

            <p className="notice">
              <Icon name="alert" size={18} />
              <span>
                Studio demonstration product with fictional seeded data — not a paid client deployment.
              </span>
            </p>

            <div className="detail__links">
              {product.liveUrl ? (
                <a
                  className="btn btn--primary btn--md"
                  href={product.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Launch Live Demo</span>
                  <Icon name="arrow-up-right" size={18} className="btn__icon" />
                </a>
              ) : (
                <a className="btn btn--primary btn--md" href="#demo-access">
                  <span>Demo Access &amp; Setup</span>
                  <Icon name="arrow-right" size={18} className="btn__icon" />
                </a>
              )}
              {product.caseStudyUrl ? (
                <Link className="btn btn--secondary btn--md" href={product.caseStudyUrl}>
                  <span>Full Engineering Case Study</span>
                </Link>
              ) : null}
              <a
                className="btn btn--secondary btn--md"
                href="https://github.com/aliarshad0909/My-own-Portfolio-2026"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>GitHub Repository</span>
                <Icon name="arrow-up-right" size={18} className="btn__icon" />
              </a>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="detail__cover">
            <Image
              src={product.cover.src}
              alt={product.cover.alt}
              width={product.cover.width}
              height={product.cover.height}
              priority
              sizes="(min-width: 1240px) 1240px, 100vw"
              style={product.cover.mobile ? { maxWidth: "360px", margin: "0 auto", borderRadius: "20px" } : undefined}
            />
          </div>

          <div className="detail__layout">
            <aside className="panel detail__facts" aria-label="Product technical profile">
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{product.category}</dd>
                </div>
                <div>
                  <dt>Visual Identity</dt>
                  <dd>{product.identityLabel}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {product.status} · {product.secondaryStatus}
                  </dd>
                </div>
                <div>
                  <dt>Repository Path</dt>
                  <dd>
                    <code>{product.repoPath}</code>
                  </dd>
                </div>
                <div>
                  <dt>Feature Branch</dt>
                  <dd>
                    <code>{product.branchName}</code>
                  </dd>
                </div>
                <div>
                  <dt>Target Subdomain</dt>
                  <dd>
                    <code>{product.targetSubdomain}</code>
                  </dd>
                </div>
                <div>
                  <dt>OSS Compliance</dt>
                  <dd>{product.ossCompliance}</dd>
                </div>
              </dl>
              <ul className="tag-list" aria-label="Technology stack">
                {product.technologies.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </aside>

            <div className="detail__content prose">
              <section aria-labelledby="overview-title">
                <h2 className="section-title section-title--sm" id="overview-title">
                  1. Product Overview
                </h2>
                <p>{product.overview}</p>
              </section>

              <section aria-labelledby="problem-title">
                <h2 className="section-title section-title--sm" id="problem-title">
                  2. Problem Solved
                </h2>
                <p>{product.problemSolved}</p>
              </section>

              <section aria-labelledby="capabilities-title">
                <h2 className="section-title section-title--sm" id="capabilities-title">
                  3. Verified Product Capabilities
                </h2>
                <ul className="check-list check-list--spaced">
                  {product.capabilities.map((cap) => (
                    <li key={cap}>
                      <Icon name="check" size={16} />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="architecture" aria-labelledby="architecture-title">
                <h2 className="section-title section-title--sm" id="architecture-title">
                  4. Architecture &amp; Open-Source Provenance
                </h2>
                <p>{product.architectureOverview}</p>
                <p>
                  <strong>License &amp; Provenance:</strong> {product.ossCompliance}
                </p>
              </section>

              <section id="interactive-preview" aria-labelledby="preview-title">
                <h2 className="section-title section-title--sm" id="preview-title">
                  5. Interactive Preview &amp; Verification Status
                </h2>
                <p>{product.interactivePreviewNote}</p>
              </section>

              <section id="demo-access" aria-labelledby="demo-title">
                <h2 className="section-title section-title--sm" id="demo-title">
                  6. Demo Access &amp; Local Run Instructions
                </h2>
                <div className="demo-access-panel">
                  <dl className="demo-access-panel__grid">
                    <div>
                      <dt>Demo Credentials</dt>
                      <dd>
                        <code>{product.demoEmail}</code> / <code>{product.demoPassword}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Local Development URL</dt>
                      <dd>
                        <code>{product.localPort}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Run Locally</dt>
                      <dd>
                        <code>cd {product.repoPath} &amp;&amp; npm install &amp;&amp; npm run dev</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Planned Production Target</dt>
                      <dd>
                        <code>{product.targetSubdomain}</code> (consolidated deployment pending owner approval)
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
          </div>

          <section className="detail__gallery" aria-labelledby="screens-title">
            <h2 className="section-title section-title--sm" id="screens-title">
              Real Application Screenshots
            </h2>
            <p className="fine-print detail__gallery-note">
              Captured directly from the running production build during automated headless Chromium QA.
            </p>
            <div className={product.cover.mobile ? "mobile-preview__grid" : "prod-shots-grid"}>
              {product.screenshots.map((shot) => (
                <figure key={shot.src} className="prod-shot">
                  <div className={shot.mobile ? "mobile-preview__frame" : "prod-shot__frame"}>
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      loading="lazy"
                      sizes="(min-width: 1024px) 580px, 94vw"
                    />
                  </div>
                  <figcaption className="prod-shot__caption">{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="section section--tight" aria-labelledby="related-products-title">
          <div className="container">
            <h2 className="section-title section-title--sm" id="related-products-title">
              Related Ecosystem Products
            </h2>
            <div className="prod-grid prod-grid--3">
              {related.map((rel) => (
                <article key={rel.slug} className="prod-card">
                  <div className="prod-card__body">
                    <div className="prod-card__head">
                      <span
                        className="prod-card__logo"
                        style={{ backgroundColor: rel.accentColor }}
                        aria-hidden="true"
                      >
                        {rel.monogram}
                      </span>
                      <div>
                        <h3 className="prod-card__title">
                          <Link href={`/products/${rel.slug}`}>{rel.name}</Link>
                        </h3>
                        <p className="prod-card__tagline">{rel.tagline}</p>
                      </div>
                    </div>
                    <p className="prod-card__desc">{rel.shortDescription}</p>
                    <Link href={`/products/${rel.slug}`} className="btn btn--secondary btn--sm">
                      <span>Inspect {rel.name}</span>
                      <Icon name="arrow-right" size={14} className="btn__icon" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCTA standalone title={`Want a custom ${product.tagline.toLowerCase()} built for your team?`} />
    </>
  );
}

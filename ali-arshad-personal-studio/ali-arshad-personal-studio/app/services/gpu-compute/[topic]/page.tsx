import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { GpuQuoteEstimator } from "@/components/tools/GpuQuoteEstimator";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import {
  GPU_COMPUTE_CONTACT_SERVICE,
  GPU_COMPUTE_PATH,
  GPU_TOPIC_PAGES,
  getGpuTopic,
} from "@/lib/gpu-compute";
import { pageMetadata } from "@/lib/seo";
import { singleServiceSchema } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return GPU_TOPIC_PAGES.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const page = getGpuTopic(topic);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.lead,
    path: `${GPU_COMPUTE_PATH}/${page.slug}`,
  });
}

export default async function GpuComputeTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const page = getGpuTopic(topic);
  if (!page) notFound();

  const contactHref = `/contact?service=${encodeURIComponent(GPU_COMPUTE_CONTACT_SERVICE)}`;
  const idx = GPU_TOPIC_PAGES.findIndex((t) => t.slug === page.slug);
  const nextTopic = GPU_TOPIC_PAGES[(idx + 1) % GPU_TOPIC_PAGES.length];

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: page.title,
          description: page.lead,
          path: `${GPU_COMPUTE_PATH}/${page.slug}`,
          serviceType: "GPU & Compute Consultation",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "GPU & Compute", path: GPU_COMPUTE_PATH },
          { name: page.navLabel, path: `${GPU_COMPUTE_PATH}/${page.slug}` },
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
            badge="Illustrative editorial photo"
            caption={page.photo.caption}
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Request availability &amp; quote</ButtonLink>
          <ButtonLink href={GPU_COMPUTE_PATH} variant="secondary" icon={null}>
            GPU &amp; Compute Overview
          </ButtonLink>
        </div>
      </PageHero>

      {/* Sibling GPU & Compute Subpage Navigation */}
      <nav className="container subhub-nav" aria-label="GPU & Compute guides">
        <div className="location-pill-list">
          <Link href={GPU_COMPUTE_PATH} className="location-pill">
            Overview
          </Link>
          {GPU_TOPIC_PAGES.map((item) => (
            <Link
              key={item.slug}
              href={`${GPU_COMPUTE_PATH}/${item.slug}`}
              className={`location-pill ${item.slug === page.slug ? "location-pill--all" : ""}`}
              aria-current={item.slug === page.slug ? "page" : undefined}
            >
              {item.navLabel}
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

          {page.responsibilitySplit ? (
            <div className="network-split" aria-label="Responsibility boundaries">
              <article className="panel">
                <p className="eyebrow eyebrow--plain">Operator scope</p>
                <h2 className="card-title">What Ali Arshad handles</h2>
                <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                  {page.responsibilitySplit.operatorHandles.map((item) => (
                    <li key={item}>
                      <Icon name="check" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <p className="eyebrow eyebrow--plain">Customer scope</p>
                <h2 className="card-title">What the customer handles</h2>
                <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                  {page.responsibilitySplit.customerHandles.map((item) => (
                    <li key={item}>
                      <Icon name="check" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}

          {page.embedEstimator ? (
            <section className="panel panel--lg" aria-labelledby="gpu-inline-estimator">
              <p className="eyebrow eyebrow--plain">Interactive scope &amp; quote builder</p>
              <h2 className="section-title section-title--sm" id="gpu-inline-estimator">
                Structure your workload brief (zero invented rates)
              </h2>
              <p className="section-sub" style={{ marginBottom: "20px" }}>
                Screen basic single-host fit and generate a clean requirements summary to attach to your inquiry.
              </p>
              <GpuQuoteEstimator />
            </section>
          ) : null}
        </div>
      </section>

      <Faq
        id={`faq-gpu-${page.slug}`}
        eyebrow="Practical answers"
        title={`${page.navLabel}: common questions`}
        items={page.faqs}
        surface
      />

      <ContactCTA
        standalone
        eyebrow="Next step"
        title="Ready to confirm current hardware availability?"
        text="Share your target software stack, timing, and rough footprint. If a single-host booking fits cleanly, Ali will reply with verified specs and a written quote."
        button="Submit workload brief"
        href={contactHref}
        secondaryHref={`${GPU_COMPUTE_PATH}/${nextTopic.slug}`}
        secondaryLabel={`Next guide: ${nextTopic.navLabel}`}
      />
    </>
  );
}

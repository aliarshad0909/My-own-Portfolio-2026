import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FictionalCustomerShowcase } from "@/components/locations/FictionalCustomerShowcase";
import { LocationsBrowser } from "@/components/locations/LocationsBrowser";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { FICTIONAL_DEMO_PROFILES } from "@/lib/geo/fictional-profiles";
import { US_REGIONS, US_STATES } from "@/lib/geo/states";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";
import { NATIONWIDE_SERVICES, serviceAreaMatrix } from "@/lib/seo/service-areas";

export const metadata: Metadata = pageMetadata({
  title: "Where I Work: Remote Digital Studio Serving All 50 US States",
  description:
    "An independent remote studio partnering with businesses across all 50 US states and D.C. Web development, n8n automation, AI agents, branding and sourcing — with zero fabricated local offices.",
  path: "/locations",
});

const REMOTE_PRINCIPLES = [
  {
    icon: "globe" as const,
    title: "Remote nationwide — no fake offices",
    detail: "This is an independent remote studio. There are no rented virtual mailboxes and no fabricated city addresses — just transparent remote delivery.",
  },
  {
    icon: "clock" as const,
    title: "Overlap across US time zones",
    detail: "Discovery calls, live demos and milestone reviews schedule cleanly across Eastern, Central, Mountain and Pacific working hours.",
  },
  {
    icon: "layers" as const,
    title: "Written scope & staged async updates",
    detail: "Every build runs on clear written specs, preview URLs and async video/text check-ins so progress never stalls waiting for unnecessary meetings.",
  },
  {
    icon: "check" as const,
    title: "Transparent state overviews",
    detail: "Every state overview is available to visitors and connected to relevant work. Pages stay out of search results until genuine local evidence and distinct geographic content support indexing.",
  },
];

export default function LocationsPage() {
  const statesForBrowser = US_STATES.map((s) => ({
    slug: s.slug,
    name: s.name,
    code: s.code,
    region: s.region,
    largestMetro: s.largestMetro,
    live: shouldRender(s.publicationState),
  }));

  const matrixCount = serviceAreaMatrix().length;
  const pillarServices = NATIONWIDE_SERVICES.filter((s) => s.tier === "pillar");
  const specializedServices = NATIONWIDE_SERVICES.filter((s) => s.tier === "seo-specialization");

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
        ]}
      />
      <PageHero
        eyebrow="US Coverage · Remote Studio"
        title="Working remotely across all 50 US states"
        lead="Web engineering, n8n workflow automation, AI agents, brand systems and sourcing coordination delivered remotely — with one accountable point of contact wherever your team sits."
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/diagrams/remote-us-delivery-zones.svg"
                alt="Schematic of remote studio delivery across Pacific, Mountain, Central and Eastern US time zones with staged async reviews and zero physical branch offices"
                width={1200}
                height={720}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Remote US time-zone overlap — zero fabricated offices</span>
            </div>
          </div>
        }
      />

      <section className="section section--tight" aria-labelledby="remote-model">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">How remote delivery works</p>
            <h2 className="section-title section-title--sm" id="remote-model">
              Transparent national coverage without doorway spam
            </h2>
            <p className="section-sub">
              Most agencies spin up hundreds of near-identical &ldquo;developer in [city]&rdquo; doorway pages. Here, the nationwide architecture ({matrixCount} planned service × state combinations across all direct business pillars and SEO specializations) stays strictly unpublished until each page has a real local signal and passes editorial review for locally differentiated content.
            </p>
          </div>
          <ul className="hub-deliverables">
            {REMOTE_PRINCIPLES.map((p) => (
              <li key={p.title} className="hub-deliverable">
                <div className="hub-deliverable__head">
                  <span className="hub-deliverable__icon" aria-hidden="true">
                    <Icon name={p.icon} size={18} />
                  </span>
                  <h3 className="hub-deliverable__title">{p.title}</h3>
                </div>
                <p className="hub-deliverable__detail">{p.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="states-directory">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">50 states + D.C.</p>
            <h2 className="section-title section-title--sm" id="states-directory">
              Browse coverage by region or state
            </h2>
            <p className="section-sub">
              Every state below links to a practical overview of remote services, the working process, relevant examples and next steps. These broad overviews are noindex until supported by genuine local evidence.
            </p>
          </div>
          <figure className="article-figure" style={{ marginBottom: "1.75rem", maxWidth: "58rem" }}>
            <div className="article-figure__frame article-figure__frame--dark-diagram">
              <Image
                src="/images/site-visuals/locations/us-remote-regions-map.svg"
                alt="Minimalist US regional schematic showing remote coverage across West, Midwest, South and Northeast Census regions with zero physical branch offices or fabricated map pins"
                width={1200}
                height={720}
                loading="lazy"
                sizes="(min-width: 1024px) 900px, 94vw"
              />
            </div>
            <figcaption className="article-figure__caption">
              <span>Stylized regional overview of remote studio coverage across all 50 US states and D.C. — zero physical offices or fabricated pins.</span>
            </figcaption>
          </figure>
          <LocationsBrowser regions={US_REGIONS} states={statesForBrowser} />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="pilot-metros">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Researched city architecture</p>
            <h2 className="section-title section-title--sm" id="pilot-metros">
              {PILOT_CITIES.length} tracked US metros across 24 states + D.C.
            </h2>
            <p className="section-sub">
              Listed openly as part of the studio&apos;s state → city architecture; each city page carries verified BLS/BEA economic sources in
              preview environments and remains gated (NeedsEvidence, out of the production sitemap) until verified local engagement warrants indexing.
            </p>
          </div>
          <ul className="location-grid">
            {PILOT_CITIES.map((c) => {
              const live = shouldRender(c.publicationState);
              const href = `/locations/${c.stateSlug}/${c.slug}`;
              return (
                <li key={href} className="loc-state-card">
                  <div>
                    {live ? (
                      <Link href={href}>
                        <strong>{c.name}</strong>
                      </Link>
                    ) : (
                      <span>{c.name}</span>
                    )}
                    <div className="loc-state-card__meta">{c.primaryService}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: "36px" }}>
            <FictionalCustomerShowcase
              locationLabel="US remote engagements"
              profiles={FICTIONAL_DEMO_PROFILES}
            />
          </div>
        </div>
      </section>

      <section className="section section--tight section--surface" aria-labelledby="nationwide-services">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Available nationwide</p>
            <h2 className="section-title section-title--sm" id="nationwide-services">
              Primary business pillars &amp; focused SEO specializations
            </h2>
            <p className="section-sub">
              All five direct studio pillars—including Creative Production and Brand &amp; Growth—plus focused technical specializations are delivered remotely nationwide. Partner-delivered specialist work is coordinated transparently through the Studio Network.
            </p>
          </div>
          <p className="label" style={{ marginTop: "1rem" }}>Primary business pillars</p>
          <ul className="hub-card-grid">
            {pillarServices.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">Primary pillar · Remote</span>
                  <span className="hub-link-card__title">
                    <span>{s.label}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Explore scope, deliverables, demonstrations and FAQs.
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services/gpu-compute" className="hub-link-card">
                <span className="hub-link-card__kind">Consultation-led · Remote RTX</span>
                <span className="hub-link-card__title">
                  <span>RTX GPU compute rental</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Submit AI inference, model testing, or 3D rendering requirements for capacity verification and a custom hourly quote.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/studio-network" className="hub-link-card">
                <span className="hub-link-card__kind">Partner pillar · Coordinated</span>
                <span className="hub-link-card__title">
                  <span>Specialist technical collaboration</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Partner-delivered security, blockchain and specialist engineering coordinated under one contact.
                </span>
              </Link>
            </li>
          </ul>
          <p className="label" style={{ marginTop: "2rem" }}>Focused SEO specializations</p>
          <ul className="hub-card-grid">
            {specializedServices.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">Specialization hub · Remote</span>
                  <span className="hub-link-card__title">
                    <span>{s.label}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Dedicated deep-dive page with architecture, workflows and FAQs.
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Work together remotely"
        title="Wherever your team is based, start the same way"
        text="Tell me what you are building or automating. A short discovery call followed by a clear written scope works cleanly from any US time zone."
        button="Start a conversation"
      />
    </>
  );
}

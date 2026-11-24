import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FictionalCustomerShowcase } from "@/components/locations/FictionalCustomerShowcase";
import { PreviewSampleScenarios } from "@/components/locations/PreviewSampleScenarios";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Sources } from "@/components/seo/Sources";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EditorNote } from "@/components/ui/EditorNote";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { PILOT_CITIES, getCity } from "@/lib/geo/cities";
import { getCityLocalContent } from "@/lib/geo/city-local-content";
import { selectFictionalProfilesForServices } from "@/lib/geo/fictional-profiles";
import { cityIntro, cityMeta } from "@/lib/geo/location-content";
import { previewSampleForCity } from "@/lib/geo/preview-samples";
import { getState } from "@/lib/geo/states";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";

type Props = { params: Promise<{ state: string; city: string }> };

export function generateStaticParams() {
  return PILOT_CITIES.filter((c) => shouldRender(c.publicationState)).map((c) => ({
    state: c.stateSlug,
    city: c.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const cityRecord = getCity(state, city);
  const stateRecord = getState(state);
  if (!cityRecord || !stateRecord) return {};
  const local = getCityLocalContent(state, city);
  const meta = cityMeta(cityRecord, stateRecord);
  return pageMetadata({
    title: local ? local.headline : meta.title,
    description: local ? `${local.angle} Remote independent studio — no local office claimed.` : meta.description,
    path: `/locations/${state}/${city}`,
    index: meta.index,
  });
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const cityRecord = getCity(state, city);
  const stateRecord = getState(state);
  if (!cityRecord || !stateRecord || !shouldRender(cityRecord.publicationState)) {
    notFound();
  }

  const local = getCityLocalContent(state, city);
  const relatedProjects = (local?.recommendedProjectSlugs ?? [])
    .map((slug) => getProject(slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const siblingCities = PILOT_CITIES.filter(
    (c) => c.slug !== cityRecord.slug && shouldRender(c.publicationState),
  ).slice(0, 4);

  const primaryFit = local?.serviceFit[0];
  const fictionalProfiles = selectFictionalProfilesForServices(
    (local?.serviceFit ?? []).map((f) => f.href),
    1,
  );
  const sampleScenarios = local
    ? previewSampleForCity(
        cityRecord,
        stateRecord,
        local.angle,
        primaryFit?.href ?? "/services/web-development",
        primaryFit?.service ?? cityRecord.primaryService,
      )
    : [];

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: stateRecord.name, path: `/locations/${stateRecord.slug}` },
          { name: cityRecord.name, path: `/locations/${state}/${city}` },
        ]}
      />
      <PageHero
        eyebrow={`${cityRecord.name}, ${stateRecord.code} · Remote`}
        title={local ? local.headline : `${cityRecord.primaryService} for ${cityRecord.name}`}
        lead={
          local
            ? local.angle
            : `An independent remote studio working with ${cityRecord.name} businesses on ${cityRecord.primaryService.toLowerCase()} and the wider digital practice.`
        }
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/site-visuals/locations/remote-service-delivery-card.svg"
                alt={`Remote delivery workflow for ${cityRecord.name}, ${stateRecord.code} businesses — scheduled time-zone overlap and written milestones with zero local branch office`}
                width={1200}
                height={620}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Remote studio serving {cityRecord.name} — no local office claimed</span>
            </div>
          </div>
        }
      />

      {!isIndexable(cityRecord.publicationState) ? (
        <EditorNote>
          This {cityRecord.name} page is {cityRecord.publicationState} (preview-only, noindex, excluded from production and sitemap.xml). It now
          carries sourced business-service context for review, but remains gated until a verified local signal and completed editorial review approve
          publication in lib/geo/cities.ts.
        </EditorNote>
      ) : null}

      {local ? (
        <>
          <section className="container section location-detail">
            <div className="location-detail__grid">
              <article className="location-detail__card">
                <p className="eyebrow eyebrow--plain">Intended audience</p>
                <h2 className="section-title section-title--sm">Who this service page fits</h2>
                <p className="section-sub">{local.audience}</p>
              </article>
              <article className="location-detail__card">
                <p className="eyebrow eyebrow--plain">Remote working cadence</p>
                <h2 className="section-title section-title--sm">Time-zone overlap &amp; transparency</h2>
                <p className="section-sub">{local.timeZoneOverlap}</p>
                <p className="fine-print">
                  No physical {cityRecord.name} office, local staff, or local client engagement is implied on this page.
                </p>
              </article>
            </div>

            <div className="location-detail__local">
              <p className="eyebrow eyebrow--plain">The {cityRecord.name} business context</p>
              <h2 className="section-title section-title--sm">Local economic drivers &amp; remote service fit</h2>
              {local.context.map((para, i) => (
                <p key={i} className="measure">
                  {para.text}
                  {para.sources && para.sources.length > 0 ? (
                    <sup className="cite">
                      {para.sources.map((s, j) => (
                        <a key={j} href={`#source-${s + 1}`} aria-label={`Source ${s + 1}`}>
                          [{s + 1}]
                        </a>
                      ))}
                    </sup>
                  ) : null}
                </p>
              ))}
              <Sources items={local.sources} />
            </div>

            <div className="location-detail__projects">
              <p className="eyebrow eyebrow--plain">Matched studio services</p>
              <h2 className="section-title section-title--sm">Services aligned with {cityRecord.name} teams</h2>
              <ul className="hub-card-grid" style={{ marginTop: "18px" }}>
                {local.serviceFit.map((svc) => (
                  <li key={svc.href}>
                    <Link href={svc.href} className="hub-link-card">
                      <span className="hub-link-card__kind">Remote service</span>
                      <span className="hub-link-card__title">
                        <span>{svc.service}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">{svc.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {relatedProjects.length > 0 ? (
              <div className="location-detail__projects">
                <p className="eyebrow eyebrow--plain">Relevant studio demonstrations</p>
                <h2 className="section-title section-title--sm">Inspect working software &amp; systems</h2>
                <p className="section-sub measure">
                  Studio demonstrations built under fictional brands — shown as concrete proof of technical execution, never as {cityRecord.name}{" "}
                  client work.
                </p>
                <ul className="hub-card-grid" style={{ marginTop: "18px" }}>
                  {relatedProjects.map((p) => {
                    const href = p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`;
                    return (
                      <li key={p.slug}>
                        <Link href={href} className="hub-link-card">
                          <span className="hub-link-card__kind">
                            <TypeBadge type={p.projectType} /> <StatusBadge status={p.status} />
                          </span>
                          <span className="hub-link-card__title">
                            <span>{p.title}</span>
                            <Icon name="arrow-up-right" size={16} />
                          </span>
                          <span className="hub-link-card__desc">{p.summary}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <FictionalCustomerShowcase
              locationLabel={`${cityRecord.name}, ${stateRecord.code}`}
              profiles={fictionalProfiles}
            />

            <PreviewSampleScenarios locationName={`${cityRecord.name}, ${stateRecord.code}`} scenarios={sampleScenarios} />

            <div className="panel location-fit-strip">
              <p className="eyebrow eyebrow--plain">Related coverage</p>
              <div className="location-pill-list" style={{ marginTop: "10px" }}>
                <Link href={`/locations/${stateRecord.slug}`} className="location-pill">
                  {stateRecord.name} state overview
                </Link>
                {siblingCities.map((peer) => (
                  <Link key={peer.slug} href={`/locations/${peer.stateSlug}/${peer.slug}`} className="location-pill location-pill--metro">
                    {peer.name}
                  </Link>
                ))}
                <Link href="/locations" className="location-pill location-pill--all">
                  All US coverage →
                </Link>
              </div>
            </div>
          </section>

          {local.faqs.length > 0 ? (
            <Faq
              id={`faq-city-${cityRecord.slug}`}
              eyebrow="Location & remote delivery questions"
              title={`${cityRecord.name} project questions`}
              items={local.faqs}
              surface
            />
          ) : null}
        </>
      ) : (
        <section className="container section">
          {cityIntro(cityRecord, stateRecord).map((p, i) => (
            <p key={i} className="measure">
              {p}
            </p>
          ))}
        </section>
      )}

      <ContactCTA
        standalone
        title={`${cityRecord.name} project in mind?`}
        text="Start with a short discovery call. Remote delivery, clear written scope, and direct communication."
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { getInsight } from "@/lib/content/insights";
import { PILOT_CITIES, getCity } from "@/lib/geo/cities";
import { getCityPilot } from "@/lib/geo/city-pilots";
import { cityIntro, cityMeta } from "@/lib/geo/location-content";
import { getState } from "@/lib/geo/states";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";
import { breadcrumbSchema } from "@/lib/structured-data";

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
  const pilot = getCityPilot(state, city);
  const meta = cityMeta(cityRecord, stateRecord);
  return pageMetadata({
    title: pilot ? pilot.headline : meta.title,
    description: pilot ? `${pilot.audience} ${pilot.remoteDisclosure}` : meta.description,
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

  const pilot = getCityPilot(state, city);
  const relatedProjects = (pilot?.relatedProjectSlugs ?? [])
    .map((s) => getProject(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const relatedInsights = (pilot?.relatedInsightSlugs ?? [])
    .map((s) => getInsight(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined && p.status === "Published");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: stateRecord.name, path: `/locations/${stateRecord.slug}` },
          { name: cityRecord.name, path: `/locations/${state}/${city}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: stateRecord.name, path: `/locations/${stateRecord.slug}` },
          { name: cityRecord.name, path: `/locations/${state}/${city}` },
        ]}
      />
      <PageHero
        eyebrow={`${cityRecord.name}, ${stateRecord.code} · Remote Studio Pilot`}
        title={pilot ? pilot.headline : `${cityRecord.primaryService} for ${cityRecord.name}`}
        lead={
          pilot
            ? pilot.primaryQuestionAnswered
            : `An independent remote studio working with ${cityRecord.name} businesses on ${cityRecord.primaryService.toLowerCase()} and the wider digital practice.`
        }
      />

      {pilot ? (
        <>
          <section className="section section--tight" aria-labelledby="city-overview-title">
            <div className="container">
              <div className="panel" role="note" style={{ marginBottom: "28px" }}>
                <p className="eyebrow eyebrow--plain">Remote delivery &amp; indexing status</p>
                <p style={{ marginTop: "8px" }}>{pilot.remoteDisclosure}</p>
                <p className="fine-print" style={{ marginTop: "8px" }}>
                  Preview status: published for review and excluded from search indexing (noindex, omitted from sitemap.xml) while regional market
                  fit is evaluated.
                </p>
              </div>

              <div className="city-pilot-meta">
                <div className="panel">
                  <p className="eyebrow eyebrow--plain">Intended audience</p>
                  <p style={{ marginTop: "8px" }}>{pilot.audience}</p>
                </div>
                <div className="panel">
                  <p className="eyebrow eyebrow--plain">Working hours &amp; cadence</p>
                  <p style={{ marginTop: "8px" }}>{pilot.timeZoneOverlap}</p>
                </div>
              </div>

              <div className="city-pilot-grid" id="city-overview-title">
                {pilot.localFocus.map((block) => (
                  <article key={block.heading} className="panel">
                    <h2 className="card-title">{block.heading}</h2>
                    <p className="section-sub" style={{ marginTop: "8px" }}>
                      {block.summary}
                    </p>
                    <ul className="check-list check-list--spaced" style={{ marginTop: "14px" }}>
                      {block.points.map((pt) => (
                        <li key={pt}>
                          <Icon name="check" size={15} />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section section--surface section--tight" aria-labelledby="city-services-title">
            <div className="container">
              <div className="section-head">
                <p className="eyebrow eyebrow--plain">Relevant studio services</p>
                <h2 className="section-title section-title--sm" id="city-services-title">
                  Services aligned with {cityRecord.name} teams
                </h2>
              </div>
              <ul className="hub-card-grid">
                {pilot.recommendedServices.map((svc) => (
                  <li key={svc.href}>
                    <Link href={svc.href} className="hub-link-card">
                      <span className="hub-link-card__kind">Remote service hub</span>
                      <span className="hub-link-card__title">
                        <span>{svc.label}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">{svc.reason}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="insight-relations" style={{ marginTop: "28px" }}>
                {relatedProjects.length > 0 ? (
                  <div className="panel">
                    <p className="eyebrow eyebrow--plain">Relevant studio demonstrations</p>
                    <ul className="sources-list" style={{ marginTop: "8px" }}>
                      {relatedProjects.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/case-studies/${p.slug}`}>{p.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {relatedInsights.length > 0 ? (
                  <div className="panel">
                    <p className="eyebrow eyebrow--plain">Related insights</p>
                    <ul className="sources-list" style={{ marginTop: "8px" }}>
                      {relatedInsights.map((post) => (
                        <li key={post.slug}>
                          <Link href={`/insights/${post.slug}`}>{post.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="panel" style={{ marginTop: "24px" }}>
                <h3 className="card-title">Local research sources &amp; review schedule</h3>
                <p className="fine-print" style={{ marginTop: "6px" }}>
                  Factual economic context on this page is reviewed on a 6-month cycle and backed by primary institutional sources.
                </p>
                <ul className="sources-list" style={{ marginTop: "10px" }}>
                  {pilot.sources.map((src) => (
                    <li key={src.url}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                        {src.label}
                      </a>{" "}
                      <span>
                        — {src.publisher} (checked {src.checkedDate}; scheduled review {src.reviewBy})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <EditorNote>
            This {cityRecord.name} page is a scaffold. Do not publish it until there is a real {cityRecord.name} client or a committed service area,
            and the copy below has been rewritten to be genuinely specific. Flip its record to &ldquo;Published&rdquo; in lib/geo/cities.ts only then.
          </EditorNote>

          <section className="container section">
            {cityIntro(cityRecord, stateRecord).map((p, i) => (
              <p key={i} className="measure">
                {p}
              </p>
            ))}
          </section>
        </>
      )}

      <ContactCTA
        standalone
        title={`${cityRecord.name} project in mind?`}
        text="Start with a short discovery call. Remote delivery, clear written scope, and direct communication."
      />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PreviewSampleScenarios } from "@/components/locations/PreviewSampleScenarios";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Sources } from "@/components/seo/Sources";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { citiesInState } from "@/lib/geo/cities";
import {
  projectsForState,
  relatedStatesInRegion,
  stateHasGpuComputeFit,
} from "@/lib/geo/location-connections";
import { stateIntro, stateMeta } from "@/lib/geo/location-content";
import { previewSamplesForState } from "@/lib/geo/preview-samples";
import { getStateLocalContent } from "@/lib/geo/state-local-content";
import { US_STATES, getState } from "@/lib/geo/states";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";
import { GPU_COMPUTE_PATH } from "@/lib/gpu-compute";
import { breadcrumbSchema } from "@/lib/structured-data";

type Props = { params: Promise<{ state: string }> };

// State overview pages are public for visitors but remain noindex until they
// have genuine, locally differentiated evidence.
export function generateStaticParams() {
  return US_STATES.filter((s) => shouldRender(s.publicationState)).map((s) => ({
    state: s.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const record = getState(state);
  if (!record) return {};
  const meta = stateMeta(record);
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    path: `/locations/${record.slug}`,
    index: meta.index,
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const record = getState(state);
  if (!record || !shouldRender(record.publicationState)) notFound();

  const cities = citiesInState(record.slug);
  const local = getStateLocalContent(record.slug);
  const gpuFit = stateHasGpuComputeFit(record.slug);
  const relatedProjects = projectsForState(record.slug, 3);
  const regionalPeers = relatedStatesInRegion(record, 4);
  const sampleScenarios = previewSamplesForState(record, local);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: record.name, path: `/locations/${record.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: record.name, path: `/locations/${record.slug}` },
        ]}
      />
      <PageHero
        eyebrow={`${record.region} · Remote`}
        title={`Serving ${record.name}, remotely`}
        lead={`Web development, AI automation, data dashboards and creative production for ${record.name} businesses, delivered as an independent remote studio.`}
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/site-visuals/locations/remote-service-delivery-card.svg"
                alt={`Remote studio delivery schematic for ${record.name} showing scheduled US time-zone overlap and staged milestone hand-offs with zero physical branch office`}
                width={1200}
                height={620}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Remote delivery to {record.name} — no claimed local office</span>
            </div>
          </div>
        }
      />

      <section className="container section location-detail">
        <div className="location-detail__intro">
          {stateIntro(record).map((p, i) => (
            <p key={i} className="measure">
              {p}
            </p>
          ))}
        </div>

        {local ? (
          <div className="location-detail__local">
            <p className="eyebrow eyebrow--plain">The {record.name} market</p>
            <h2 className="section-title section-title--sm">Business context &amp; service fit</h2>
            <p className="section-sub measure">{local.angle}</p>
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
            {local.serviceFit.length > 0 ? (
              <ul className="location-detail__fit">
                {local.serviceFit.map((f, i) => (
                  <li key={i}>
                    <Link className="text-link" href={f.href}>
                      {f.service}
                    </Link>{" "}
                    {f.text}
                  </li>
                ))}
                {gpuFit ? (
                  <li>
                    <Link className="text-link" href={GPU_COMPUTE_PATH}>
                      RTX GPU compute rental (consultation)
                    </Link>{" "}
                    Scope consultation-led RTX server runs for AI inference, model testing, or Blender Cycles 3D rendering where hardware fits your
                    workload.
                  </li>
                ) : null}
              </ul>
            ) : null}
            <Sources items={local.sources} />
          </div>
        ) : null}

        {relatedProjects.length > 0 ? (
          <div className="location-detail__projects">
            <p className="eyebrow eyebrow--plain">Relevant studio demonstrations</p>
            <h2 className="section-title section-title--sm">Working builds aligned with {record.name} business needs</h2>
            <p className="section-sub measure">
              These are studio demonstrations and case studies — labeled openly as demonstrations rather than past {record.name} client engagements.
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

        <PreviewSampleScenarios locationName={record.name} scenarios={sampleScenarios} />

        <div className="location-detail__grid">
          <article className="location-detail__card">
            <p className="eyebrow eyebrow--plain">Remote collaboration</p>
            <h2 className="section-title section-title--sm">A clear process, wherever you work</h2>
            <p className="section-sub">
              We start with your goals, agree the scope in writing, then work in visible milestones with regular updates and a documented hand-off.
              Calls can be scheduled around your team&rsquo;s time zone.
            </p>
            <Link className="text-link" href="/services">
              Explore services <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="location-detail__card">
            <p className="eyebrow eyebrow--plain">Start with something concrete</p>
            <h2 className="section-title section-title--sm">See the work before we talk</h2>
            <p className="section-sub">
              Explore working software demonstrations, project breakdowns, and practical business calculators. Demonstration projects use fictional
              data and are clearly labeled.
            </p>
            <div className="location-detail__links">
              <Link className="text-link" href="/products">
                Browse products <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/case-studies">
                Read case studies <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/tools">
                Open business calculators <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>

        {cities.length > 0 ? (
          <div className="panel location-fit-strip">
            <p className="eyebrow eyebrow--plain">Registered metros in {record.name}</p>
            <p className="fine-print" style={{ marginTop: "6px" }}>
              Tracked metros served remotely — never claimed as physical office locations.
            </p>
            <div className="location-pill-list" style={{ marginTop: "12px" }}>
              {cities.map((c) =>
                shouldRender(c.publicationState) ? (
                  <Link key={c.slug} href={`/locations/${record.slug}/${c.slug}`} className="location-pill location-pill--metro">
                    {c.name} — {c.primaryService}
                  </Link>
                ) : (
                  <span key={c.slug} className="location-pill location-pill--static">
                    {c.name} ({c.primaryService})
                  </span>
                ),
              )}
            </div>
          </div>
        ) : null}

        {regionalPeers.length > 0 ? (
          <div className="panel location-fit-strip">
            <p className="eyebrow eyebrow--plain">Nearby {record.region} coverage</p>
            <div className="location-pill-list" style={{ marginTop: "10px" }}>
              {regionalPeers.map((peer) => (
                <Link key={peer.slug} href={`/locations/${peer.slug}`} className="location-pill">
                  {peer.name}
                </Link>
              ))}
              <Link href="/locations" className="location-pill location-pill--all">
                All 50 states + D.C. →
              </Link>
            </div>
          </div>
        ) : null}

        <p className="fine-print location-detail__market">
          This overview explains remote availability in {record.name}; it does not imply an office, local staff, or a local client engagement.
        </p>
      </section>

      <ContactCTA
        standalone
        title={`Based in ${record.name}? Let's talk`}
        text="Remote delivery, clear scope, staged hand-off. Start with a short discovery call."
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { US_STATES, getState } from "@/lib/geo/states";
import { citiesInState } from "@/lib/geo/cities";
import { shouldRender } from "@/lib/seo/publication";
import { stateIntro, stateMeta } from "@/lib/geo/location-content";
import { getStateLocalContent } from "@/lib/geo/state-local-content";
import { Sources } from "@/components/seo/Sources";

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

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: record.name, path: `/locations/${record.slug}` },
        ])}
      />
      <PageHero
        eyebrow={`${record.region} · Remote`}
        title={`Serving ${record.name}, remotely`}
        lead={`Web development, AI automation and creative production for ${record.name} businesses, delivered as an independent remote studio.`}
      />

      <section className="container section location-detail">
        <div className="location-detail__intro">
          {stateIntro(record).map((p, i) => (
            <p key={i} className="measure">{p}</p>
          ))}
        </div>

        {local ? (
          <div className="location-detail__local">
            <p className="eyebrow eyebrow--plain">The {record.name} market</p>
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
                    <Link className="text-link" href={f.href}>{f.service}</Link> {f.text}
                  </li>
                ))}
              </ul>
            ) : null}
            <Sources items={local.sources} />
          </div>
        ) : null}
        <div className="location-detail__grid">
          <article className="location-detail__card">
            <p className="eyebrow eyebrow--plain">Remote collaboration</p>
            <h2 className="section-title section-title--sm">A clear process, wherever you work</h2>
            <p className="section-sub">We start with your goals, agree the scope in writing, then work in visible milestones with regular updates and a documented hand-off. Calls can be scheduled around your team’s time zone.</p>
            <Link className="text-link" href="/services">Explore services <span aria-hidden="true">→</span></Link>
          </article>
          <article className="location-detail__card">
            <p className="eyebrow eyebrow--plain">Start with something concrete</p>
            <h2 className="section-title section-title--sm">See the work before we talk</h2>
            <p className="section-sub">Explore working software demonstrations, project breakdowns, and practical business calculators. Demonstration projects use fictional data and are clearly labeled.</p>
            <div className="location-detail__links">
              <Link className="text-link" href="/products">Browse products <span aria-hidden="true">→</span></Link>
              <Link className="text-link" href="/case-studies">Read case studies <span aria-hidden="true">→</span></Link>
              <Link className="text-link" href="/tools">Open business calculators <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        </div>
        {cities.length > 0 ? (
          <p className="fine-print location-detail__market">Regional market reference: {cities.map((c) => c.name).join(", ")}. These are areas served remotely, not claimed office locations.</p>
        ) : null}
        <p className="fine-print location-detail__market">This overview explains remote availability in {record.name}; it does not imply an office, local staff, or a local client engagement.</p>
      </section>

      <ContactCTA
        standalone
        title={`Based in ${record.name}? Let's talk`}
        text="Remote delivery, clear scope, staged hand-off. Start with a short discovery call."
      />
    </>
  );
}

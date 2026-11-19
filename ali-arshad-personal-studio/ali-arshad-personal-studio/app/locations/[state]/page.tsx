import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { EditorNote } from "@/components/ui/EditorNote";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { US_STATES, getState } from "@/lib/geo/states";
import { citiesInState } from "@/lib/geo/cities";
import { shouldRender } from "@/lib/seo/publication";
import { stateIntro, stateMeta } from "@/lib/geo/location-content";

type Props = { params: Promise<{ state: string }> };

// Only states whose page is renderable on THIS deployment get built. In
// production that is Published states only, so gated states 404 — no doorway
// pages are ever served.
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

      <EditorNote>
        This {record.name} page is a scaffold. It must not be published until
        there is a genuine local signal (a {record.name} client or a committed
        service area) and the templated copy below has been rewritten into
        something unique. Set its record to &ldquo;Published&rdquo; in
        lib/geo/states.ts only then.
      </EditorNote>

      <section className="container section">
        {stateIntro(record).map((p, i) => (
          <p key={i} className="measure">
            {p}
          </p>
        ))}
      </section>

      {cities.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Metros in {record.name}</h2>
          <ul className="location-grid">
            {cities.map((c) => {
              const live = shouldRender(c.publicationState);
              const href = `/locations/${record.slug}/${c.slug}`;
              return live ? (
                <li key={href}>
                  <Link href={href}>{c.name}</Link>
                </li>
              ) : (
                <li key={href} className="muted">
                  {c.name}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <ContactCTA
        standalone
        title={`Based in ${record.name}? Let's talk`}
        text="Remote delivery, clear scope, staged hand-off. Start with a short discovery call."
      />
    </>
  );
}

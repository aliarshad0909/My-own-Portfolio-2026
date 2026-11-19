import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { EditorNote } from "@/components/ui/EditorNote";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { getState } from "@/lib/geo/states";
import { PILOT_CITIES, getCity } from "@/lib/geo/cities";
import { shouldRender } from "@/lib/seo/publication";
import { cityIntro, cityMeta } from "@/lib/geo/location-content";

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
  const meta = cityMeta(cityRecord, stateRecord);
  return pageMetadata({
    title: meta.title,
    description: meta.description,
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
      <PageHero
        eyebrow={`${cityRecord.name}, ${stateRecord.code} · Remote`}
        title={`${cityRecord.primaryService} for ${cityRecord.name}`}
        lead={`An independent remote studio working with ${cityRecord.name} businesses on ${cityRecord.primaryService.toLowerCase()} and the wider digital practice.`}
      />

      <EditorNote>
        This {cityRecord.name} page is a scaffold. Do not publish it until there
        is a real {cityRecord.name} client or a committed service area, and the
        copy below has been rewritten to be genuinely specific. Flip its record
        to &ldquo;Published&rdquo; in lib/geo/cities.ts only then.
      </EditorNote>

      <section className="container section">
        {cityIntro(cityRecord, stateRecord).map((p, i) => (
          <p key={i} className="measure">
            {p}
          </p>
        ))}
      </section>

      <ContactCTA
        title={`${cityRecord.name} project in mind?`}
        text="Start with a short discovery call. Remote delivery, clear written scope."
      />
    </>
  );
}

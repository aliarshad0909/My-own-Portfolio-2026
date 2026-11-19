import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { US_REGIONS, US_STATES, statesInRegion } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Where I Work: Remote Studio Serving the United States",
  description:
    "An independent studio working remotely with businesses across all 50 US states. Web development, AI automation and creative production, delivered wherever you are.",
  path: "/locations",
});

/** A state links to its own page only when that page is actually live. */
function StateItem({ slug, name, live }: { slug: string; name: string; live: boolean }) {
  if (live) {
    return (
      <li>
        <Link href={`/locations/${slug}`}>{name}</Link>
      </li>
    );
  }
  return <li className="muted">{name}</li>;
}

export default function LocationsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
        ])}
      />
      <PageHero
        eyebrow="Coverage"
        title="A remote studio, working across the United States"
        lead="The work travels. I partner with founders and teams in every US state, delivered remotely with clear scope, timezone overlap and staged hand-off. This page is a map of intent, not a wall of near-identical landing pages."
      />

      <section className="container section">
        <p className="lead measure">
          There is no physical office to claim, so you will not find a separate
          &ldquo;web developer in your city&rdquo; page for every town. A state or
          city page appears here only when there is a real reason for it — a
          client in that market, or a service area I have genuinely committed to.
          Everywhere else, the honest answer is the same: remote, nationwide,
          one point of contact.
        </p>
      </section>

      {US_REGIONS.map((region) => (
        <section key={region} className="container section--tight">
          <h2 className="section-title">{region}</h2>
          <ul className="location-grid">
            {statesInRegion(region).map((s) => (
              <StateItem
                key={s.slug}
                slug={s.slug}
                name={s.name}
                live={shouldRender(s.publicationState)}
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="container section--tight">
        <h2 className="section-title">Pilot metros</h2>
        <p className="measure">
          A small set of high-intent cities where a dedicated page could be
          justified first. Listed for transparency; each goes live only when it
          is earned.
        </p>
        <ul className="location-grid">
          {PILOT_CITIES.map((c) => {
            const live = shouldRender(c.publicationState);
            const href = `/locations/${c.stateSlug}/${c.slug}`;
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

      <ContactCTA
        title="Wherever you are, start the same way"
        text="Tell me what you are building. A short discovery call is the fastest path, from any US state."
      />
    </>
  );
}

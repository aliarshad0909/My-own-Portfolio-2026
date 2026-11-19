import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { singleServiceSchema } from "@/lib/structured-data";
import { getProject } from "@/lib/projects";
import type { ServiceHub } from "@/lib/seo/service-hubs";
import type { UsState } from "@/lib/geo/states";
import type { CityServiceArea } from "@/lib/seo/service-areas";
import { isIndexable } from "@/lib/seo/publication";
import { cityServiceAreaIntro } from "@/lib/seo/service-area-content";

export function CityServiceAreaView({
  area,
  hub,
  state,
}: {
  area: CityServiceArea;
  hub: ServiceHub;
  state: UsState;
}) {
  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: `${hub.h1} in ${area.cityName}`,
          description: hub.lead,
          path: area.url,
          serviceType: hub.title,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: hub.h1, path: `/services/${hub.slug}` },
          { name: state.name, path: `/services/${hub.slug}/in/${state.slug}` },
          { name: area.cityName, path: area.url },
        ]}
      />

      <PageHero eyebrow={`${area.cityName}, ${state.code} · Remote`} title={`${hub.h1} in ${area.cityName}`} lead={hub.lead} />

      {!isIndexable(area.publicationState) ? (
        <EditorNote>
          This {hub.h1} × {area.cityName} city service-area page is{" "}
          {area.publicationState} (scaffold only). It renders on previews only
          (noindex) and stays unpublished in production until a genuine{" "}
          {area.cityName} local signal exists, bespoke local content replaces the
          scaffold, and editorialReview is completed in lib/seo/service-areas.ts.
          A city page requires a stronger local signal than its state page.
        </EditorNote>
      ) : null}

      <section className="container section">
        {cityServiceAreaIntro(hub, area, state).map((p, i) => (
          <p key={i} className="measure">
            {p}
          </p>
        ))}
      </section>

      <section className="container section--tight">
        <h2 className="section-title">What this covers in {area.cityName}</h2>
        <ul className="hub-list">
          {hub.includes.map((it) => (
            <li key={it}>
              <Icon name="check" size={18} /> <span>{it}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section--tight">
        <h2 className="section-title">Related</h2>
        <ul className="hub-links">
          {hub.projectSlugs.map((slug) => {
            const p = getProject(slug);
            return p ? (
              <li key={slug}>
                <ArrowLink href={`/work/${p.slug}`}>{p.title}</ArrowLink>
              </li>
            ) : null;
          })}
          <li>
            <ArrowLink href={`/services/${hub.slug}/in/${state.slug}`}>{hub.h1} across {state.name}</ArrowLink>
          </li>
          <li>
            <ArrowLink href={`/services/${hub.slug}`}>Full {hub.h1.toLowerCase()} service</ArrowLink>
          </li>
        </ul>
      </section>

      <ContactCTA
        standalone
        title={`${hub.h1} for your ${area.cityName} project`}
        text="Remote delivery, clear written scope, staged hand-off. Start with a short discovery call."
      />
    </>
  );
}

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
import type { ServiceArea } from "@/lib/seo/service-areas";
import { isIndexable } from "@/lib/seo/publication";
import { serviceAreaIntro } from "@/lib/seo/service-area-content";

export function ServiceAreaView({
  area,
  hub,
  state,
}: {
  area: ServiceArea;
  hub: ServiceHub;
  state: UsState;
}) {
  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: `${hub.h1} in ${state.name}`,
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
          { name: state.name, path: area.url },
        ]}
      />

      <PageHero
        eyebrow={`${state.name} · Remote`}
        title={`${hub.h1} in ${state.name}`}
        lead={hub.lead}
      />

      {!isIndexable(area.publicationState) ? (
        <EditorNote>
          This {hub.h1} × {state.name} service-area page is{" "}
          {area.publicationState}. It renders on previews only (noindex) and is
          not served in production until it has unique, geographically useful
          content and a genuine {state.name} signal, then is set to Published in
          lib/seo/service-areas.ts.
        </EditorNote>
      ) : null}

      <section className="container section">
        {serviceAreaIntro(hub, state).map((p, i) => (
          <p key={i} className="measure">
            {p}
          </p>
        ))}
      </section>

      <section className="container section--tight">
        <h2 className="section-title">What this covers in {state.name}</h2>
        <ul className="hub-list">
          {hub.includes.map((it) => (
            <li key={it}>
              <Icon name="check" size={18} /> <span>{it}</span>
            </li>
          ))}
        </ul>
      </section>

      {hub.projectSlugs.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Evidence</h2>
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
              <ArrowLink href={`/services/${hub.slug}`}>Full {hub.h1.toLowerCase()} service</ArrowLink>
            </li>
            <li>
              <ArrowLink href={`/locations/${state.slug}`}>All services in {state.name}</ArrowLink>
            </li>
          </ul>
        </section>
      ) : null}

      <ContactCTA
        standalone
        title={`${hub.h1} for your ${state.name} project`}
        text="Remote delivery, clear written scope, staged hand-off. Start with a short discovery call."
      />
    </>
  );
}

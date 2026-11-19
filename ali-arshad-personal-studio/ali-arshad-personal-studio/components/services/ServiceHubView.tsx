import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema, singleServiceSchema } from "@/lib/structured-data";
import { getProject } from "@/lib/projects";
import type { ServiceHub } from "@/lib/seo/service-hubs";
import { isIndexable, shouldRender } from "@/lib/seo/publication";

/** A related demonstration build, linked by slug with its real title. */
function WorkLink({ slug }: { slug: string }) {
  const p = getProject(slug);
  if (!p) return null;
  return (
    <li>
      <ArrowLink href={`/work/${p.slug}`}>{p.title}</ArrowLink>
    </li>
  );
}

export function ServiceHubView({ hub }: { hub: ServiceHub }) {
  const path = `/services/${hub.slug}`;
  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: hub.h1,
          description: hub.lead,
          path,
          serviceType: hub.title,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: hub.h1, path },
        ])}
      />

      <PageHero eyebrow="Service" title={hub.h1} lead={hub.lead}>
        <p className="measure">{hub.intent}</p>
      </PageHero>

      {!isIndexable(hub.publicationState) ? (
        <EditorNote>
          This hub is {hub.publicationState}. It renders on previews as noindex
          and will not be served in production until set to Published.
        </EditorNote>
      ) : null}

      <section className="container section">
        <h2 className="section-title">Problems this solves</h2>
        <ul className="hub-problems">
          {hub.problems.map((p) => (
            <li key={p}>&ldquo;{p}&rdquo;</li>
          ))}
        </ul>
      </section>

      <section className="container section--tight">
        <h2 className="section-title">What a typical engagement includes</h2>
        <ul className="hub-list">
          {hub.includes.map((i) => (
            <li key={i}>
              <Icon name="check" size={18} /> <span>{i}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section--tight">
        <h2 className="section-title">How the work runs</h2>
        <ol className="hub-steps">
          {hub.process.map((s, i) => (
            <li key={s.label}>
              <span className="hub-steps__n">{i + 1}</span>
              <span className="hub-steps__label">{s.label}</span>
              <span className="hub-steps__detail">{s.detail}</span>
            </li>
          ))}
        </ol>
      </section>

      {hub.projectSlugs.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Evidence: demonstration builds</h2>
          <p className="measure">
            Each of these is a complete, working build under a fictional brand,
            labelled as a demonstration. They evidence the capability above.
          </p>
          <ul className="hub-links">
            {hub.projectSlugs.map((slug) => (
              <WorkLink key={slug} slug={slug} />
            ))}
          </ul>
        </section>
      ) : null}

      {hub.spokes.filter((s) => shouldRender(s.publicationState)).length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Specialisms</h2>
          <ul className="hub-links">
            {hub.spokes
              .filter((s) => shouldRender(s.publicationState))
              .map((s) => (
                <li key={s.slug}>
                  <ArrowLink href={`/services/${hub.slug}/${s.slug}`}>{s.h1}</ArrowLink>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {hub.relatedTools.length > 0 || hub.relatedHubs.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Related</h2>
          <ul className="hub-links">
            {hub.relatedTools.map((t) => (
              <li key={t}>
                <ArrowLink href={t}>Try the tool</ArrowLink>
              </li>
            ))}
            {hub.relatedHubs.map((h) => (
              <li key={h}>
                <Link href={h}>{h.replace("/services/", "").replace(/-/g, " ")}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Faq id={`faq-${hub.slug}`} eyebrow="Questions" title={`${hub.h1}: common questions`} items={hub.faqs} surface />

      <ContactCTA />
    </>
  );
}

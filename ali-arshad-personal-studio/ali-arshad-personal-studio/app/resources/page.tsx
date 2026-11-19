import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { RESOURCES } from "@/lib/content/resources";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Resources: Honest Guides to Web, Automation and Sourcing",
  description:
    "Plain-English guides on web development cost, automation ROI, landed cost and more. No fluff, no gated downloads.",
  path: "/resources",
});

export default function ResourcesPage() {
  const live = RESOURCES.filter((r) => shouldRender(r.publicationState));
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ])}
      />
      <PageHero
        eyebrow="Resources"
        title="Guides worth your time"
        lead="Short, honest explainers on the questions that come up before a project starts. Written to be useful whether or not you ever get in touch."
      />
      <section className="container section">
        {live.length === 0 ? (
          <p className="measure muted">New guides are being written. Check back soon.</p>
        ) : (
          <ul className="resource-list">
            {live.map((r) => (
              <li key={r.slug}>
                <h2 className="section-title section-title--sm">
                  <ArrowLink href={`/resources/${r.slug}`}>{r.title}</ArrowLink>
                </h2>
                <p className="measure muted">{r.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ContactCTA />
    </>
  );
}

import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/content/industries";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Industries: Ecommerce, SaaS, Logistics and More",
  description:
    "The same services, framed for the sectors they fit: ecommerce brands, SaaS startups, logistics and operations, and more. Each tied to a real demonstration build.",
  path: "/industries",
});

export default function IndustriesPage() {
  const live = INDUSTRIES.filter((i) => shouldRender(i.publicationState));
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ])}
      />
      <PageHero
        eyebrow="Industries"
        title="Built for your sector"
        lead="The services are the same; what changes is the problem they solve for you. These pages frame the work for the sectors where there is real, demonstrable experience."
      />
      <section className="container section">
        <ul className="resource-list">
          {live.map((i) => (
            <li key={i.slug}>
              <h2 className="section-title section-title--sm">
                <ArrowLink href={`/industries/${i.slug}`}>{i.name}</ArrowLink>
              </h2>
              <p className="measure muted">{i.description}</p>
            </li>
          ))}
        </ul>
      </section>
      <ContactCTA />
    </>
  );
}

import type { Metadata } from "next";
import { Capabilities } from "@/components/sections/Capabilities";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Hero } from "@/components/sections/Hero";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { StudioStory } from "@/components/sections/StudioStory";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { personSchema, webSiteSchema } from "@/lib/structured-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name}: ${SITE.role} | ${SITE.descriptor}`,
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={personSchema()} />
      <JsonLd data={webSiteSchema()} />
      {/* Hero → Services → Selected work → Capabilities → About → Start a project.
          Credentials, certifications and process detail live on their own pages
          (/experience, /about, /services) rather than crowding the homepage. */}
      <Hero />
      <ServiceShowcaseHome />
      <FeaturedWork />
      <Capabilities />
      <StudioStory />
      <ContactCTA
        standalone
        signature
        eyebrow="Start here"
        title="Have something worth building?"
        text="From your first idea to a working digital product, creative campaign, or automated business process, let's discuss what you need."
        button="Start a Project"
        secondaryHref="/work"
        secondaryLabel="Explore Work"
      />
    </>
  );
}

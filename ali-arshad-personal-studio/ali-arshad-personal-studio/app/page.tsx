import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { FreelanceConnect } from "@/components/sections/FreelanceConnect";
import { Hero } from "@/components/sections/Hero";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { WhyWorkWithMe } from "@/components/sections/WhyWorkWithMe";
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
      {/* Streamlined conversion architecture:
          1. Hero → 2. Services → 3. Selected Work (7 priority builds) →
          4. Why Work With Me → 5. Freelance & Social Connect → 6. Final CTA. */}
      <Hero />
      <ServiceShowcaseHome />
      <FeaturedWork />
      <WhyWorkWithMe />
      <FreelanceConnect />
      <ContactCTA
        standalone
        signature
        eyebrow="Start a conversation"
        title="Have an idea worth building?"
        text="Let's turn your next idea into something functional, effective and beautifully executed."
        button="Let's Discuss Your Project"
        secondaryHref="/tools"
        secondaryLabel="Open Calculator Centre"
      />
    </>
  );
}

import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { CredentialsPreview } from "@/components/sections/CredentialsPreview";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Hero } from "@/components/sections/Hero";
import { HowIWork } from "@/components/sections/HowIWork";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { StudioStory } from "@/components/sections/StudioStory";
import { pageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import { SITE, activeSocials } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name} — ${SITE.role} | ${SITE.descriptor}`,
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  const sameAs = activeSocials().map((s) => s.url);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.name,
    jobTitle: SITE.role,
    description: SITE.description,
    ...(SITE.url ? { url: SITE.url } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    knowsAbout: SERVICES.map((s) => s.title),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Who I am → What I do → What I've built → Why trust me → How to work with me */}
      <Hero />
      <ServiceShowcaseHome />
      <FeaturedWork />
      <StudioStory />
      <CredentialsPreview />
      <HowIWork />
      <ContactCTA
        standalone
        eyebrow="Start here"
        title="Have something worth building?"
        text="From your first idea to a working digital product, creative campaign, or automated business process — let's discuss what you need."
        button="Start a project"
        secondaryHref="/services"
        secondaryLabel="View services"
      />
    </>
  );
}

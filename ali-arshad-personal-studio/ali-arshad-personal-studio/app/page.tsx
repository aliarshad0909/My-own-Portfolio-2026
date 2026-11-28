import type { Metadata } from "next";
import { CredentialsPreview } from "@/components/sections/CredentialsPreview";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { FreelanceConnect } from "@/components/sections/FreelanceConnect";
import { Hero } from "@/components/sections/Hero";
import { LiveProductDemos } from "@/components/sections/LiveProductDemos";
import { MeetAliTeaser } from "@/components/sections/MeetAliTeaser";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { StudioNetworkIntro } from "@/components/sections/StudioNetworkIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { isIndexable } from "@/lib/seo/publication";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { personSchema, professionalServiceSchema, webSiteSchema } from "@/lib/structured-data";
import { SITE } from "@/lib/site";

const PUBLISHED_OFFERS = SERVICE_HUBS.filter((h) => isIndexable(h.publicationState)).map((h) => ({
  name: h.h1,
  path: `/services/${h.slug}`,
}));

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name}: Custom Web Apps, AI Automation & Creative Studio`,
  description:
    "Independent creative and technical studio helping US and international businesses build custom Next.js web applications, AI automation workflows, and brand visuals — with live SaaS demos you can test directly.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={personSchema()} />
      <JsonLd data={professionalServiceSchema(PUBLISHED_OFFERS)} />
      <JsonLd data={webSiteSchema()} />
      {/* Focused client conversion flow:
          1. Hero → 2. Meet Ali Intro Teaser → 3. Core Services → 4. Selected Work →
          5. Studio Network → 6. Live Product Demonstrations → 7. Credentials → 8. Direct / Upwork Contact. */}
      <Hero />
      <MeetAliTeaser />
      <ServiceShowcaseHome />
      <FeaturedWork />
      <StudioNetworkIntro />
      <LiveProductDemos />
      <CredentialsPreview />
      <FreelanceConnect />
    </>
  );
}

import type { Metadata } from "next";
import { CredentialsPreview } from "@/components/sections/CredentialsPreview";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { FreelanceConnect } from "@/components/sections/FreelanceConnect";
import { Hero } from "@/components/sections/Hero";
import { LiveProductDemos } from "@/components/sections/LiveProductDemos";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { StudioNetworkIntro } from "@/components/sections/StudioNetworkIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { personSchema, webSiteSchema } from "@/lib/structured-data";
import { SITE } from "@/lib/site";

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
      <JsonLd data={webSiteSchema()} />
      {/* Focused client conversion flow:
          1. Hero → 2. Core Services → 3. Selected Work → 4. Studio Network →
          5. Live Product Demonstrations → 6. Credentials → 7. Direct / Upwork Contact. */}
      <Hero />
      <ServiceShowcaseHome />
      <FeaturedWork />
      <StudioNetworkIntro />
      <LiveProductDemos />
      <CredentialsPreview />
      <FreelanceConnect />
    </>
  );
}

import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { FreelanceConnect } from "@/components/sections/FreelanceConnect";
import { Hero } from "@/components/sections/Hero";
import { LiveProductDemos } from "@/components/sections/LiveProductDemos";
import { ServiceShowcaseHome } from "@/components/sections/ServiceShowcaseHome";
import { StudioNetworkIntro } from "@/components/sections/StudioNetworkIntro";
import { WhyWorkWithMe } from "@/components/sections/WhyWorkWithMe";
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
          1. Hero → 2. Core Services → 3. Live Product Demonstrations (PipelineOS & StockFlow) →
          4. Selected Work (4 projects) → 5. Why Work With Me → 6. Studio Network Intro →
          7. Direct / Upwork Connect → 8. Final Contact CTA. */}
      <Hero />
      <ServiceShowcaseHome />
      <LiveProductDemos />
      <FeaturedWork />
      <WhyWorkWithMe />
      <StudioNetworkIntro />
      <FreelanceConnect />
      <ContactCTA
        standalone
        signature
        eyebrow="Start a conversation"
        title="Have a software, automation, or creative project in mind?"
        text="Share what you are trying to build and what is in the way. You will get a direct, plain-language reply on fit, scope, and next steps."
        button="Let's Discuss Your Project"
        secondaryHref="/tools"
        secondaryLabel="Estimate Scope & ROI"
      />
    </>
  );
}

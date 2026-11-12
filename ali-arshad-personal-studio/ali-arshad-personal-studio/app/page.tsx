import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { StudioDashboard } from "@/components/sections/StudioDashboard";
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
      <Hero />
      <SelectedWork />
      <StudioDashboard />
      <StudioStory />
    </>
  );
}

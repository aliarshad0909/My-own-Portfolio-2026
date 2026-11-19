import type { ReactNode } from "react";
import Image from "next/image";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { siteBaseUrl } from "@/lib/site";
import type { ToolDef } from "@/lib/tools/catalog";

function webAppSchema(tool: ToolDef) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.h1,
    description: tool.lead,
    url: new URL(`/tools/${tool.slug}`, siteBaseUrl()).toString(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function ToolPageShell({ tool, children }: { tool: ToolDef; children: ReactNode }) {
  return (
    <>
      <JsonLd data={webAppSchema(tool)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.h1, path: `/tools/${tool.slug}` },
        ]}
      />
      <PageHero
        eyebrow="Interactive tool"
        title={tool.h1}
        lead={tool.lead}
        aside={
          tool.heroVisual ? (
            <div className="hub-hero-card">
              <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
                <Image
                  src={tool.heroVisual.src}
                  alt={tool.heroVisual.alt}
                  width={tool.heroVisual.width}
                  height={tool.heroVisual.height}
                  priority
                  sizes="(min-width: 1024px) 520px, 92vw"
                />
              </div>
              <div className="hub-hero-card__caption">
                <span>{tool.heroVisual.caption}</span>
              </div>
            </div>
          ) : undefined
        }
      />

      <section className="container section">{children}</section>

      <section className="container section--tight">
        <p className="fine-print measure">{tool.caveat}</p>
        <ul className="hub-links">
          <li>
            <ArrowLink href={tool.relatedHub}>Explore the related service</ArrowLink>
          </li>
          <li>
            <ArrowLink href={tool.relatedResource}>Read the background guide</ArrowLink>
          </li>
        </ul>
      </section>

      <ContactCTA
        standalone
        eyebrow="Turn estimates into a real plan"
        title="Ready for a grounded written scope?"
        text="Share your figures and requirements. I will follow up with an honest read on trade-offs, phasing and realistic cost."
        button="Start a conversation"
      />
    </>
  );
}

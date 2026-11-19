import type { ReactNode } from "react";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { siteBaseUrl } from "@/lib/site";
import type { ToolDef } from "@/lib/tools/catalog";

function webAppSchema(tool: ToolDef) {
  // A browser tool with no price: WebApplication is the honest type.
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
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.h1, path: `/tools/${tool.slug}` },
        ])}
      />
      <PageHero eyebrow="Tool" title={tool.h1} lead={tool.lead} />

      <section className="container section">{children}</section>

      <section className="container section--tight">
        <p className="fine-print measure">{tool.caveat}</p>
        <ul className="hub-links">
          <li>
            <ArrowLink href={tool.relatedHub}>See the related service</ArrowLink>
          </li>
          <li>
            <ArrowLink href={tool.relatedResource}>Read the background guide</ArrowLink>
          </li>
        </ul>
      </section>

      <ContactCTA />
    </>
  );
}

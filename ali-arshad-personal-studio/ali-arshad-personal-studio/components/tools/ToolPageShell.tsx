import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { siteBaseUrl } from "@/lib/site";
import { TOOLS, type ToolDef } from "@/lib/tools/catalog";

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
  const otherTools = TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <>
      <JsonLd data={webAppSchema(tool)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Calculator Centre", path: "/tools" },
          { name: tool.h1, path: `/tools/${tool.slug}` },
        ]}
      />
      <PageHero
        eyebrow={`Calculator Centre · ${tool.category}`}
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

      <section className="container section section--tight-top">{children}</section>

      <section className="container section--tight" aria-labelledby="tool-method-title">
        <div className="calc-explain">
          <div className="calc-explain__main">
            <h2 className="section-title section-title--sm" id="tool-method-title">
              How this calculation works
            </h2>
            <ul className="check-list calc-explain__list">
              {tool.howItWorks.map((point) => (
                <li key={point}>
                  <Icon name="check" size={16} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="notice calc-explain__caveat">
              <Icon name="alert" size={16} />
              <span>{tool.caveat}</span>
            </p>
          </div>

          <aside className="calc-explain__aside">
            <p className="label">Related studio guides</p>
            <ul className="hub-links">
              <li>
                <ArrowLink href={tool.relatedHub}>Explore the related service</ArrowLink>
              </li>
              <li>
                <ArrowLink href={tool.relatedResource}>Read the background guide</ArrowLink>
              </li>
            </ul>

            <p className="label label--spaced">More calculators</p>
            <ul className="calc-more-links">
              {otherTools.map((other) => (
                <li key={other.slug}>
                  <Link href={`/tools/${other.slug}`}>
                    <Icon name={other.icon} size={15} />
                    <span>{other.h1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Turn estimates into a real plan"
        title="Ready for a grounded written scope?"
        text="Share your figures and requirements. I will follow up with an honest read on trade-offs, phasing and realistic cost."
        button="Start a Project"
        secondaryHref="/tools"
        secondaryLabel="All Calculators"
      />
    </>
  );
}

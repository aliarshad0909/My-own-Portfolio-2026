import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { INDUSTRIES } from "@/lib/content/industries";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Industries: Ecommerce, SaaS Startups & Logistics Operations",
  description:
    "Web engineering, AI automation, operational dashboards and sourcing tooling framed for ecommerce brands, SaaS startups and logistics teams — each backed by working demos.",
  path: "/industries",
});

export default function IndustriesPage() {
  const live = INDUSTRIES.filter((i) => shouldRender(i.publicationState));
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ]}
      />
      <PageHero
        eyebrow="Industries"
        title="Built around how your sector operates"
        lead="The underlying engineering, design and automation disciplines stay the same — what changes are the bottlenecks they remove. Each published sector below is backed by working demonstration software."
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/site-visuals/industries/sector-systems-overview.svg"
                alt="Overview schematic mapping studio web engineering, automation and sourcing systems to Ecommerce, SaaS Startups and Logistics Operations"
                width={1200}
                height={720}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Evidence-gated sector coverage — backed by working demos</span>
            </div>
          </div>
        }
      />
      <section className="container section">
        <ul className="hub-card-grid">
          {live.map((i) => (
            <li key={i.slug}>
              <Link href={`/industries/${i.slug}`} className="hub-link-card">
                <span className="hub-link-card__kind">Sector focus</span>
                <span className="hub-link-card__title">
                  <span>{i.name}</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">{i.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ContactCTA
        standalone
        eyebrow="Outside these sectors?"
        title="Working in another industry?"
        text="Tell me what your team builds or sells. Most web, automation and dashboard fundamentals transfer cleanly once we map your actual workflow."
        button="Discuss your project"
      />
    </>
  );
}

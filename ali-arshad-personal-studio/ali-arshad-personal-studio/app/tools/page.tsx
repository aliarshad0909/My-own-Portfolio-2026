import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";
import { TOOLS, toolState } from "@/lib/tools/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Free Tools: Project Estimator, Automation ROI & Landed Cost",
  description:
    "Three free, browser-based planning calculators: a web project cost estimator, an automation ROI calculator and a landed cost calculator. No sign-up required.",
  path: "/tools",
});

export default function ToolsPage() {
  const tools = TOOLS.filter((t) => shouldRender(toolState(t)));
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ]}
      />
      <PageHero
        eyebrow="Tools"
        title="Free, honest planning calculators"
        lead="Interactive calculators that run entirely in your browser. No sign-up, no email gate and no false precision — just clear numbers to sanity-check a project before starting."
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/site-visuals/tools/planning-tools-overview.svg"
                alt="Overview schematic of three browser-based planning calculators: Web Project Estimator, Automation ROI Calculator and Landed Cost Model"
                width={1200}
                height={720}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Three unit-tested planning tools — zero email walls</span>
            </div>
          </div>
        }
      />
      <section className="container section">
        <ul className="hub-card-grid">
          {tools.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}`} className="hub-link-card">
                <span className="hub-link-card__kind">Free calculator</span>
                <span className="hub-link-card__title">
                  <span>{t.h1}</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">{t.lead}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ContactCTA
        standalone
        eyebrow="Next step"
        title="Want to pressure-test your numbers with a real scope?"
        text="Send your project context and I will walk you through realistic phasing and trade-offs."
        button="Discuss your project"
        secondaryHref="/resources"
        secondaryLabel="Read the guides"
      />
    </>
  );
}

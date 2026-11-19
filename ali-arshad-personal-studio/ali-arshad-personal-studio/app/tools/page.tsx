import type { Metadata } from "next";
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

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
  title: "Calculator Centre: 12 Business & Sourcing Tools",
  description:
    "Twelve free browser calculators for landed cost, supplier comparison, MOQ & CBM, shipping weight, live USD/CNY FX, GPU scope, SaaS TCO, and automation ROI.",
  path: "/tools",
});

export default function ToolsPage() {
  const tools = TOOLS.filter((t) => shouldRender(toolState(t)));

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Calculator Centre", path: "/tools" },
        ]}
      />
      <PageHero
        eyebrow="Calculator Centre"
        title="Practical tools for smarter business decisions."
        lead="Calculate costs, understand profitability, estimate projects and discover the potential value of automation — free, fast and transparent with zero email gates."
      />

      <section className="container section section--tight-top" aria-label="Available calculators">
        <ul className="tools-hub-grid">
          {tools.map((t, index) => (
            <li key={t.slug} className="tool-card reveal">
              <Link href={`/tools/${t.slug}`} className="tool-card__link">
                <div className="tool-card__head">
                  <span className="tool-card__icon" aria-hidden="true">
                    <Icon name={t.icon} size={22} />
                  </span>
                  <span className="tool-card__cat">{t.category}</span>
                  <span className="tool-card__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h2 className="tool-card__title">{t.h1}</h2>
                <p className="tool-card__lead">{t.lead}</p>
                <p className="tool-card__meta">{t.previewHighlight}</p>

                <span className="tool-card__cta">
                  <span>Open calculator</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="fine-print tools-hub-note">
          Every calculator runs on unit-tested domain logic with visible formulas and transparent caveats. Live currency rates are proxied and cached
          server-side with instant manual-rate fallback when needed.
        </p>
      </section>

      <ContactCTA
        standalone
        eyebrow="Turn numbers into action"
        title="Want to review your figures on a real project scope?"
        text="Share your goals, operational numbers or requirements and I will reply with honest phasing, realistic costs and clear next steps."
        button="Let's Discuss Your Project"
        secondaryHref="/services"
        secondaryLabel="Explore Services"
      />
    </>
  );
}

import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { TOOLS, toolState } from "@/lib/tools/catalog";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Free Tools: Project Estimator, Automation ROI, Landed Cost",
  description:
    "Three free, functional calculators: a web project cost estimator, an automation ROI calculator and a landed cost calculator. Honest planning figures, no sign-up.",
  path: "/tools",
});

export default function ToolsPage() {
  const tools = TOOLS.filter((t) => shouldRender(toolState(t)));
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ])}
      />
      <PageHero
        eyebrow="Tools"
        title="Free, honest calculators"
        lead="Quick planning tools that run entirely in your browser. No sign-up, no email wall, no false precision — just a useful starting point."
      />
      <section className="container section">
        <ul className="hub-links">
          {tools.map((t) => (
            <li key={t.slug}>
              <ArrowLink href={`/tools/${t.slug}`}>{t.h1}</ArrowLink>
              <span className="muted"> — {t.lead}</span>
            </li>
          ))}
        </ul>
      </section>
      <ContactCTA />
    </>
  );
}

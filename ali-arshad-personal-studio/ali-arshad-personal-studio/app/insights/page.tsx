import type { Metadata } from "next";
import Link from "next/link";
import { UpdatesSignup } from "@/components/forms/UpdatesSignup";
import { InsightsBrowser } from "@/components/insights/InsightsBrowser";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { publishedInsights } from "@/lib/content/insights";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";
import { isUpdatesConfigured } from "@/lib/updates-server";

export const metadata: Metadata = pageMetadata({
  title: "Insights — Build Notes, AI Automation & Engineering Guides",
  description:
    "Original project build notes, architectural perspectives, and sourced engineering guides from Ali Arshad Personal Studio on Next.js, PostgreSQL, AI agents, n8n, and motion.",
  path: "/insights",
});

export default function InsightsPage() {
  const posts = publishedInsights();
  const updatesConfigured = isUpdatesConfigured();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
        ]}
      />
      <PageHero
        eyebrow="Studio Insights & Build Notes"
        title="Practical writing from real builds — not AI filler"
        lead="Every post is labeled clearly as Project Notes, Original Opinion, or Sourced Guide, with dates and primary documentation links for technical claims."
      />

      <section className="section section--tight" aria-label="Insights archive">
        <div className="container">
          <InsightsBrowser posts={posts} />
          <p className="fine-print" style={{ marginTop: "22px" }}>
            Looking for interactive planning tools or longer reference playbooks? Explore the{" "}
            <Link href="/resources">Resources library</Link> and <Link href="/tools">Business Calculators</Link>.
          </p>
        </div>
      </section>

      <UpdatesSignup configured={updatesConfigured} />

      <ContactCTA
        standalone
        eyebrow="Apply this to your stack"
        title="Want to talk through an automation, web app, or creative project?"
        text="Share what you are building and get a direct, grounded reply on architecture, scope, and trade-offs."
        button="Start a Project"
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { RESOURCES, RESOURCE_CATEGORIES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/seo";
import { shouldRender } from "@/lib/seo/publication";

export const metadata: Metadata = pageMetadata({
  title: "Resources: Guides on n8n, AI Agents, Next.js, Ecommerce & Sourcing",
  description:
    "Plain-English guides, comparisons and checklists covering n8n automation, AI agents, Next.js SEO, custom web costs, brand systems and landed-cost sourcing.",
  path: "/resources",
});

export default function ResourcesPage() {
  const live = RESOURCES.filter((r) => shouldRender(r.publicationState));

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ]}
      />
      <PageHero
        eyebrow="Resources"
        title="Guides, comparisons and checklists worth reading"
        lead="Concise, grounded explainers on the technical and commercial decisions that come up before a project starts — no email walls, no fluff."
      />

      {live.length === 0 ? (
        <section className="container section">
          <p className="measure muted">New guides are being written. Check back soon.</p>
        </section>
      ) : (
        RESOURCE_CATEGORIES.map((category, idx) => {
          const items = live.filter((r) => r.category === category);
          if (items.length === 0) return null;
          return (
            <section
              key={category}
              className={`section section--tight ${idx % 2 === 1 ? "section--surface" : ""}`.trim()}
              aria-labelledby={`cat-${idx}`}
            >
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow eyebrow--plain">{category}</p>
                  <h2 className="section-title section-title--sm" id={`cat-${idx}`}>
                    {items.length} {items.length === 1 ? "guide" : "guides"}
                  </h2>
                </div>
                <ul className="hub-card-grid">
                  {items.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/resources/${r.slug}`} className="hub-link-card">
                        <span className="hub-link-card__kind">{r.readMinutes} min read</span>
                        <span className="hub-link-card__title">
                          <span>{r.title}</span>
                          <Icon name="arrow-up-right" size={16} />
                        </span>
                        <span className="hub-link-card__desc">{r.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })
      )}

      <ContactCTA
        standalone
        eyebrow="Need a straight answer?"
        title="Have a specific project question not covered here?"
        text="Send a short note about what you are weighing — platform choice, automation payback or build scope — and I will reply with an honest read."
        button="Ask a question"
        secondaryHref="/tools"
        secondaryLabel="Try free calculators"
      />
    </>
  );
}

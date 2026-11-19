import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServiceDemoShowcase } from "@/components/services/ServiceDemoShowcase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { INDUSTRIES, getIndustry } from "@/lib/content/industries";
import { getProject, type Project } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { getHub } from "@/lib/seo/service-hubs";
import { singleServiceSchema } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return INDUSTRIES.filter((i) => shouldRender(i.publicationState)).map((i) => ({ slug: i.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const i = getIndustry(slug);
  if (!i) return {};
  return pageMetadata({
    title: i.title,
    description: i.description,
    path: `/industries/${i.slug}`,
    index: isIndexable(i.publicationState),
  });
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry || !shouldRender(industry.publicationState)) notFound();

  const projects = industry.projectSlugs
    .map((s) => getProject(s))
    .filter((p): p is Project => p !== undefined);
  const relatedHubSlug = industry.relatedHub.replace("/services/", "");
  const relatedHub = getHub(relatedHubSlug);

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: industry.title,
          description: industry.description,
          path: `/industries/${industry.slug}`,
          serviceType: industry.name,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: industry.name, path: `/industries/${industry.slug}` },
        ]}
      />
      <PageHero eyebrow="Industry" title={industry.title} lead={industry.lead}>
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss a project</ButtonLink>
          {relatedHub ? (
            <ButtonLink href={`/services/${relatedHub.slug}`} variant="secondary" icon={null}>
              Explore {relatedHub.h1.toLowerCase()}
            </ButtonLink>
          ) : null}
        </div>
      </PageHero>

      {!isIndexable(industry.publicationState) ? (
        <EditorNote>
          This {industry.name} page is {industry.publicationState}: preview-only
          and noindex until it has unique copy (and, where the sector implies
          it, a real client) and is set to Published.
        </EditorNote>
      ) : null}

      <section className="section" aria-labelledby="ind-problems">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Sector friction</p>
            <h2 className="section-title section-title--sm" id="ind-problems">
              What {industry.name.toLowerCase()} typically bring to the table
            </h2>
          </div>
          <ul className="hub-problems">
            {industry.problems.map((p) => (
              <li key={p}>&ldquo;{p}&rdquo;</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="ind-helps">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Capabilities</p>
            <h2 className="section-title section-title--sm" id="ind-helps">
              How this studio supports {industry.name.toLowerCase()}
            </h2>
          </div>
          <ul className="hub-list">
            {industry.helps.map((h) => (
              <li key={h}>
                <Icon name="check" size={18} /> <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="section" aria-label="Sector demonstrations">
          <div className="container">
            <ServiceDemoShowcase
              projects={projects}
              eyebrow="Supporting evidence"
              title="Demonstration builds for this sector"
              lead="Working software built under fictional brands and tested end to end to demonstrate relevant architecture."
            />
          </div>
        </section>
      ) : null}

      {relatedHub ? (
        <section className="section section--tight section--surface" aria-labelledby="ind-related">
          <div className="container">
            <h2 className="section-title section-title--sm" id="ind-related">
              Primary service hub
            </h2>
            <ul className="hub-card-grid">
              <li>
                <Link href={`/services/${relatedHub.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">Service hub</span>
                  <span className="hub-link-card__title">
                    <span>{relatedHub.h1}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{relatedHub.lead}</span>
                </Link>
              </li>
              <li>
                <Link href="/services/n8n-automation" className="hub-link-card">
                  <span className="hub-link-card__kind">Automation</span>
                  <span className="hub-link-card__title">
                    <span>n8n workflow automation</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">
                    Connect CRMs, Google Workspace, reporting and exception alerts across your stack.
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </section>
      ) : null}

      <ContactCTA
        standalone
        eyebrow={industry.name}
        title={`Building for ${industry.name.toLowerCase()}?`}
        text="Share your current bottleneck and goals. I will reply with an honest read on scope and the cleanest starting point."
        button="Start a conversation"
      />
    </>
  );
}

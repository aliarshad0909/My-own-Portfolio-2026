import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema, singleServiceSchema } from "@/lib/structured-data";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { INDUSTRIES, getIndustry } from "@/lib/content/industries";
import { isIndexable, shouldRender } from "@/lib/seo/publication";

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
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: industry.name, path: `/industries/${industry.slug}` },
        ])}
      />
      <PageHero eyebrow="Industry" title={industry.title} lead={industry.lead} />

      {!isIndexable(industry.publicationState) ? (
        <EditorNote>
          This {industry.name} page is {industry.publicationState}: preview-only
          and noindex until it has unique copy (and, where the sector implies
          it, a real client) and is set to Published.
        </EditorNote>
      ) : null}

      <section className="container section">
        <h2 className="section-title">What we hear</h2>
        <ul className="hub-problems">
          {industry.problems.map((p) => (
            <li key={p}>&ldquo;{p}&rdquo;</li>
          ))}
        </ul>
      </section>

      <section className="container section--tight">
        <h2 className="section-title">How this studio helps</h2>
        <ul className="hub-list">
          {industry.helps.map((h) => (
            <li key={h}>
              <Icon name="check" size={18} /> <span>{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {industry.projectSlugs.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Evidence</h2>
          <ul className="hub-links">
            {industry.projectSlugs.map((s) => {
              const pr = getProject(s);
              return pr ? (
                <li key={s}>
                  <ArrowLink href={`/work/${pr.slug}`}>{pr.title}</ArrowLink>
                </li>
              ) : null;
            })}
            <li>
              <ArrowLink href={industry.relatedHub}>See the related service</ArrowLink>
            </li>
          </ul>
        </section>
      ) : null}

      <ContactCTA />
    </>
  );
}

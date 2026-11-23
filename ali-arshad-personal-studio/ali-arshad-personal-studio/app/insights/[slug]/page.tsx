import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightCoverArt } from "@/components/insights/InsightCoverArt";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { getInsight, publishedInsights } from "@/lib/content/insights";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { SITE, siteBaseUrl } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedInsights().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post || post.status !== "Published") return {};
  return pageMetadata({
    title: post.title,
    description: post.seoDescription,
    path: `/insights/${post.slug}`,
  });
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post || post.status !== "Published") notFound();

  const abs = (p: string) => new URL(p, siteBaseUrl()).toString();
  const relatedProjects = post.relatedProjectSlugs
    .map((s) => getProject(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const relatedPosts = post.relatedInsightSlugs
    .map((s) => getInsight(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined && p.status === "Published");

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author, url: abs("/") },
    publisher: { "@type": "Person", name: SITE.name, url: abs("/") },
    mainEntityOfPage: abs(`/insights/${post.slug}`),
    articleSection: post.category,
    keywords: post.tags.join(", "),
    inLanguage: "en",
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: post.title, path: `/insights/${post.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: post.title, path: `/insights/${post.slug}` },
        ]}
      />

      <article className="detail">
        <header className="page-hero">
          <div className="container enter" style={{ maxWidth: "82ch" }}>
            <Link href="/insights" className="back-link">
              <Icon name="arrow-right" size={16} className="flip" />
              <span>All insights</span>
            </Link>
            <div className="detail__meta">
              <span className="badge badge--type">{post.kind}</span>
              <span className="eyebrow eyebrow--plain">{post.category}</span>
            </div>
            <h1 className="page-title">{post.title}</h1>
            <p className="lead">{post.excerpt}</p>
            <p className="fine-print" style={{ marginTop: "14px" }}>
              By <strong>{post.author}</strong> · Published {post.publishedAt}
              {post.updatedAt !== post.publishedAt ? ` · Updated ${post.updatedAt}` : ""} · {post.readingMinutes} min read
            </p>
          </div>
        </header>

        <div className="container" style={{ maxWidth: "82ch" }}>
          <div className="detail__cover" style={{ marginBottom: "28px" }}>
            <InsightCoverArt variant={post.coverVariant} title={post.title} />
          </div>

          <div className="prose">
            {post.sections.map((sec) => (
              <section key={sec.heading} style={{ marginBottom: "28px" }}>
                <h2 className="section-title section-title--sm">{sec.heading}</h2>
                {sec.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {sec.bullets && sec.bullets.length > 0 ? (
                  <ul className="check-list check-list--spaced">
                    {sec.bullets.map((b) => (
                      <li key={b}>
                        <Icon name="check" size={16} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {post.sources.length > 0 ? (
              <section className="panel" aria-labelledby="sources-title" style={{ marginTop: "32px" }}>
                <h2 className="card-title" id="sources-title">
                  Sources &amp; verification dates
                </h2>
                <ul className="sources-list">
                  {post.sources.map((src) => (
                    <li key={src.url}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                        {src.label}
                      </a>{" "}
                      <span>
                        — {src.publisher} (checked {src.checkedDate})
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="insight-relations">
              <div className="panel">
                <p className="eyebrow eyebrow--plain">Related service</p>
                <p style={{ marginTop: "8px" }}>
                  <Link href={post.relatedServiceHref} className="arrow-link">
                    <span>{post.relatedServiceLabel}</span>
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </p>
              </div>

              {relatedProjects.length > 0 ? (
                <div className="panel">
                  <p className="eyebrow eyebrow--plain">Related case studies</p>
                  <ul className="sources-list" style={{ marginTop: "8px" }}>
                    {relatedProjects.map((proj) => (
                      <li key={proj.slug}>
                        <Link href={`/case-studies/${proj.slug}`}>{proj.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {relatedPosts.length > 0 ? (
              <section style={{ marginTop: "32px" }} aria-labelledby="more-insights-title">
                <h2 className="section-title section-title--sm" id="more-insights-title">
                  Related insights
                </h2>
                <ul className="sources-list">
                  {relatedPosts.map((rp) => (
                    <li key={rp.slug}>
                      <Link href={`/insights/${rp.slug}`}>{rp.title}</Link> <span>({rp.kind})</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </article>

      <ContactCTA
        standalone
        eyebrow="Next step"
        title="Working on a similar architecture or workflow?"
        text="Tell me what you are trying to ship and I will reply with direct thoughts on scope and implementation."
        button="Discuss Your Project"
      />
    </>
  );
}

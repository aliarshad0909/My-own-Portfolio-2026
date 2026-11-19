import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { EditorNote } from "@/components/ui/EditorNote";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
import { SITE, siteBaseUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { RESOURCES, getResource } from "@/lib/content/resources";
import { isIndexable, shouldRender } from "@/lib/seo/publication";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RESOURCES.filter((r) => shouldRender(r.publicationState)).map((r) => ({ slug: r.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getResource(slug);
  if (!r) return {};
  return pageMetadata({
    title: r.title,
    description: r.description,
    path: `/resources/${r.slug}`,
    index: isIndexable(r.publicationState),
  });
}

function articleSchema(slug: string, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Person", name: SITE.name, url: new URL("/", siteBaseUrl()).toString() },
    publisher: { "@type": "Person", name: SITE.name },
    mainEntityOfPage: new URL(`/resources/${slug}`, siteBaseUrl()).toString(),
    inLanguage: "en",
  };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const r = getResource(slug);
  if (!r || !shouldRender(r.publicationState)) notFound();

  return (
    <>
      <JsonLd data={articleSchema(r.slug, r.title, r.description)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: r.title, path: `/resources/${r.slug}` },
        ])}
      />
      <PageHero eyebrow="Guide" title={r.title} lead={r.lead} />

      {!isIndexable(r.publicationState) ? (
        <EditorNote>
          This guide is {r.publicationState}: preview-only and noindex until it
          is fully written and set to Published.
        </EditorNote>
      ) : null}

      <article className="container section article-body">
        {r.body.map((block, i) => {
          if (block.type === "h2") return <h2 key={i} className="section-title section-title--sm">{block.text}</h2>;
          if (block.type === "ul")
            return (
              <ul key={i} className="article-list">
                {block.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          return <p key={i} className="measure">{block.text}</p>;
        })}

        {r.related.length > 0 ? (
          <p className="measure article-related">
            Related:{" "}
            {r.related.map((href, i) => (
              <span key={href}>
                {i > 0 ? " · " : ""}
                <Link href={href}>{href.replace(/^\/(services|tools)\//, "").replace(/-/g, " ")}</Link>
              </span>
            ))}
          </p>
        ) : null}
      </article>

      <ContactCTA />
    </>
  );
}

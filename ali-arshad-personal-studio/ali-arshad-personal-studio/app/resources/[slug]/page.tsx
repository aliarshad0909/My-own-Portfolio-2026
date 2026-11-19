import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { RESOURCES, getResource } from "@/lib/content/resources";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { getHub, getSpoke } from "@/lib/seo/service-hubs";
import { SITE, siteBaseUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools/catalog";

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

function resolveRelated(href: string): { kind: string; title: string; description: string } {
  if (href.startsWith("/tools/")) {
    const tool = TOOLS.find((t) => `/tools/${t.slug}` === href);
    if (tool) return { kind: "Tool", title: tool.h1, description: tool.lead };
  }
  if (href.startsWith("/resources/")) {
    const res = getResource(href.slice("/resources/".length));
    if (res) return { kind: "Guide", title: res.title, description: res.description };
  }
  if (href.startsWith("/work/")) {
    const proj = getProject(href.slice("/work/".length));
    if (proj) return { kind: "Demonstration", title: proj.title, description: proj.summary };
  }
  if (href.startsWith("/services/")) {
    const parts = href.slice("/services/".length).split("/");
    if (parts.length === 2) {
      const sp = getSpoke(parts[0], parts[1]);
      if (sp) return { kind: "Specialization", title: sp.h1, description: sp.lead };
    }
    const hub = getHub(parts[0]);
    if (hub) return { kind: "Service", title: hub.h1, description: hub.lead };
  }
  if (href === "/services") return { kind: "Services", title: "All Studio Services", description: "Six connected creative, engineering and automation service areas." };
  if (href === "/studio-network") return { kind: "Studio Network", title: "The Studio Network", description: "How specialist partner capabilities are coordinated transparently." };
  if (href === "/contact") return { kind: "Contact", title: "Start a Conversation", description: "Discuss scope, timelines and options directly with Ali." };
  return { kind: "Related", title: href.replace(/^\//, "").replace(/-/g, " "), description: "" };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const r = getResource(slug);
  if (!r || !shouldRender(r.publicationState)) notFound();

  const relatedCards = r.related.map((href) => ({ href, ...resolveRelated(href) }));

  return (
    <>
      <JsonLd data={articleSchema(r.slug, r.title, r.description)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: r.title, path: `/resources/${r.slug}` },
        ]}
      />
      <PageHero eyebrow={r.category} title={r.title} lead={r.lead}>
        <div className="article-meta">
          <span className="article-meta__pill">{r.readMinutes} min read</span>
          <span>Written by {SITE.name}</span>
        </div>
      </PageHero>

      {!isIndexable(r.publicationState) ? (
        <EditorNote>
          This guide is {r.publicationState}: preview-only and noindex until it
          is fully written and set to Published.
        </EditorNote>
      ) : null}

      <article className="container section article-body">
        {r.body.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2 key={i} className="section-title section-title--sm">
                {block.text}
              </h2>
            );
          }
          if (block.type === "h3") {
            return <h3 key={i}>{block.text}</h3>;
          }
          if (block.type === "ul") {
            return (
              <ul key={i} className="article-list">
                {block.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          }
          if (block.type === "ol") {
            return (
              <ol key={i} className="article-list">
                {block.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ol>
            );
          }
          if (block.type === "callout") {
            return (
              <aside key={i} className="article-callout">
                <p className="article-callout__title">{block.title}</p>
                <p>{block.text}</p>
              </aside>
            );
          }
          if (block.type === "code") {
            return (
              <pre key={i} className="article-code">
                <code>{block.text}</code>
              </pre>
            );
          }
          if (block.type === "figure") {
            const frameClass = [
              "article-figure__frame",
              block.diagram ? "article-figure__frame--diagram" : "",
              block.darkDiagram ? "article-figure__frame--dark-diagram" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <figure key={i} className="article-figure">
                <div className={frameClass}>
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={block.width}
                    height={block.height}
                    loading="lazy"
                    sizes="(min-width: 900px) 760px, 94vw"
                  />
                </div>
                <figcaption className="article-figure__caption">
                  <span>{block.caption}</span>
                  {block.href ? <Link href={block.href}>{block.linkLabel ?? "Inspect demonstration"}</Link> : null}
                </figcaption>
              </figure>
            );
          }
          if (block.type === "table") {
            return (
              <div key={i} className="decision-table-wrap" style={{ maxWidth: "58rem" }}>
                <table className="decision-table">
                  <thead>
                    <tr>
                      {block.headers.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri}>
                        <th scope="row">{row[0]}</th>
                        {row.slice(1).map((cell, ci) => (
                          <td key={ci}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return (
            <p key={i} className="measure">
              {block.text}
            </p>
          );
        })}
      </article>

      {relatedCards.length > 0 ? (
        <section className="section section--tight section--surface" aria-labelledby="resource-related">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow eyebrow--plain">Next steps</p>
              <h2 className="section-title section-title--sm" id="resource-related">
                Related services, tools and demonstrations
              </h2>
            </div>
            <ul className="hub-card-grid">
              {relatedCards.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hub-link-card">
                    <span className="hub-link-card__kind">{item.kind}</span>
                    <span className="hub-link-card__title">
                      <span>{item.title}</span>
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                    {item.description ? <span className="hub-link-card__desc">{item.description}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ContactCTA
        standalone
        eyebrow="Apply this to your project"
        title="Want an honest second opinion on your scope?"
        text="Share what you are planning to build, automate or source. I will walk you through trade-offs and realistic options."
        button="Start a conversation"
      />
    </>
  );
}

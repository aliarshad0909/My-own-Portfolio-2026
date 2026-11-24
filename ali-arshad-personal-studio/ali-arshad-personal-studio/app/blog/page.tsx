import type { Metadata } from "next";
import Link from "next/link";
import { BlogBrowser } from "@/components/blog/BlogBrowser";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { BLOG_POSTS } from "@/lib/content/blog";
import { pageMetadata } from "@/lib/seo";
import { blogListSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Studio Blog: Engineering Build Logs, AI Notes & Creative Workflows",
  description:
    "Original dispatches from Ali Arshad Personal Studio covering AI developments, TypeScript & PostgreSQL build logs, n8n workflows, WCAG design systems, browser games, and transparent client delivery.",
  path: "/blog",
});

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd data={blogListSchema(BLOG_POSTS)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />

      <PageHero
        eyebrow="Studio Journal · Build Logs & Technical Notes"
        title={
          <>
            Engineering, AI &amp; <span className="accent">studio dispatches</span>
          </>
        }
        lead="Practical build logs from real repository work, source-backed AI protocol notes, creative pipeline explainers, and interactive experiment breakdowns — written to complement our evergreen buyer guides in Resources."
      >
        <div className="hero__actions">
          <ButtonLink href={`/blog/${BLOG_POSTS[0].slug}`}>Read latest build log</ButtonLink>
          <ButtonLink href="/resources" variant="secondary" icon={null}>
            Evergreen buyer guides (/resources)
          </ButtonLink>
          <a href="/blog/rss.xml" className="btn btn--secondary btn--md">
            <span>RSS Feed</span>
          </a>
        </div>
      </PageHero>

      <section className="section" aria-labelledby="blog-articles-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Browse by topic</p>
            <h2 className="section-title" id="blog-articles-title">
              {BLOG_POSTS.length} original launch articles across 6 studio topics
            </h2>
            <p className="section-sub">
              Every build log describes only software or games that exist in this repository, and technical standard claims link directly to primary
              specifications. Looking for evergreen cost/comparison guides? Visit <Link href="/resources" className="text-link">/resources</Link>.
            </p>
          </div>

          <BlogBrowser posts={BLOG_POSTS} />
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="From writing to shipping"
        title="Want this same engineering discipline on your next build?"
        text="Share your product, automation, or brand goals for a plain-language written scope and realistic timeline."
        button="Start a Project"
      />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleSocialBar } from "@/components/blog/ArticleSocialBar";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Sources } from "@/components/seo/Sources";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import {
  BLOG_POSTS,
  allBlogSlugs,
  estimateReadingMinutes,
  getBlogPost,
  relatedBlogPostsFor,
} from "@/lib/content/blog";
import { pageMetadata } from "@/lib/seo";
import { activeSocials, siteBaseUrl } from "@/lib/site";
import { blogArticleSchema } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return allBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const readingMin = estimateReadingMinutes(post);
  const idx = BLOG_POSTS.findIndex((p) => p.slug === post.slug);
  const prevPost = BLOG_POSTS[(idx - 1 + BLOG_POSTS.length) % BLOG_POSTS.length];
  const nextPost = BLOG_POSTS[(idx + 1) % BLOG_POSTS.length];
  const morePosts = relatedBlogPostsFor(post, 3);
  const socials = activeSocials();
  const articleUrl = new URL(`/blog/${post.slug}`, siteBaseUrl()).toString();

  return (
    <>
      <JsonLd data={blogArticleSchema(post)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <PageHero
        eyebrow={`${post.category} · ${post.topicCluster} · ${readingMin} min read`}
        title={post.title}
        lead={post.excerpt}
      >
        <div className="blog-card__meta" style={{ marginTop: "14px" }}>
          <span>
            By <Link href="/about" className="text-link">{post.author}</Link>
          </span>
          <span>·</span>
          <span>
            Published <time dateTime={post.publishedAt}>{post.publishedAt}</time>
          </span>
          {post.updatedAt !== post.publishedAt ? (
            <>
              <span>·</span>
              <span>
                Updated <time dateTime={post.updatedAt}>{post.updatedAt}</time>
              </span>
            </>
          ) : null}
        </div>
      </PageHero>

      {post.editorialNote ? (
        <section className="container" aria-label="Article disclosure">
          <p className="notice notice--wide">
            <Icon name="alert" size={18} />
            <span>{post.editorialNote}</span>
          </p>
        </section>
      ) : null}

      <article className="section">
        <div className="container blog-article__inner">
          {post.visual ? (
            <figure className="article-figure blog-article__figure">
              <div
                className={`article-figure__frame ${post.visual.darkDiagram ? "article-figure__frame--dark-diagram" : ""}`.trim()}
              >
                <Image
                  src={post.visual.src}
                  alt={post.visual.alt}
                  width={post.visual.width}
                  height={post.visual.height}
                  priority
                  sizes="(min-width: 900px) 780px, 94vw"
                />
              </div>
              <figcaption className="article-figure__caption">
                <span>{post.visual.caption}</span>
              </figcaption>
            </figure>
          ) : null}

          {post.sections.map((sec) => (
            <section key={sec.heading} className="blog-article__section">
              <h2 className="section-title section-title--sm">{sec.heading}</h2>
              {sec.paragraphs.map((para, i) => (
                <p key={i} className="measure">
                  {para}
                </p>
              ))}
              {sec.bullets && sec.bullets.length > 0 ? (
                <ul className="check-list check-list--spaced" style={{ marginTop: "0.75rem" }}>
                  {sec.bullets.map((b) => (
                    <li key={b}>
                      <Icon name="check" size={16} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {sec.links && sec.links.length > 0 ? (
                <div className="blog-section-links" aria-label={`Related resources for ${sec.heading}`}>
                  {sec.links.map((lnk) =>
                    lnk.href.endsWith(".pdf") || lnk.href.endsWith(".txt") ? (
                      <a
                        key={lnk.href}
                        href={lnk.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-pill"
                      >
                        {lnk.label} ↗
                      </a>
                    ) : (
                      <Link key={lnk.href} href={lnk.href} className="location-pill">
                        {lnk.label} →
                      </Link>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          ))}

          {post.sources && post.sources.length > 0 ? <Sources items={post.sources} /> : null}

          <ArticleSocialBar articleUrl={articleUrl} articleTitle={post.title} socials={socials} />

          <div className="panel blog-article__connected">
            <p className="eyebrow eyebrow--plain">Connected studio pages &amp; tools</p>
            <ul className="hub-card-grid" style={{ marginTop: "14px" }}>
              {post.relatedLinks.map((lnk) => (
                <li key={lnk.href}>
                  {lnk.href.endsWith(".txt") || lnk.href.endsWith(".pdf") ? (
                    <a href={lnk.href} target="_blank" rel="noopener noreferrer" className="hub-link-card">
                      <span className="hub-link-card__kind">{lnk.kind}</span>
                      <span className="hub-link-card__title">
                        <span>{lnk.label}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                    </a>
                  ) : (
                    <Link href={lnk.href} className="hub-link-card">
                      <span className="hub-link-card__kind">{lnk.kind}</span>
                      <span className="hub-link-card__title">
                        <span>{lnk.label}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <nav className="case-nav" aria-label="Article navigation">
        <div className="container case-nav__inner">
          <Link href={`/blog/${prevPost.slug}`} className="case-nav__link case-nav__link--prev">
            <span className="case-nav__label">
              <Icon name="arrow-right" size={15} className="flip" />
              Previous dispatch
            </span>
            <span className="case-nav__title">{prevPost.title}</span>
          </Link>
          <Link href="/blog" className="case-nav__all">
            All {BLOG_POSTS.length} articles
          </Link>
          <Link href={`/blog/${nextPost.slug}`} className="case-nav__link case-nav__link--next">
            <span className="case-nav__label">
              Next dispatch
              <Icon name="arrow-right" size={15} />
            </span>
            <span className="case-nav__title">{nextPost.title}</span>
          </Link>
        </div>
      </nav>

      <section className="section section--surface section--tight" aria-labelledby="more-blog-title">
        <div className="container">
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow eyebrow--plain">Topic cluster · Keep reading</p>
              <h2 className="section-title section-title--sm" id="more-blog-title">
                Related studio dispatches
              </h2>
            </div>
            <Link href="/blog" className="text-link">
              All {BLOG_POSTS.length} articles →
            </Link>
          </div>
          <ul className="hub-card-grid">
            {morePosts.map((other) => (
              <li key={other.slug}>
                <Link href={`/blog/${other.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    {other.category} · {estimateReadingMinutes(other)} min read
                  </span>
                  <span className="hub-link-card__title">
                    <span>{other.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{other.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Work with Ali Arshad"
        title="Ready to scope a real build or sourcing brief?"
        text="Share what you are building, automating, or sourcing and get a direct, plain-language written reply."
      />
    </>
  );
}

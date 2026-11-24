import { BLOG_POSTS } from "@/lib/content/blog";
import { SITE, siteBaseUrl } from "@/lib/site";

export const dynamic = "force-static";

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function GET() {
  const base = siteBaseUrl().origin;
  const items = BLOG_POSTS.map((post) => {
    const url = `${base}/blog/${post.slug}`;
    const pubDate = new Date(`${post.publishedAt}T12:00:00Z`).toUTCString();
    return [
      "    <item>",
      `      <title>${xmlEscape(post.title)}</title>`,
      `      <link>${xmlEscape(url)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <category>${xmlEscape(post.category)}</category>`,
      `      <description>${xmlEscape(post.excerpt)}</description>`,
      "    </item>",
    ].join("\n");
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${SITE.name} — Personal Studio Blog`)}</title>
    <link>${xmlEscape(`${base}/blog`)}</link>
    <description>${xmlEscape("Engineering build logs, AI protocol notes, creative workflow breakdowns, and browser-game experiments from Ali Arshad Personal Studio.")}</description>
    <language>en-us</language>
    <atom:link href="${xmlEscape(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

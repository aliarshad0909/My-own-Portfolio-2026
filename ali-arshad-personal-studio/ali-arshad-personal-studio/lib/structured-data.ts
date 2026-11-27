/**
 * JSON-LD builders. Every field here must be visible on the page it describes
 * or verifiable from the credential record — no reviews, ratings, physical
 * branch addresses, employees, clients, prices or awards are asserted anywhere,
 * because none are verified.
 *
 * Entity graph IDs stay consistent across all routes:
 *   - Person:              https://www.aliarshad.co/#person
 *   - ProfessionalService: https://www.aliarshad.co/#studio
 *   - WebSite:             https://www.aliarshad.co/#website
 */
import { CREDENTIALS } from "@/lib/credentials";
import { estimateReadingMinutes, estimateWordCount, type BlogPost } from "@/lib/content/blog";
import type { GameDefinition } from "@/lib/games/catalog";
import type { StudioProduct } from "@/lib/products/catalog";
import type { Project } from "@/lib/projects";
import { SERVICES } from "@/lib/services";
import { FREELANCE, SITE, activeSocials, siteBaseUrl } from "@/lib/site";

const abs = (path: string) => new URL(path, siteBaseUrl()).toString();

const personRef = () => ({ "@id": abs("/#person") });
const studioRef = () => ({ "@id": abs("/#studio") });

function allVerifiedProfileUrls(): string[] {
  const urls = activeSocials().map((s) => s.url);
  if (FREELANCE.upwork.url) urls.push(FREELANCE.upwork.url);
  if (FREELANCE.fiverr.url) urls.push(FREELANCE.fiverr.url);
  return [...new Set(urls)];
}

export function personSchema() {
  const sameAs = allVerifiedProfileUrls();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": abs("/#person"),
    name: SITE.name,
    alternateName: `${SITE.name} — ${SITE.descriptor}`,
    jobTitle: SITE.role,
    description: SITE.description,
    url: abs("/"),
    image: abs("/opengraph-image.jpg"),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Bahria University Islamabad",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    knowsAbout: SERVICES.map((s) => s.title),
    hasCredential: CREDENTIALS.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.title,
      recognizedBy: { "@type": "Organization", name: c.issuer },
      // Only credentials with an issuer-provided public verification page get a URL.
      ...(c.verifyUrl ? { url: c.verifyUrl } : {}),
    })),
  };
}

/**
 * Honest solo-studio ProfessionalService node linked to the Person entity via
 * @id. Remote-only delivery (US & international); zero physical address, zero
 * fabricated prices, zero fake ratings or client claims.
 */
export function professionalServiceSchema(offerItems?: { name: string; path: string }[]) {
  const sameAs = allVerifiedProfileUrls();
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": abs("/#studio"),
    name: `${SITE.name} — ${SITE.descriptor}`,
    description: SITE.description,
    url: abs("/"),
    image: abs("/opengraph-image.jpg"),
    founder: personRef(),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: [{ "@type": "Country", name: "United States" }, "International (Remote)"],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: abs("/contact"),
      availableLanguage: "English",
    },
    ...(offerItems && offerItems.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Studio Services",
            itemListElement: offerItems.map((item) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: item.name,
                url: abs(item.path),
              },
            })),
          },
        }
      : {}),
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    name: `${SITE.name}: ${SITE.descriptor}`,
    url: abs("/"),
    description: SITE.description,
    author: personRef(),
    publisher: studioRef(),
    inLanguage: "en",
  };
}

export function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `About ${SITE.name} — ${SITE.descriptor}`,
    url: abs("/about"),
    description:
      "Background, disciplines, verified certifications and solo-studio collaboration model of Ali Arshad.",
    mainEntity: personRef(),
    inLanguage: "en",
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function serviceListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE.name} Studio Services`,
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.positioning,
        serviceType: s.title,
        provider: personRef(),
        url: abs(`/services#${s.id}`),
      },
    })),
  };
}

/**
 * Demonstration projects are CreativeWork, never Product or SoftwareApplication
 * with ratings: they are self-initiated builds with fictional brands, and the
 * description must carry that framing where the page does.
 */
export function creativeWorkSchema(project: Project, variant: "project" | "case-study") {
  const path = variant === "case-study" ? `/case-studies/${project.slug}` : `/work/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: abs(path),
    author: personRef(),
    creativeWorkStatus: project.status,
    ...(project.year ? { dateCreated: project.year } : {}),
    ...(project.technologies.length > 0 ? { keywords: project.technologies.join(", ") } : {}),
    ...(!project.usesSampleMedia ? { image: abs(project.cover.src) } : {}),
    inLanguage: "en",
  };
}

/**
 * Honest SoftwareApplication schema for the studio's standalone demonstration
 * applications in /products/[slug]. Zero fake ratings, reviews or pricing.
 */
export function softwareApplicationSchema(product: StudioProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${product.name} — ${product.tagline}`,
    description: `${product.shortDescription} Studio demonstration application using fictional seeded data.`,
    url: abs(`/products/${product.slug}`),
    applicationCategory: "BusinessApplication",
    operatingSystem:
      product.slug === "stockflow-mobile"
        ? "Web browser, iOS, Android (React Native / Expo)"
        : "Web browser",
    isAccessibleForFree: true,
    author: personRef(),
    image: abs(product.cover.src),
    ...(product.liveUrl ? { sameAs: product.liveUrl } : {}),
    inLanguage: "en",
  };
}

/**
 * Honest WebApplication schema for free browser-based calculators under /tools/*.
 */
export function webApplicationSchema(input: { slug: string; name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: abs(`/tools/${input.slug}`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    author: personRef(),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: "en",
  };
}

/**
 * Article schema for published studio guides under /resources/[slug], with real
 * publication and update dates and consistent @id author/publisher references.
 */
export function articleSchema(input: {
  slug: string;
  title: string;
  description: string;
  category?: string;
  publishedAt?: string;
  updatedAt?: string;
}) {
  const url = abs(`/resources/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    image: abs("/opengraph-image.jpg"),
    ...(input.category ? { articleSection: input.category } : {}),
    author: personRef(),
    publisher: studioRef(),
    isAccessibleForFree: true,
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.updatedAt ?? input.publishedAt ? { dateModified: input.updatedAt ?? input.publishedAt } : {}),
    inLanguage: "en",
  };
}

/**
 * A single Service node for a dedicated service hub or specialization page.
 * Honest provider is a Person linked via @id; remote delivery only, zero fake
 * ratings, prices, or physical offices.
 */
export function singleServiceSchema(input: { name: string; description: string; path: string; serviceType?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType ?? input.name,
    provider: personRef(),
    brand: studioRef(),
    url: abs(input.path),
    areaServed: [{ "@type": "Country", name: "United States" }, "International (Remote)"],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: abs("/contact"),
      availableLanguage: "English",
    },
  };
}

export type FaqItem = { q: string; a: string };

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Honest VideoGame schema for original playable browser experiments under
 * /games/[slug]. Linked to #person via @id; zero fake ratings or prices.
 */
export function gameSchema(game: GameDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: `${game.summary} Original self-initiated portfolio experiment by ${SITE.name}.`,
    url: abs(`/games/${game.slug}`),
    genre: game.category,
    playMode: "SinglePlayer",
    applicationCategory: "Game",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    author: personRef(),
    inLanguage: "en",
  };
}

export function gameListSchema(games: GameDefinition[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE.name} — Original Browser Games & Interactive Experiments`,
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoGame",
        name: g.title,
        description: g.tagline,
        genre: g.category,
        url: abs(`/games/${g.slug}`),
        author: personRef(),
      },
    })),
  };
}

/**
 * BlogPosting schema for Studio Blog articles under /blog/[slug].
 * Linked consistently to #person and #studio via @id; honest dates & sections.
 */
export function blogArticleSchema(post: BlogPost) {
  const url = abs(`/blog/${post.slug}`);
  const rasterImage =
    post.visual && /\.(png|jpe?g|webp)$/i.test(post.visual.src)
      ? abs(post.visual.src)
      : abs("/opengraph-image.jpg");
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: rasterImage,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: estimateWordCount(post),
    timeRequired: `PT${estimateReadingMinutes(post)}M`,
    author: personRef(),
    publisher: studioRef(),
    isAccessibleForFree: true,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "en",
  };
}

export function blogListSchema(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE.name} — Studio Blog`,
    description:
      "Engineering build logs, source-backed AI protocol notes, creative workflow breakdowns, and browser-game dispatches.",
    url: abs("/blog"),
    author: personRef(),
    publisher: studioRef(),
    inLanguage: "en",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: abs(`/blog/${p.slug}`),
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      articleSection: p.category,
      author: personRef(),
    })),
  };
}

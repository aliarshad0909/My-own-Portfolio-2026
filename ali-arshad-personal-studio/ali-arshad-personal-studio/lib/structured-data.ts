/**
 * JSON-LD builders. Every field here must be visible on the page it describes
 * or verifiable from the credential record — no reviews, ratings, addresses,
 * employees, clients or awards are asserted anywhere, because none are
 * verified. The studio is one person, so the honest entity is Person; no
 * Organization node is emitted.
 */
import { CREDENTIALS } from "@/lib/credentials";
import type { Project } from "@/lib/projects";
import { SERVICES } from "@/lib/services";
import { SITE, activeSocials, siteBaseUrl } from "@/lib/site";

const abs = (path: string) => new URL(path, siteBaseUrl()).toString();

export function personSchema() {
  const sameAs = activeSocials().map((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": abs("/#person"),
    name: SITE.name,
    jobTitle: SITE.role,
    description: SITE.description,
    url: abs("/"),
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

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    name: `${SITE.name}: ${SITE.descriptor}`,
    url: abs("/"),
    description: SITE.description,
    author: { "@id": abs("/#person") },
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
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.positioning,
        serviceType: s.title,
        provider: { "@type": "Person", name: SITE.name, url: abs("/") },
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
    author: { "@type": "Person", name: SITE.name, url: abs("/") },
    creativeWorkStatus: project.status,
    inLanguage: "en",
  };
}

/**
 * A single Service node for a dedicated service-hub page. Honest provider is a
 * Person (the studio is one person); no ratings, no aggregate claims, no area
 * served asserted beyond a remote offering.
 */
export function singleServiceSchema(input: { name: string; description: string; path: string; serviceType?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType ?? input.name,
    provider: { "@type": "Person", name: SITE.name, url: abs("/") },
    url: abs(input.path),
    areaServed: { "@type": "Country", name: "United States" },
    availableChannel: { "@type": "ServiceChannel", serviceUrl: abs("/contact") },
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

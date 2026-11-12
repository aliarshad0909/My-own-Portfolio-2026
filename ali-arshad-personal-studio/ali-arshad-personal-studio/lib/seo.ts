import type { Metadata } from "next";
import { SITE } from "@/lib/site";

type PageMeta = {
  title: string;
  description: string;
  /** Route path starting with "/". */
  path: string;
  /** Set false for drafts and placeholders. */
  index?: boolean;
};

/** Consistent per-page metadata: title, description, canonical and social cards. */
export function pageMetadata({ title, description, path, index = true }: PageMeta): Metadata {
  const fullTitle = path === "/" ? title : `${title} — ${SITE.name}`;
  return {
    title: fullTitle,
    description,
    // Canonical URLs are only emitted once a real domain is configured.
    alternates: SITE.url ? { canonical: path } : undefined,
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: `${SITE.name} — ${SITE.descriptor}`,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}

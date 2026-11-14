import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl().origin;

  // Vercel preview and development deployments must never be indexed as
  // duplicates of the production site. (Vercel also sends X-Robots-Tag:
  // noindex on previews; this keeps the rule true even if that changes.)
  const isPreview = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";
  if (isPreview) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

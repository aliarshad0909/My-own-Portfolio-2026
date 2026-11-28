import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** Flagship projects whose canonical public URL is /case-studies/[slug] (prevents /work vs /case-studies duplicate URLs). */
const CANONICAL_CASE_STUDY_SLUGS = [
  "pipelineos-crm",
  "stockflow-inventory",
  "tessera-clayworks-storefront",
  "northwind-analytics-dashboard",
  "tideline-support-agent",
  "kestrel-voice-sales-agent",
  "inbound-lead-qualification-workflow",
  "meridian-inventory-operations",
  "lantern-sourcing-platform",
  "blender-product-visualisation",
  "motion-production-pipeline",
  "halcyon-brand-system",
  "ledgerlight-block-explorer",
  "sentryline-security-posture",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return CANONICAL_CASE_STUDY_SLUGS.map((slug) => ({
      source: `/work/${slug}`,
      destination: `/case-studies/${slug}`,
      permanent: true,
    }));
  },
  async headers() {
    const adminNoIndexHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "no-store, private" },
    ];
    const immutableMediaHeaders = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    const pdfDownloadHeaders = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/images/:path*", headers: immutableMediaHeaders },
      { source: "/videos/:path*", headers: immutableMediaHeaders },
      { source: "/audio/:path*", headers: immutableMediaHeaders },
      { source: "/downloads/:path*", headers: pdfDownloadHeaders },
      { source: "/admin", headers: adminNoIndexHeaders },
      { source: "/admin/:path*", headers: adminNoIndexHeaders },
      { source: "/api/admin/:path*", headers: adminNoIndexHeaders },
    ];
  },
};

export default nextConfig;

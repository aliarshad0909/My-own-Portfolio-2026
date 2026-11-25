import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    const adminNoIndexHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "no-store, private" },
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin", headers: adminNoIndexHeaders },
      { source: "/admin/:path*", headers: adminNoIndexHeaders },
      { source: "/api/admin/:path*", headers: adminNoIndexHeaders },
    ];
  },
};

export default nextConfig;

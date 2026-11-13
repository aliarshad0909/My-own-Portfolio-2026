import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE, siteBaseUrl } from "@/lib/site";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/sections.css";
import "@/styles/motion.css";

const heading = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--ff-heading", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteBaseUrl(),
  title: { default: `${SITE.name} — ${SITE.role}`, template: "%s" },
  description: SITE.description,
  applicationName: `${SITE.name} — ${SITE.descriptor}`,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B0D10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

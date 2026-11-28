"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Keeps public site header/footer chrome 100% identical across all public routes,
 * while isolating the private `/admin` console into its own dedicated layout shell.
 * Uses pure CSS `.page-enter` transitions (0 KB motion runtime on critical path).
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminClientProvider, useAdminClient } from "@/components/admin/AdminClientContext";
import type { AdminSessionPublic } from "@/lib/admin/types";

const NAV_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/inbox", label: "Inbox & Leads" },
  { href: "/admin/campaigns", label: "Email Campaigns" },
  { href: "/admin/social", label: "Social & Platforms" },
  { href: "/admin/crm", label: "Contacts & CRM" },
  { href: "/admin/projects", label: "Projects & Content" },
  { href: "/admin/integrations", label: "Integrations & Settings" },
] as const;

function AdminShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, adminFetch } = useAdminClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeItem =
    NAV_LINKS.find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href))) ??
    NAV_LINKS[0];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="adm-shell">
      {drawerOpen && (
        <div
          className="adm-drawer-backdrop"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className="adm-sidebar" data-open={drawerOpen ? "true" : "false"} aria-label="Studio admin navigation">
        <Link href="/admin" className="adm-brand" onClick={() => setDrawerOpen(false)}>
          <span className="adm-brand-mark" aria-hidden="true">
            A
          </span>
          <span>
            <span className="adm-brand-title" style={{ display: "block" }}>
              Ali Arshad Studio
            </span>
            <span className="adm-brand-sub">Private Admin Console</span>
          </span>
        </Link>

        <nav className="adm-nav">
          {NAV_LINKS.map((item) => {
            const isCurrent = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="adm-nav-link"
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => setDrawerOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-owner-chip">
            <strong>Signed in</strong>
            {session.email}
          </div>
          <Link href="/" className="adm-btn adm-btn--ghost adm-btn--sm" target="_blank" rel="noopener noreferrer">
            Open Public Portfolio ↗
          </Link>
          <button
            type="button"
            className="adm-btn adm-btn--danger adm-btn--sm"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      <div className="adm-main-wrap">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <button
              type="button"
              className="adm-menu-btn"
              aria-label="Toggle admin navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              ☰
            </button>
            <span className="adm-topbar-title">{activeItem.label}</span>
          </div>

          <div className="adm-topbar-actions">
            {session.demoMode && <span className="adm-badge adm-badge--demo">DEMO MODE</span>}
            <Link href="/admin/integrations" className="adm-btn adm-btn--ghost adm-btn--sm">
              Health & Setup
            </Link>
          </div>
        </header>

        {session.demoMode && (
          <div className="adm-demo-ribbon" role="status">
            <span>
              <strong>Local Demo Mode Active:</strong> Synthetic placeholder records are shown wherever a live database or
              self-hosted service is not yet connected. Set <code className="adm-code">ADMIN_DEMO_MODE=false</code> in
              production.
            </span>
          </div>
        )}

        <main id="admin-main" className="adm-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ session, children }: { session: AdminSessionPublic; children: ReactNode }) {
  return (
    <AdminClientProvider session={session}>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminClientProvider>
  );
}

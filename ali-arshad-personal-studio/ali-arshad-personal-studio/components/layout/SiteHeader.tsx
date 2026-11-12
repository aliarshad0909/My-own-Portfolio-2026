"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, SITE } from "@/lib/site";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: lock scroll, move focus in, trap Tab, close on Escape.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label={`${SITE.name} — ${SITE.descriptor}, home`}>
          <BrandMark size={30} />
          <span className="brand__name">{SITE.name}</span>
          <span className="brand__descriptor">{SITE.descriptor}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ul>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`site-nav__link ${active ? "is-active" : ""}`.trim()} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/contact" className="btn btn--primary btn--sm site-header__cta">
          <span>Let&rsquo;s Talk</span>
          <Icon name="arrow-up-right" size={16} className="btn__icon" />
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" size={24} />
        </button>
      </div>

      <div className={`mobile-menu ${open ? "is-open" : ""}`.trim()} id="mobile-menu" hidden={!open}>
        <div className="mobile-menu__backdrop" onClick={() => close(false)} aria-hidden="true" />
        <div ref={panelRef} className="mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mobile-menu__top">
            <span className="brand">
              <BrandMark size={28} />
              <span className="brand__name">{SITE.name}</span>
            </span>
            <button ref={closeRef} type="button" className="menu-toggle menu-toggle--close" aria-label="Close menu" onClick={() => close()}>
              <Icon name="close" size={24} />
            </button>
          </div>
          <nav aria-label="Mobile">
            <ul className="mobile-menu__list">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`mobile-menu__link ${active ? "is-active" : ""}`.trim()}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                      <Icon name="arrow-right" size={18} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link href="/contact" className="btn btn--primary btn--md mobile-menu__cta" onClick={() => setOpen(false)}>
            <span>Let&rsquo;s Talk</span>
            <Icon name="arrow-up-right" size={18} className="btn__icon" />
          </Link>
        </div>
      </div>
    </header>
  );
}

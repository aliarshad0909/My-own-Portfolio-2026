"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, SITE } from "@/lib/site";

const DESKTOP_NAV = "(min-width: 1100px)";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close if the viewport grows past the mobile breakpoint, where the toggle
  // that opened the menu is no longer rendered.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_NAV);
    const sync = () => {
      if (mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label={`${SITE.name}, ${SITE.descriptor}, home`}>
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
          aria-controls={open ? "mobile-menu" : undefined}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" size={24} />
        </button>
      </div>

      <MobileMenu open={open} onClose={close} isActive={(href) => isActive(pathname, href)} returnFocusTo={toggleRef} />
    </header>
  );
}

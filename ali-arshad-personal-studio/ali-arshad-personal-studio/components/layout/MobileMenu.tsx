"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, SITE } from "@/lib/site";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
};

/**
 * The overlay is rendered into `document.body` rather than inside the header.
 *
 * `.site-header` carries `backdrop-filter: blur(14px)`, and a non-`none`
 * backdrop-filter makes an element the containing block for every
 * fixed-position descendant. Nested in the header, this panel's `inset: 0`
 * resolved against the 68px header box instead of the viewport, so the menu
 * opened as a 68px strip with its links clipped out of view. A portal puts it
 * back on the viewport and keeps it immune to any filter, transform or
 * containment added to the header later.
 */
export function MobileMenu({ open, onClose, isActive, returnFocusTo }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  // Set just before the panel unmounts, and read by the cleanup that restores
  // focus: a nav link hands focus to the incoming page instead of the toggle.
  const returnFocus = useRef(true);

  useEffect(() => setMounted(true), []);

  const close = useCallback(
    (focusToggle = true) => {
      returnFocus.current = focusToggle;
      onClose();
    },
    [onClose],
  );

  // Lock the page behind the menu and take it out of the tab order.
  useEffect(() => {
    if (!open) return;
    const doc = document.documentElement;
    const body = document.body;
    const gutter = window.innerWidth - doc.clientWidth;
    const previous = { html: doc.style.overflow, body: body.style.overflow, pad: body.style.paddingRight };

    doc.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const outside = Array.from(body.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== menuRef.current);
    const wasInert = outside.map((el) => el.hasAttribute("inert"));
    outside.forEach((el) => el.setAttribute("inert", ""));

    return () => {
      doc.style.overflow = previous.html;
      body.style.overflow = previous.body;
      body.style.paddingRight = previous.pad;
      outside.forEach((el, i) => {
        if (!wasInert[i]) el.removeAttribute("inert");
      });
    };
  }, [open]);

  // Move focus in, then keep Tab inside the panel; Escape closes.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Runs after the effect above has lifted `inert`, so the toggle is
      // focusable again by the time we reach for it.
      if (returnFocus.current) returnFocusTo.current?.focus();
      returnFocus.current = true;
    };
  }, [open, close, returnFocusTo]);

  if (!mounted || !open) return null;

  return createPortal(
    <div ref={menuRef} className="mobile-menu" id="mobile-menu">
      <button type="button" className="mobile-menu__backdrop" aria-label="Close menu" tabIndex={-1} onClick={() => close()} />
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
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`mobile-menu__link ${active ? "is-active" : ""}`.trim()}
                    aria-current={active ? "page" : undefined}
                    onClick={() => close(false)}
                  >
                    {item.label}
                    <Icon name="arrow-right" size={18} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/contact" className="btn btn--primary btn--md mobile-menu__cta" onClick={() => close(false)}>
          <span>Let&rsquo;s Talk</span>
          <Icon name="arrow-up-right" size={18} className="btn__icon" />
        </Link>
      </div>
    </div>,
    document.body,
  );
}

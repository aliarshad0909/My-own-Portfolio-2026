import { useSyncExternalStore } from "react";

/**
 * Tiny hash router ("#/shop?category=Bowls"). Works on any static host with no
 * rewrite rules. Location is held in memory first, so navigation still works in
 * sandboxed frames where the URL cannot be changed.
 */
export type Location = { path: string; query: URLSearchParams };

const parse = (raw: string): Location => {
  const cleaned = raw.replace(/^#/, "") || "/";
  const [path, qs = ""] = cleaned.split("?");
  return { path: path.startsWith("/") ? path : `/${path}`, query: new URLSearchParams(qs) };
};

let current: Location = parse(typeof window !== "undefined" ? window.location.hash : "");
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    current = parse(window.location.hash);
    emit();
  });
}

export function navigate(to: string): void {
  current = parse(to);
  try {
    if (window.location.hash !== `#${to}`) window.location.hash = to;
  } catch {
    /* URL not writable — in-memory location still drives the app */
  }
  emit();
  window.scrollTo(0, 0);
  // Move focus to the page for keyboard and screen-reader users.
  requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true }));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useLocation = (): Location => useSyncExternalStore(subscribe, () => current);

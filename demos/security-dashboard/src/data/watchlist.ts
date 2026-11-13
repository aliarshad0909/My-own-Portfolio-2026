import type { Severity } from "../lib/certificate.ts";

/**
 * The watchlist records analyses the user has run, so a grade can be tracked
 * over time. Nothing is fetched and nothing is scanned: an entry exists only
 * because someone pasted a response into this page.
 *
 * Stored in localStorage, which is per-browser and can be unavailable (private
 * mode, blocked storage). Every access is guarded and failure is reported in
 * the interface rather than swallowed.
 */

export type Entry = {
  id: string;
  target: string;
  at: number;
  score: number;
  grade: string;
  counts: Record<Severity, number>;
  source: "pasted" | "fixture";
};

const KEY = "sentryline.watchlist.v1";

/** Seeded history for an invented target, so the trend view has something to draw. */
export const FIXTURE_HISTORY: Entry[] = [
  { id: "f1", target: "example-shop.test", at: Date.UTC(2026, 8, 2), score: 31, grade: "F", counts: { critical: 0, high: 3, medium: 2, low: 1, info: 2, pass: 1 }, source: "fixture" },
  { id: "f2", target: "example-shop.test", at: Date.UTC(2026, 8, 19), score: 48, grade: "D", counts: { critical: 0, high: 2, medium: 2, low: 1, info: 2, pass: 3 }, source: "fixture" },
  { id: "f3", target: "example-shop.test", at: Date.UTC(2026, 9, 7), score: 62, grade: "C", counts: { critical: 0, high: 1, medium: 2, low: 2, info: 1, pass: 5 }, source: "fixture" },
  { id: "f4", target: "example-shop.test", at: Date.UTC(2026, 9, 28), score: 79, grade: "B", counts: { critical: 0, high: 0, medium: 2, low: 2, info: 1, pass: 7 }, source: "fixture" },
  { id: "f5", target: "example-shop.test", at: Date.UTC(2026, 10, 11), score: 92, grade: "A", counts: { critical: 0, high: 0, medium: 0, low: 2, info: 1, pass: 9 }, source: "fixture" },
];

type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };

const memory = new Map<string, string>();
const fallback: Storage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => { memory.set(k, v); },
};

function store(): { storage: Storage; durable: boolean } {
  try {
    const probe = "__sentryline_probe__";
    globalThis.localStorage.setItem(probe, "1");
    globalThis.localStorage.removeItem(probe);
    return { storage: globalThis.localStorage, durable: true };
  } catch {
    return { storage: fallback, durable: false };
  }
}

export function load(): { entries: Entry[]; durable: boolean } {
  const { storage, durable } = store();
  try {
    const raw = storage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Entry[]) : [];
    return { entries: Array.isArray(saved) ? saved : [], durable };
  } catch {
    return { entries: [], durable };
  }
}

export function save(entries: Entry[]): boolean {
  const { storage } = store();
  try {
    storage.setItem(KEY, JSON.stringify(entries.slice(-80)));
    return true;
  } catch {
    return false;
  }
}

export const seriesFor = (entries: Entry[], target: string): Entry[] =>
  entries.filter((e) => e.target === target).sort((a, b) => a.at - b.at);

export const targets = (entries: Entry[]): string[] => [...new Set(entries.map((e) => e.target))].sort();

/** The trend between the first and last recorded score. */
export function trend(series: Entry[]): { delta: number; direction: "up" | "down" | "flat" } | null {
  if (series.length < 2) return null;
  const delta = series[series.length - 1].score - series[0].score;
  return { delta, direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat" };
}

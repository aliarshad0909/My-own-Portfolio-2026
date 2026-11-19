"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type LocationDirectoryState = {
  slug: string;
  name: string;
  code: string;
  region: string;
  largestMetro: string;
  live: boolean;
};

type Props = {
  regions: readonly string[];
  states: LocationDirectoryState[];
};

/**
 * Interactive US coverage directory browser.
 *
 * Lets visitors filter all 50 states + D.C. by region or search by state name,
 * abbreviation or metro. Only links a state when its route is actually live on
 * this deployment — otherwise renders clean text so the directory never 404s.
 */
export function LocationsBrowser({ regions, states }: Props) {
  const [region, setRegion] = useState<string>("All");
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return states.filter((s) => {
      if (region !== "All" && s.region !== region) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.largestMetro.toLowerCase().includes(q)
      );
    });
  }, [states, region, query]);

  return (
    <div>
      <div className="loc-controls">
        <div>
          <label htmlFor="loc-filter" className="visually-hidden">
            Filter states or metros
          </label>
          <input
            id="loc-filter"
            type="search"
            className="loc-search"
            placeholder="Filter by state, code or metro (e.g. Texas, NY, Austin)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="loc-pills" role="group" aria-label="Filter by US region">
          <button
            type="button"
            className={`loc-pill ${region === "All" ? "is-active" : ""}`.trim()}
            aria-pressed={region === "All"}
            onClick={() => setRegion("All")}
          >
            All ({states.length})
          </button>
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              className={`loc-pill ${region === r ? "is-active" : ""}`.trim()}
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="measure muted">No states or metros matched &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="location-grid" aria-live="polite">
          {filtered.map((s) => (
            <li key={s.slug} className="loc-state-card">
              <div>
                {s.live ? (
                  <Link href={`/locations/${s.slug}`}>
                    <strong>{s.name}</strong>
                  </Link>
                ) : (
                  <span>{s.name}</span>
                )}
                <div className="loc-state-card__meta">{s.largestMetro}</div>
              </div>
              <span className="loc-state-card__meta">{s.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

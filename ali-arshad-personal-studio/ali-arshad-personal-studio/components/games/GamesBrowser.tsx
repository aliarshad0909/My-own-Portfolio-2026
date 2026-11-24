"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GameCoverArt } from "@/components/games/GameCoverArt";
import { Icon } from "@/components/ui/Icon";
import { GAME_CATEGORIES, type GameCategory, type GameDefinition } from "@/lib/games/catalog";

export function GamesBrowser({ games }: { games: GameDefinition[] }) {
  const [category, setCategory] = useState<"All" | GameCategory>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => {
      if (category !== "All" && g.category !== category) return false;
      if (q) {
        const hay = `${g.title} ${g.tagline} ${g.summary} ${g.category} ${g.mechanics.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [category, games, query]);

  return (
    <div className="games-browser">
      <div className="panel games-filter-panel" aria-label="Filter browser games">
        <div className="games-filter-row">
          <div className="filter-bar" role="group" aria-label="Filter games by category">
            {(["All", ...GAME_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${category === cat ? "is-active" : ""}`.trim()}
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 20 games (e.g. circuit, WCAG, memory, word)…"
            className="work-finder__input"
            style={{ maxWidth: "340px" }}
            aria-label="Search playable browser games"
          />
        </div>

        <div className="work-finder__meta">
          <span className="work-finder__count" role="status" aria-live="polite">
            Showing <strong>{visible.length}</strong> of {games.length} playable original experiments
          </span>
          {category !== "All" || query.trim() !== "" ? (
            <button
              type="button"
              className="active-filter__clear"
              onClick={() => {
                setCategory("All");
                setQuery("");
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="game-grid">
          {visible.map((game) => (
            <li key={game.slug} className="game-card panel">
              <Link href={`/games/${game.slug}`} className="game-card__media" aria-label={`Open ${game.title}`}>
                <GameCoverArt slug={game.slug} />
              </Link>
              <div className="game-card__body">
                <div className="game-card__badges">
                  <span className="badge badge--concept">{game.experimentLabel}</span>
                  <span className="badge">{game.category}</span>
                </div>
                <h3 className="card-title">
                  <Link href={`/games/${game.slug}`}>{game.title}</Link>
                </h3>
                <p className="game-card__summary">{game.summary}</p>
                <ul className="game-card__meta" aria-label={`${game.title} modes`}>
                  {game.difficultyModes.map((mode) => (
                    <li key={mode}>{mode}</li>
                  ))}
                </ul>
                <div className="game-card__footer">
                  <span className="fine-print">Session: {game.estimatedTime}</span>
                  <Link href={`/games/${game.slug}`} className="btn btn--primary btn--sm">
                    <Icon name="play" size={15} />
                    <span>Play</span>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <h3 className="empty-state__title">No games match that search</h3>
          <p>Try clearing the category or search text to browse all {games.length} original playable games.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setCategory("All");
              setQuery("");
            }}
          >
            <span>Show all {games.length} games</span>
          </button>
        </div>
      )}
    </div>
  );
}

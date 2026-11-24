"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  PAIRS_DIFFICULTIES,
  clearPairsMismatch,
  createPairsState,
  flipPairCard,
  isPairsSolved,
  type EmblemId,
  type PairsDifficulty,
  type PairsState,
} from "@/lib/games/studio-pairs";

function EmblemGlyph({ id, color }: { id: EmblemId; color: string }) {
  return (
    <svg
      width={34}
      height={34}
      viewBox="0 0 36 36"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {id === "prism" ? <polygon points="18,5 31,29 5,29" /> : null}
      {id === "circuit" ? (
        <>
          <rect x="8" y="8" width="20" height="20" rx="4" />
          <circle cx="18" cy="18" r="4" fill={color} />
          <path d="M18 4v4M18 28v4M4 18h4M28 18h4" />
        </>
      ) : null}
      {id === "orbit" ? (
        <>
          <circle cx="18" cy="18" r="11" />
          <circle cx="18" cy="18" r="3.5" fill={color} />
          <circle cx="29" cy="18" r="2.2" fill={color} />
        </>
      ) : null}
      {id === "waveform" ? <path d="M4 18h5l3-10 6 20 4-14 3 4h7" /> : null}
      {id === "lattice" ? (
        <>
          <polygon points="18,4 32,18 18,32 4,18" />
          <path d="M11 11l14 14M25 11L11 25" />
        </>
      ) : null}
      {id === "compass" ? (
        <>
          <circle cx="18" cy="18" r="12" />
          <polygon points="18,9 21.5,18 18,27 14.5,18" />
        </>
      ) : null}
      {id === "beacon" ? (
        <>
          <circle cx="18" cy="15" r="3.5" fill={color} />
          <path d="M11 10a10 10 0 0 0 0 10M25 10a10 10 0 0 1 0 10M12 29h12M18 19v10" />
        </>
      ) : null}
      {id === "vector" ? (
        <>
          <path d="M7 27L28 8M17 8h11v11" />
          <circle cx="7" cy="27" r="3" fill={color} />
        </>
      ) : null}
      {id === "helix" ? (
        <>
          <path d="M10 6c0 8 16 8 16 16 0 4-4 6-8 8" />
          <path d="M26 6c0 8-16 8-16 16 0 4 4 6 8 8" />
        </>
      ) : null}
      {id === "keystone" ? (
        <>
          <polygon points="8,7 28,7 24,29 12,29" />
          <line x1="12" y1="17" x2="24" y2="17" />
        </>
      ) : null}
    </svg>
  );
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Deterministic initial shuffle seed so SSR HTML and first client render stay 100% hydration-safe. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function StudioPairsGame() {
  const [state, setState] = useState<PairsState>(() => createPairsState("standard", seededRng(2026)));
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [bestByMode, setBestByMode] = useState<Partial<Record<PairsDifficulty, number>>>({});
  const [focusIndex, setFocusIndex] = useState(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const solved = isPairsSolved(state);
  const config = PAIRS_DIFFICULTIES[state.difficulty];

  // Live timer while game is active.
  useEffect(() => {
    if (!timerActive || solved) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerActive, solved]);

  // Auto-hide mismatched cards after a brief viewing window.
  useEffect(() => {
    if (!state.mismatchPending) return;
    const id = window.setTimeout(() => {
      setState((prev) => clearPairsMismatch(prev));
    }, 850);
    return () => window.clearTimeout(id);
  }, [state.mismatchPending]);

  const startBoard = (difficulty: PairsDifficulty) => {
    setState(createPairsState(difficulty));
    setSeconds(0);
    setTimerActive(false);
    setFocusIndex(0);
  };

  const handleFlip = (idx: number) => {
    setFocusIndex(idx);
    if (!timerActive) setTimerActive(true);
    setState((prev) => {
      const next = flipPairCard(prev, idx);
      if (isPairsSolved(next)) {
        setTimerActive(false);
        setBestByMode((prevBest) => {
          const currentBest = prevBest[next.difficulty];
          if (currentBest === undefined || next.moves < currentBest) {
            return { ...prevBest, [next.difficulty]: next.moves };
          }
          return prevBest;
        });
      }
      return next;
    });
  };

  const focusCard = (idx: number) => {
    setFocusIndex(idx);
    cardRefs.current[idx]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const cols = config.cols;
    const total = state.cards.length;
    if (e.key === "ArrowRight" && idx + 1 < total) {
      e.preventDefault();
      focusCard(idx + 1);
    } else if (e.key === "ArrowLeft" && idx - 1 >= 0) {
      e.preventDefault();
      focusCard(idx - 1);
    } else if (e.key === "ArrowDown" && idx + cols < total) {
      e.preventDefault();
      focusCard(idx + cols);
    } else if (e.key === "ArrowUp" && idx - cols >= 0) {
      e.preventDefault();
      focusCard(idx - cols);
    }
  };

  const bestMoves = bestByMode[state.difficulty];

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Select Studio Pairs difficulty">
          {(Object.keys(PAIRS_DIFFICULTIES) as PairsDifficulty[]).map((key) => {
            const opt = PAIRS_DIFFICULTIES[key];
            return (
              <button
                key={opt.id}
                type="button"
                className={`filter-chip ${state.difficulty === opt.id ? "is-active" : ""}`.trim()}
                aria-pressed={state.difficulty === opt.id}
                onClick={() => startBoard(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => startBoard(state.difficulty)}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Studio Pairs progress">
        <div>
          <dt>Pairs found</dt>
          <dd>
            {state.matchedPairs} / {state.totalPairs}
          </dd>
        </div>
        <div>
          <dt>Moves</dt>
          <dd>{state.moves}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatSeconds(seconds)}</dd>
        </div>
        <div>
          <dt>Session best</dt>
          <dd>{bestMoves !== undefined ? `${bestMoves} moves` : "—"}</dd>
        </div>
      </dl>

      <div
        className={`pairs-board pairs-board--cols-${config.cols}`}
        role="grid"
        aria-label={`Studio Pairs memory grid with ${state.cards.length} cards`}
      >
        {state.cards.map((card, idx) => {
          const isRevealed = card.matched || state.flipped.includes(idx);
          const isMismatch = state.mismatchPending && state.flipped.includes(idx);
          return (
            <button
              key={card.uid}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              type="button"
              role="gridcell"
              tabIndex={focusIndex === idx ? 0 : -1}
              className={`pair-card ${isRevealed ? "is-open" : ""} ${card.matched ? "is-matched" : ""} ${isMismatch ? "is-mismatch" : ""}`.trim()}
              style={isRevealed ? { borderColor: card.color } : undefined}
              aria-pressed={isRevealed}
              aria-label={
                isRevealed
                  ? `Card ${idx + 1}: ${card.label}${card.matched ? " (matched)" : ""}`
                  : `Card ${idx + 1}: face down`
              }
              onClick={() => handleFlip(idx)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
            >
              {isRevealed ? (
                <span className="pair-card__face">
                  <EmblemGlyph id={card.emblemId} color={card.color} />
                  <span className="pair-card__label">{card.label}</span>
                </span>
              ) : (
                <span className="pair-card__back" aria-hidden="true">
                  <span className="pair-card__dot" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {state.lastAnnouncement}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>
              All {state.totalPairs} pairs matched in {state.moves} moves ({formatSeconds(seconds)})!
            </strong>
          </div>
          <div className="game-complete__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => startBoard(state.difficulty)}
            >
              <span>Deal fresh board</span>
              <Icon name="rotate-ccw" size={15} />
            </button>
            {state.difficulty !== "extended" ? (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => startBoard(state.difficulty === "compact" ? "standard" : "extended")}
              >
                <span>Try next difficulty</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  CIPHER_WORDS,
  EQUATION_CHALLENGES,
  combineEquationTiles,
  createEquationState,
  createSlideState,
  createSumShiftState,
  evaluateCipherGuess,
  isEquationSolved,
  isSlideSolved,
  moveSumShift,
  slideTileAt,
  type ArithmeticOp,
  type LetterVerdict,
  type ShiftDir,
} from "@/lib/games/engines-word-number";

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── 1. CIPHER FIVE ────────────────────────────────────────────────────── */
const KBD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

export function CipherFiveGame() {
  const [wordIdx, setWordIdx] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("Type or tap a 5-letter word and press Enter.");

  const target = CIPHER_WORDS[wordIdx % CIPHER_WORDS.length];
  const won = guesses.includes(target);
  const lost = !won && guesses.length >= 6;
  const done = won || lost;

  const keyRank: Record<string, LetterVerdict> = {};
  const priority: Record<LetterVerdict, number> = { absent: 1, present: 2, exact: 3 };
  for (const g of guesses) {
    const verdicts = evaluateCipherGuess(target, g);
    g.split("").forEach((ch, idx) => {
      const v = verdicts[idx];
      if (!keyRank[ch] || priority[v] > priority[keyRank[ch]]) keyRank[ch] = v;
    });
  }

  const pressKey = useCallback(
    (key: string) => {
      if (done) return;
      if (key === "⌫" || key === "BACKSPACE") {
        setDraft((d) => d.slice(0, -1));
      } else if (key === "ENTER") {
        if (draft.length < 5) {
          setNotice("Enter all 5 letters before submitting.");
          return;
        }
        const nextGuesses = [...guesses, draft];
        setGuesses(nextGuesses);
        setDraft("");
        if (draft === target) setNotice(`Solved "${target}" in ${nextGuesses.length} of 6 tries!`);
        else if (nextGuesses.length >= 6) setNotice(`Out of tries — the hidden word was ${target}.`);
        else setNotice(`Submitted ${draft}. ${6 - nextGuesses.length} guesses left.`);
      } else if (/^[A-Z]$/.test(key) && draft.length < 5) {
        setDraft((d) => d + key);
      }
    },
    [done, draft, guesses, target],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === "ENTER" || k === "BACKSPACE" || /^[A-Z]$/.test(k)) {
        pressKey(k);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressKey]);

  const nextWord = () => {
    setWordIdx((i) => (i + 1) % CIPHER_WORDS.length);
    setGuesses([]);
    setDraft("");
    setNotice("Fresh 5-letter studio word ready.");
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">Puzzle #{wordIdx + 1} of {CIPHER_WORDS.length}</span>
        <div className="game-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={nextWord}>
            <Icon name="rotate-ccw" size={15} />
            <span>New word</span>
          </button>
        </div>
      </div>

      <div className="cipher-rows" role="grid" aria-label="Cipher Five guess board">
        {Array.from({ length: 6 }, (_, row) => {
          const submitted = guesses[row];
          const text = submitted ?? (row === guesses.length ? draft : "");
          const verdicts = submitted ? evaluateCipherGuess(target, submitted) : null;
          return (
            <div key={row} className="cipher-row" role="row">
              {Array.from({ length: 5 }, (_, col) => {
                const ch = text[col] ?? "";
                const v = verdicts ? verdicts[col] : null;
                return (
                  <div
                    key={col}
                    role="gridcell"
                    className={`cipher-tile ${v ? `cipher-tile--${v}` : ""}`.trim()}
                    aria-label={ch ? `${ch}${v ? `, ${v}` : ""}` : "blank"}
                  >
                    <span>{ch}</span>
                    {v === "exact" ? <span className="cipher-tile__mark" aria-hidden="true">✓</span> : null}
                    {v === "present" ? <span className="cipher-tile__mark" aria-hidden="true">~</span> : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="cipher-kbd" role="group" aria-label="On-screen keyboard">
        {KBD_ROWS.map((row, idx) => (
          <div key={idx} className="cipher-kbd__row">
            {row.map((k) => {
              const rank = keyRank[k];
              return (
                <button
                  key={k}
                  type="button"
                  className={`cipher-key ${rank ? `cipher-key--${rank}` : ""}`.trim()}
                  onClick={() => pressKey(k)}
                >
                  {k}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="game-live" role="status" aria-live="polite">{notice}</p>

      {done ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name={won ? "check" : "alert"} size={20} />
            <strong>{won ? `Cracked ${target} in ${guesses.length}/6!` : `Word was ${target}.`}</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={nextWord}>
            <span>Next word</span>
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 2. SUM SHIFT (4x4 MERGE) ──────────────────────────────────────────── */
const TILE_BG: Record<number, string> = {
  0: "var(--surface)",
  2: "#1d2735",
  4: "#253447",
  8: "#3b2f24",
  16: "#5e3528",
  32: "#8f3f2c",
  64: "#c64c32",
  128: "#b48224",
  256: "#1d7a58",
  512: "#2563eb",
};

export function SumShiftGame() {
  const [state, setState] = useState(() => createSumShiftState(256, seededRng(2026)));
  const highest = Math.max(...state.board);

  const shift = useCallback((dir: ShiftDir) => {
    setState((prev) => moveSumShift(prev, dir));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        shift("up");
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        shift("down");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        shift("left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        shift("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shift]);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Sum Shift target">
          {([256, 512] as const).map((g) => (
            <button
              key={g}
              type="button"
              className={`filter-chip ${state.goal === g ? "is-active" : ""}`.trim()}
              aria-pressed={state.goal === g}
              onClick={() => setState(createSumShiftState(g))}
            >
              Goal: {g}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={!state.prevBoard}
            onClick={() =>
              setState((prev) =>
                prev.prevBoard
                  ? { ...prev, board: prev.prevBoard, score: prev.prevScore, prevBoard: null, over: false }
                  : prev,
              )
            }
          >
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setState(createSumShiftState(state.goal))}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Sum Shift stats">
        <div>
          <dt>Score</dt>
          <dd>{state.score}</dd>
        </div>
        <div>
          <dt>Highest tile</dt>
          <dd>{highest}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{state.goal}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{state.won ? "Goal hit!" : state.over ? "Locked" : "Active"}</dd>
        </div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", maxWidth: "360px" }}
        role="grid"
        aria-label="Sum Shift 4 by 4 tile board"
      >
        {state.board.map((val, idx) => (
          <div
            key={idx}
            role="gridcell"
            className="game-cell-btn"
            style={{ background: TILE_BG[val] ?? "#6d28d9", cursor: "default", fontSize: val >= 100 ? "1.1rem" : "1.35rem" }}
          >
            {val === 0 ? "" : val}
          </div>
        ))}
      </div>

      <div className="game-mode-tabs" style={{ justifyContent: "center" }} role="group" aria-label="Slide direction buttons">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => shift("left")}>← Left</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => shift("up")}>↑ Up</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => shift("down")}>↓ Down</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => shift("right")}>Right →</button>
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {state.won
          ? `Reached ${state.goal} with score ${state.score}! Keep sliding or Restart.`
          : state.over
            ? "No merges left. Undo or Restart to play again."
            : "Use Arrow keys, WASD, or the directional buttons to slide and merge matching tiles."}
      </p>
    </div>
  );
}

/* ── 3. EQUATION FORGE ─────────────────────────────────────────────────── */
export function EquationForgeGame() {
  const [state, setState] = useState(() => createEquationState(0));
  const [firstIdx, setFirstIdx] = useState<number | null>(null);
  const [op, setOp] = useState<ArithmeticOp | null>(null);
  const [message, setMessage] = useState("Pick a number, an operator, then a second number.");
  const [showHint, setShowHint] = useState(false);

  const challenge = EQUATION_CHALLENGES[state.challengeIndex];
  const solved = isEquationSolved(state);

  const loadChallenge = (idx: number) => {
    setState(createEquationState(idx));
    setFirstIdx(null);
    setOp(null);
    setShowHint(false);
    setMessage(`Loaded ${EQUATION_CHALLENGES[idx].label}. Target: ${EQUATION_CHALLENGES[idx].target}.`);
  };

  const selectTile = (idx: number) => {
    if (solved) return;
    if (firstIdx === null || op === null) {
      setFirstIdx(idx);
      setMessage(`Selected ${state.tiles[idx].value}. Now choose +, −, ×, or ÷.`);
      return;
    }
    if (idx === firstIdx) {
      setFirstIdx(null);
      setOp(null);
      setMessage("Deselected tile.");
      return;
    }
    const res = combineEquationTiles(state, firstIdx, op, idx);
    if (res.error) {
      setMessage(res.error);
      return;
    }
    setState(res.state);
    setFirstIdx(null);
    setOp(null);
    setMessage(
      isEquationSolved(res.state)
        ? `Target ${challenge.target} forged!`
        : res.state.steps[res.state.steps.length - 1],
    );
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Equation Forge challenges">
          {EQUATION_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              className={`filter-chip ${state.challengeIndex === idx ? "is-active" : ""}`.trim()}
              aria-pressed={state.challengeIndex === idx}
              onClick={() => loadChallenge(idx)}
            >
              {ch.label} ({ch.target})
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowHint((h) => !h)}>
            <Icon name="lightbulb" size={15} />
            <span>{showHint ? "Hide hint" : "Hint"}</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={state.history.length === 0}
            onClick={() => {
              setState((prev) => ({
                ...prev,
                tiles: prev.history[prev.history.length - 1],
                history: prev.history.slice(0, -1),
                steps: prev.steps.slice(0, -1),
              }));
              setFirstIdx(null);
              setOp(null);
            }}
          >
            <span>Undo</span>
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadChallenge(state.challengeIndex)}>
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Equation Forge status">
        <div>
          <dt>Target</dt>
          <dd>{challenge.target}</dd>
        </div>
        <div>
          <dt>Numbers left</dt>
          <dd>{state.tiles.length}</dd>
        </div>
        <div>
          <dt>Steps</dt>
          <dd>{state.steps.length}</dd>
        </div>
        <div>
          <dt>Operator</dt>
          <dd>{op ?? "—"}</dd>
        </div>
      </dl>

      <div className="game-mode-tabs" style={{ justifyContent: "center" }} role="group" aria-label="Available number tiles">
        {state.tiles.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            className={`game-cell-btn ${firstIdx === idx ? "is-powered is-selected" : ""} ${t.value === challenge.target ? "is-visited" : ""}`.trim()}
            style={{ width: "86px", fontSize: "1.4rem" }}
            aria-pressed={firstIdx === idx}
            onClick={() => selectTile(idx)}
          >
            {t.value}
          </button>
        ))}
      </div>

      <div className="game-mode-tabs" style={{ justifyContent: "center" }} role="group" aria-label="Arithmetic operators">
        {([["+", "+"], ["-", "−"], ["*", "×"], ["/", "÷"]] as [ArithmeticOp, string][]).map(([code, sym]) => (
          <button
            key={code}
            type="button"
            className={`filter-chip ${op === code ? "is-active" : ""}`.trim()}
            aria-pressed={op === code}
            disabled={firstIdx === null}
            onClick={() => {
              setOp(code);
              setMessage(`Operator ${sym} selected. Now pick a second number tile.`);
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      {showHint ? <p className="game-live">{challenge.hint}</p> : null}
      <p className="game-live" role="status" aria-live="polite">{message}</p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>Target {challenge.target} forged!</strong>
          </div>
          {state.challengeIndex < EQUATION_CHALLENGES.length - 1 ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => loadChallenge(state.challengeIndex + 1)}>
              <span>Next target</span>
              <Icon name="arrow-right" size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── 4. TILE SHIFT (SLIDING PUZZLE) ────────────────────────────────────── */
export function TileShiftGame() {
  const [state, setState] = useState(() => createSlideState(3, seededRng(2026)));
  const solved = isSlideSolved(state);

  const switchSize = (size: 3 | 4) => setState(createSlideState(size));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const zero = state.tiles.indexOf(0);
      const zr = Math.floor(zero / state.size);
      const zc = zero % state.size;
      let target = -1;
      if (e.key === "ArrowUp" && zr < state.size - 1) target = (zr + 1) * state.size + zc;
      else if (e.key === "ArrowDown" && zr > 0) target = (zr - 1) * state.size + zc;
      else if (e.key === "ArrowLeft" && zc < state.size - 1) target = zr * state.size + (zc + 1);
      else if (e.key === "ArrowRight" && zc > 0) target = zr * state.size + (zc - 1);
      if (target >= 0) {
        e.preventDefault();
        setState((prev) => slideTileAt(prev, target));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.size, state.tiles]);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Tile Shift board size">
          {([3, 4] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              className={`filter-chip ${state.size === sz ? "is-active" : ""}`.trim()}
              aria-pressed={state.size === sz}
              onClick={() => switchSize(sz)}
            >
              {sz}×{sz} ({sz * sz - 1} tiles)
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => switchSize(state.size)}>
            <Icon name="rotate-ccw" size={15} />
            <span>New shuffle</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Tile Shift progress">
        <div>
          <dt>Moves</dt>
          <dd>{state.moves}</dd>
        </div>
        <div>
          <dt>In place</dt>
          <dd>
            {state.tiles.filter((v, i) => v !== 0 && v === i + 1).length} / {state.size * state.size - 1}
          </dd>
        </div>
        <div>
          <dt>Board</dt>
          <dd>{state.size}×{state.size}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{solved ? "Solved" : "Active"}</dd>
        </div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))`, maxWidth: "340px" }}
        role="grid"
        aria-label={`Tile Shift ${state.size} by ${state.size} sliding board`}
      >
        {state.tiles.map((v, idx) => {
          const inPlace = v !== 0 && v === idx + 1;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              disabled={v === 0}
              className={`game-cell-btn ${inPlace ? "is-visited" : ""}`.trim()}
              style={v === 0 ? { opacity: 0.25, cursor: "default" } : { fontSize: "1.35rem" }}
              aria-label={v === 0 ? "Empty slot" : `Tile ${v}${inPlace ? ", in correct position" : ""}`}
              onClick={() => setState((prev) => slideTileAt(prev, idx))}
            >
              {v === 0 ? "" : v}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `Ordered all ${state.size * state.size - 1} tiles in ${state.moves} moves!`
          : "Click any tile touching the blank space, or use Arrow keys to slide."}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>Solved {state.size}×{state.size} in {state.moves} moves!</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => switchSize(state.size)}>
            <span>Shuffle again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

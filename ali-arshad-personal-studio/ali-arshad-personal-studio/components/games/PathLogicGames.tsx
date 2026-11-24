"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  CIRCUIT_LEVELS,
  KNIGHT_LEVELS,
  LATTICE_PUZZLES,
  MOSAIC_PUZZLES,
  computeCircuitPower,
  createCircuitState,
  createKnightState,
  createLatticeState,
  createSweepState,
  isKnightSolved,
  isLatticeSolved,
  isMosaicSolved,
  latticeConflicts,
  legalKnightMoves,
  mosaicCluesFor,
  pipeMask,
  revealSweepCell,
  rotateCircuitTile,
  setLatticeValue,
  stepKnight,
  toggleSweepFlag,
  undoKnight,
  type PipeKind,
} from "@/lib/games/engines-path-logic";

/* ── 1. CIRCUIT TURN ───────────────────────────────────────────────────── */
function PipeSvg({ kind, rot, powered }: { kind: PipeKind; rot: number; powered: boolean }) {
  const m = pipeMask(kind, rot);
  const stroke = powered ? "#ff7a5c" : "#5a687a";
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden="true" focusable="false">
      {m & 1 ? <line x1="30" y1="0" x2="30" y2="30" stroke={stroke} strokeWidth="9" strokeLinecap="round" /> : null}
      {m & 2 ? <line x1="30" y1="30" x2="60" y2="30" stroke={stroke} strokeWidth="9" strokeLinecap="round" /> : null}
      {m & 4 ? <line x1="30" y1="30" x2="30" y2="60" stroke={stroke} strokeWidth="9" strokeLinecap="round" /> : null}
      {m & 8 ? <line x1="0" y1="30" x2="30" y2="30" stroke={stroke} strokeWidth="9" strokeLinecap="round" /> : null}
      {m !== 0 ? <circle cx="30" cy="30" r="6" fill={powered ? "#ff947a" : "#708196"} /> : null}
    </svg>
  );
}

export function CircuitTurnGame() {
  const [state, setState] = useState(() => createCircuitState(0));
  const level = CIRCUIT_LEVELS[state.levelIndex];
  const { powered, solved } = computeCircuitPower(level, state.rots);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Circuit Turn boards">
          {CIRCUIT_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              className={`filter-chip ${state.levelIndex === idx ? "is-active" : ""}`.trim()}
              aria-pressed={state.levelIndex === idx}
              onClick={() => setState(createCircuitState(idx))}
            >
              {lvl.name}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setState(createCircuitState(state.levelIndex))}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Circuit status">
        <div>
          <dt>Powered tiles</dt>
          <dd>{powered.size}</dd>
        </div>
        <div>
          <dt>Turns</dt>
          <dd>{state.moves}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>Row {level.sourceRow + 1} (L)</dd>
        </div>
        <div>
          <dt>Sink</dt>
          <dd>Row {level.sinkRow + 1} (R)</dd>
        </div>
      </dl>

      <div className="circuit-wrap">
        <span className="circuit-terminal">SRC R{level.sourceRow + 1} →</span>
        <div
          className="game-board-grid"
          style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`Circuit Turn ${level.size} by ${level.size} conduit grid`}
        >
          {level.tiles.map((t, idx) => {
            const r = Math.floor(idx / level.size) + 1;
            const c = (idx % level.size) + 1;
            const lit = powered.has(idx);
            return (
              <button
                key={idx}
                type="button"
                role="gridcell"
                className={`game-cell-btn ${lit ? "is-powered" : ""}`.trim()}
                disabled={t.kind === "empty"}
                aria-label={`Row ${r}, Column ${c}, ${t.kind} conduit${lit ? ", powered" : ""}`}
                onClick={() => setState((prev) => rotateCircuitTile(prev, idx))}
              >
                <PipeSvg kind={t.kind} rot={state.rots[idx]} powered={lit} />
              </button>
            );
          })}
        </div>
        <span className={`circuit-terminal circuit-terminal--sink ${solved ? "is-lit" : ""}`.trim()}>
          → SINK R{level.sinkRow + 1}
        </span>
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `Circuit complete in ${state.moves} rotations!`
          : `Click any conduit tile to rotate 90° clockwise. Route live coral power from Row ${level.sourceRow + 1} (left) to Row ${level.sinkRow + 1} (right).`}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>{level.name} powered cleanly in {state.moves} turns!</strong>
          </div>
          <div className="game-complete__actions">
            {state.levelIndex < CIRCUIT_LEVELS.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setState(createCircuitState(state.levelIndex + 1))}
              >
                <span>Next circuit</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setState(createCircuitState(state.levelIndex))}
            >
              <span>Replay</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── 2. KNIGHT RELAY ───────────────────────────────────────────────────── */
export function KnightRelayGame() {
  const [state, setState] = useState(() => createKnightState(0));
  const level = KNIGHT_LEVELS[state.levelIndex];
  const legal = legalKnightMoves(state);
  const current = state.trail[state.trail.length - 1];
  const beacons = level.solution.slice(1);
  const collected = beacons.filter((b) => state.trail.includes(b)).length;
  const solved = isKnightSolved(state);
  const stuck = !solved && legal.length === 0;

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Knight Relay boards">
          {KNIGHT_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              className={`filter-chip ${state.levelIndex === idx ? "is-active" : ""}`.trim()}
              aria-pressed={state.levelIndex === idx}
              onClick={() => setState(createKnightState(idx))}
            >
              {lvl.name}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={state.trail.length <= 1}
            onClick={() => setState(undoKnight)}
          >
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setState(createKnightState(state.levelIndex))}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Knight Relay telemetry">
        <div>
          <dt>Beacons</dt>
          <dd>{collected} / {beacons.length}</dd>
        </div>
        <div>
          <dt>Jumps</dt>
          <dd>{state.trail.length - 1}</dd>
        </div>
        <div>
          <dt>Legal moves</dt>
          <dd>{legal.length}</dd>
        </div>
        <div>
          <dt>Board</dt>
          <dd>{level.size}×{level.size}</dd>
        </div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Knight Relay ${level.size} by ${level.size} grid`}
      >
        {Array.from({ length: level.size * level.size }, (_, idx) => {
          const isCur = idx === current;
          const visitPos = state.trail.indexOf(idx);
          const isBeacon = beacons.includes(idx);
          const isLegal = legal.includes(idx);
          const r = Math.floor(idx / level.size) + 1;
          const c = (idx % level.size) + 1;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              disabled={!isLegal}
              className={`game-cell-btn ${isCur ? "is-powered is-selected" : ""} ${visitPos >= 0 && !isCur ? "is-visited" : ""} ${isBeacon && visitPos < 0 ? "is-beacon" : ""} ${isLegal ? "is-legal" : ""}`.trim()}
              aria-label={`Row ${r}, Col ${c}${isCur ? ", current relay position" : isBeacon && visitPos < 0 ? ", target beacon" : ""}${isLegal ? ", legal jump" : ""}`}
              onClick={() => setState((prev) => stepKnight(prev, idx))}
            >
              {isCur ? "◆" : visitPos >= 0 ? visitPos : isBeacon ? "★" : isLegal ? "·" : ""}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `All ${beacons.length} beacons captured in ${state.trail.length - 1} jumps!`
          : stuck
            ? "No legal knight jumps remain. Use Undo or Restart to try another route."
            : "Jump to any cyan highlighted square in an L-shape to capture all ★ amber beacons."}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>{level.name} cleared in {state.trail.length - 1} jumps!</strong>
          </div>
          <div className="game-complete__actions">
            {state.levelIndex < KNIGHT_LEVELS.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setState(createKnightState(state.levelIndex + 1))}
              >
                <span>Next board</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setState(createKnightState(state.levelIndex))}
            >
              <span>Replay</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── 3. MINI LATTICE (4x4 & 6x6 SUDOKU) ────────────────────────────────── */
export function MiniLatticeGame() {
  const [state, setState] = useState(() => createLatticeState(0));
  const puzzle = LATTICE_PUZZLES[state.puzzleIndex];
  const conflicts = latticeConflicts(puzzle, state.values);
  const solved = isLatticeSolved(puzzle, state.values);
  const emptyCount = state.values.filter((v) => v === 0).length;

  const enterVal = (val: number) => {
    if (state.selected === null) return;
    setState((prev) => setLatticeValue(prev, prev.selected!, val));
  };

  const applyHint = () => {
    const emptyIdx = state.values.findIndex((v, i) => v !== puzzle.solution[i]);
    if (emptyIdx === -1) return;
    setState((prev) => ({
      ...setLatticeValue(prev, emptyIdx, puzzle.solution[emptyIdx]),
      selected: emptyIdx,
    }));
  };

  const onCellKey = (idx: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= puzzle.size) {
      e.preventDefault();
      setState((prev) => setLatticeValue({ ...prev, selected: idx }, idx, n));
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault();
      setState((prev) => setLatticeValue({ ...prev, selected: idx }, idx, 0));
    }
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Mini Lattice puzzles">
          {LATTICE_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`filter-chip ${state.puzzleIndex === idx ? "is-active" : ""}`.trim()}
              aria-pressed={state.puzzleIndex === idx}
              onClick={() => setState(createLatticeState(idx))}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button type="button" className="btn btn--secondary btn--sm" disabled={solved} onClick={applyHint}>
            <Icon name="lightbulb" size={15} />
            <span>Hint</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setState(createLatticeState(state.puzzleIndex))}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Mini Lattice progress">
        <div>
          <dt>Empty cells</dt>
          <dd>{emptyCount}</dd>
        </div>
        <div>
          <dt>Conflicts</dt>
          <dd>{conflicts.size}</dd>
        </div>
        <div>
          <dt>Entries</dt>
          <dd>{state.moves}</dd>
        </div>
        <div>
          <dt>Grid</dt>
          <dd>{puzzle.size}×{puzzle.size}</dd>
        </div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Mini Lattice ${puzzle.size} by ${puzzle.size} deduction board`}
      >
        {state.values.map((v, idx) => {
          const isGiven = puzzle.givens[idx] !== 0;
          const isSel = state.selected === idx;
          const isBad = conflicts.has(idx);
          const r = Math.floor(idx / puzzle.size) + 1;
          const c = (idx % puzzle.size) + 1;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              className={`game-cell-btn ${isGiven ? "is-given" : ""} ${isSel ? "is-selected" : ""} ${isBad ? "is-conflict" : ""}`.trim()}
              aria-label={`Row ${r}, Col ${c}, ${v === 0 ? "empty" : `value ${v}`}${isGiven ? " (fixed)" : ""}${isBad ? ", conflict" : ""}`}
              onClick={() => setState((prev) => ({ ...prev, selected: idx }))}
              onKeyDown={(e) => onCellKey(idx, e)}
            >
              {v === 0 ? "" : v}
            </button>
          );
        })}
      </div>

      <div className="game-mode-tabs" style={{ justifyContent: "center" }} role="group" aria-label="Number keypad">
        {Array.from({ length: puzzle.size }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className="btn btn--secondary btn--sm" onClick={() => enterVal(n)}>
            <span>{n}</span>
          </button>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => enterVal(0)}>
          <span>Clear</span>
        </button>
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `Lattice solved cleanly in ${state.moves} entries!`
          : conflicts.size > 0
            ? `${conflicts.size} conflicting cell(s) detected in matching rows, columns, or sub-boxes.`
            : `Select an empty square and press 1–${puzzle.size} to fill.`}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>{puzzle.name} solved cleanly!</strong>
          </div>
          <div className="game-complete__actions">
            {state.puzzleIndex < LATTICE_PUZZLES.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setState(createLatticeState(state.puzzleIndex + 1))}
              >
                <span>Next lattice</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setState(createLatticeState(state.puzzleIndex))}
            >
              <span>Replay</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── 4. MOSAIC CLUES (5x5 NONOGRAM) ────────────────────────────────────── */
export function MosaicCluesGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [marks, setMarks] = useState<(0 | 1 | 2)[]>(() => Array(25).fill(0));
  const [mode, setMode] = useState<"fill" | "cross">("fill");
  const [moves, setMoves] = useState(0);

  const puzzle = MOSAIC_PUZZLES[puzzleIdx];
  const targetClues = mosaicCluesFor(puzzle.pattern, 5);
  const currentClues = mosaicCluesFor(marks.map((m) => (m === 1 ? 1 : 0)), 5);
  const solved = isMosaicSolved(puzzle, marks);

  const loadPuzzle = (idx: number) => {
    setPuzzleIdx(idx);
    setMarks(Array(25).fill(0));
    setMoves(0);
  };

  const toggleCell = (idx: number, forceCross = false) => {
    const tool = forceCross ? "cross" : mode;
    setMarks((prev) => {
      const next = prev.slice();
      if (tool === "fill") next[idx] = next[idx] === 1 ? 0 : 1;
      else next[idx] = next[idx] === 2 ? 0 : 2;
      return next;
    });
    setMoves((m) => m + 1);
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Mosaic Clues puzzles">
          {MOSAIC_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`filter-chip ${puzzleIdx === idx ? "is-active" : ""}`.trim()}
              aria-pressed={puzzleIdx === idx}
              onClick={() => loadPuzzle(idx)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className={`filter-chip ${mode === "fill" ? "is-active" : ""}`.trim()}
            aria-pressed={mode === "fill"}
            onClick={() => setMode("fill")}
          >
            Fill (■)
          </button>
          <button
            type="button"
            className={`filter-chip ${mode === "cross" ? "is-active" : ""}`.trim()}
            aria-pressed={mode === "cross"}
            onClick={() => setMode("cross")}
          >
            Mark blank (×)
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadPuzzle(puzzleIdx)}>
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <div className="mosaic-grid" role="grid" aria-label={`Mosaic Clues 5 by 5 nonogram (${puzzle.name})`}>
        <div aria-hidden="true" />
        {targetClues.cols.map((clue, c) => {
          const done = JSON.stringify(clue) === JSON.stringify(currentClues.cols[c]);
          return (
            <div key={`c-${c}`} className={`mosaic-clue ${done ? "is-done" : ""}`.trim()}>
              {clue.join(" ")}
            </div>
          );
        })}

        {Array.from({ length: 5 }, (_, r) => {
          const rowDone = JSON.stringify(targetClues.rows[r]) === JSON.stringify(currentClues.rows[r]);
          return (
            <div key={`row-${r}`} style={{ display: "contents" }}>
              <div className={`mosaic-clue ${rowDone ? "is-done" : ""}`.trim()}>
                {targetClues.rows[r].join(" ")}
              </div>
              {Array.from({ length: 5 }, (_, c) => {
                const idx = r * 5 + c;
                const val = marks[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    role="gridcell"
                    className={`game-cell-btn ${val === 1 ? "is-filled" : ""}`.trim()}
                    aria-pressed={val === 1}
                    aria-label={`Row ${r + 1}, Col ${c + 1}, ${val === 1 ? "filled" : val === 2 ? "marked empty" : "blank"}`}
                    onClick={() => toggleCell(idx, false)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleCell(idx, true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "x") {
                        e.preventDefault();
                        toggleCell(idx, true);
                      }
                    }}
                  >
                    {val === 1 ? "■" : val === 2 ? "×" : ""}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `Revealed ${puzzle.name} in ${moves} clicks!`
          : "Match all 5 row and 5 column run-length clues. Right-click or press X to mark confirmed empty squares."}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>Pattern solved: {puzzle.name}!</strong>
          </div>
          <div className="game-complete__actions">
            {puzzleIdx < MOSAIC_PUZZLES.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => loadPuzzle(puzzleIdx + 1)}
              >
                <span>Next pattern</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadPuzzle(puzzleIdx)}>
              <span>Replay</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── 5. HAZARD SWEEP ───────────────────────────────────────────────────── */
export function HazardSweepGame() {
  const [mode, setMode] = useState<"compact" | "standard">("compact");
  const [flagMode, setFlagMode] = useState(false);
  const [state, setState] = useState(() => createSweepState(6, 6));

  const switchMode = (nextMode: "compact" | "standard") => {
    setMode(nextMode);
    setState(nextMode === "compact" ? createSweepState(6, 6) : createSweepState(8, 10));
  };

  const flagsUsed = state.cells.filter((c) => c.flagged).length;
  const safeLeft = state.cells.filter((c) => !c.mine && !c.revealed).length;

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Hazard Sweep board size">
          <button
            type="button"
            className={`filter-chip ${mode === "compact" ? "is-active" : ""}`.trim()}
            aria-pressed={mode === "compact"}
            onClick={() => switchMode("compact")}
          >
            Compact (6×6 · 6 hazards)
          </button>
          <button
            type="button"
            className={`filter-chip ${mode === "standard" ? "is-active" : ""}`.trim()}
            aria-pressed={mode === "standard"}
            onClick={() => switchMode("standard")}
          >
            Standard (8×8 · 10 hazards)
          </button>
        </div>
        <div className="game-actions">
          <button
            type="button"
            className={`filter-chip ${flagMode ? "is-active" : ""}`.trim()}
            aria-pressed={flagMode}
            onClick={() => setFlagMode((f) => !f)}
          >
            Flag mode: {flagMode ? "ON" : "OFF"}
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => switchMode(mode)}>
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Hazard Sweep telemetry">
        <div>
          <dt>Hazards</dt>
          <dd>{state.mineCount}</dd>
        </div>
        <div>
          <dt>Flags placed</dt>
          <dd>{flagsUsed}</dd>
        </div>
        <div>
          <dt>Safe remaining</dt>
          <dd>{state.initialized ? safeLeft : state.size * state.size - state.mineCount}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{state.status === "won" ? "Cleared" : state.status === "lost" ? "Triggered" : "Active"}</dd>
        </div>
      </dl>

      <div
        className="game-board-grid"
        style={{
          gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))`,
          width: state.size === 8 ? "min(100%, 460px)" : "min(100%, 380px)",
        }}
        role="grid"
        aria-label={`Hazard Sweep ${state.size} by ${state.size} grid`}
      >
        {state.cells.map((cell, idx) => {
          const r = Math.floor(idx / state.size) + 1;
          const c = (idx % state.size) + 1;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              className={`game-cell-btn ${cell.revealed ? (cell.mine ? "is-mine" : "is-given") : ""} ${cell.flagged && !cell.revealed ? "is-beacon" : ""}`.trim()}
              aria-label={`Row ${r}, Col ${c}, ${cell.revealed ? (cell.mine ? "hazard" : `revealed ${cell.adjacent}`) : cell.flagged ? "flagged" : "hidden"}`}
              onClick={() =>
                setState((prev) => (flagMode ? toggleSweepFlag(prev, idx) : revealSweepCell(prev, idx)))
              }
              onContextMenu={(e) => {
                e.preventDefault();
                setState((prev) => toggleSweepFlag(prev, idx));
              }}
              onKeyDown={(e) => {
                if (e.key.toLowerCase() === "f") {
                  e.preventDefault();
                  setState((prev) => toggleSweepFlag(prev, idx));
                }
              }}
            >
              {cell.revealed ? (cell.mine ? "✹" : cell.adjacent > 0 ? cell.adjacent : "") : cell.flagged ? "⚑" : ""}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {state.status === "won"
          ? "Board cleared! Every safe cell revealed."
          : state.status === "lost"
            ? "Hazard triggered. Press Restart to launch a fresh board."
            : "First click is always guaranteed safe. Right-click, press F, or toggle Flag Mode to mark hazards."}
      </p>

      {state.status === "won" || state.status === "lost" ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name={state.status === "won" ? "check" : "alert"} size={20} />
            <strong>{state.status === "won" ? "All safe cells cleared!" : "Hazard hit — try another run."}</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => switchMode(mode)}>
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

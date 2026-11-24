"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  SIGNAL_LEVELS,
  clearSignalPair,
  countConnectedPairs,
  coverageStats,
  createSignalState,
  endpointAt,
  extendSignalPath,
  isPairConnected,
  isSignalLevelSolved,
  pathOwnerAt,
  sameCoord,
  selectSignalCell,
  undoActiveSignalStep,
  type Coord,
  type SignalState,
} from "@/lib/games/signal-link";

export function SignalLinkGame() {
  const [state, setState] = useState<SignalState>(() => createSignalState(0));
  const [dragging, setDragging] = useState(false);
  const [focusCoord, setFocusCoord] = useState<Coord>({ row: 0, col: 0 });
  const [statusMessage, setStatusMessage] = useState(
    "Relay 5×5 loaded. Select any lettered node to start routing a signal wire.",
  );
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const level = SIGNAL_LEVELS[state.levelIndex];
  const connected = countConnectedPairs(level, state.paths);
  const coverage = coverageStats(level, state.paths);
  const solved = isSignalLevelSolved(level, state.paths);
  const activePair = state.activePairId ? level.pairs.find((p) => p.id === state.activePairId) : undefined;

  useEffect(() => {
    const stopDrag = () => setDragging(false);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, []);

  const switchLevel = useCallback((idx: number) => {
    const next = createSignalState(idx);
    setState(next);
    setDragging(false);
    setFocusCoord({ row: 0, col: 0 });
    setStatusMessage(`${SIGNAL_LEVELS[next.levelIndex].name} loaded. Connect all ${SIGNAL_LEVELS[next.levelIndex].pairs.length} pairs.`);
  }, []);

  const resetLevel = useCallback(() => {
    setState(createSignalState(state.levelIndex));
    setDragging(false);
    setStatusMessage(`Reset ${level.name}.`);
  }, [level.name, state.levelIndex]);

  const handleCellActivate = useCallback(
    (coord: Coord) => {
      setState((prev) => {
        const next = selectSignalCell(prev, coord);
        const lvl = SIGNAL_LEVELS[next.levelIndex];
        const nextConnected = countConnectedPairs(lvl, next.paths);
        if (isSignalLevelSolved(lvl, next.paths)) {
          const cov = coverageStats(lvl, next.paths);
          setStatusMessage(
            `Level complete! All ${lvl.pairs.length} signal pairs linked (${cov.percent}% grid routed) in ${next.moves} moves.`,
          );
        } else if (next.activePairId) {
          const p = lvl.pairs.find((item) => item.id === next.activePairId);
          setStatusMessage(
            `Routing pair ${p?.id ?? next.activePairId} (${p?.label ?? ""}). ${nextConnected} of ${lvl.pairs.length} pairs linked.`,
          );
        } else if (nextConnected > countConnectedPairs(lvl, prev.paths)) {
          setStatusMessage(`Pair linked! ${nextConnected} of ${lvl.pairs.length} pairs connected.`);
        }
        return next;
      });
    },
    [],
  );

  const handlePointerDown = (coord: Coord, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    setFocusCoord(coord);
    setDragging(true);
    handleCellActivate(coord);
  };

  const handlePointerEnter = (coord: Coord) => {
    if (!dragging) return;
    setState((prev) => {
      const next = extendSignalPath(prev, coord);
      if (next !== prev) {
        const lvl = SIGNAL_LEVELS[next.levelIndex];
        if (isSignalLevelSolved(lvl, next.paths)) {
          const cov = coverageStats(lvl, next.paths);
          setStatusMessage(
            `Level complete! All ${lvl.pairs.length} signal pairs linked (${cov.percent}% grid routed) in ${next.moves} moves.`,
          );
        }
      }
      return next;
    });
  };

  const handleBoardPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || e.pointerType === "mouse") return;
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cellEl = target?.closest<HTMLElement>("[data-row][data-col]");
    if (!cellEl) return;
    const r = Number(cellEl.dataset.row);
    const c = Number(cellEl.dataset.col);
    if (Number.isInteger(r) && Number.isInteger(c)) {
      handlePointerEnter({ row: r, col: c });
    }
  };

  const focusCell = (row: number, col: number) => {
    const clampedRow = Math.max(0, Math.min(level.size - 1, row));
    const clampedCol = Math.max(0, Math.min(level.size - 1, col));
    setFocusCoord({ row: clampedRow, col: clampedCol });
    cellRefs.current[`${clampedRow},${clampedCol}`]?.focus();
  };

  const handleKeyDown = (coord: Coord, e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(coord.row - 1, coord.col);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(coord.row + 1, coord.col);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCell(coord.row, coord.col - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCell(coord.row, coord.col + 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellActivate(coord);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setState((prev) => undoActiveSignalStep(prev));
      setStatusMessage("Undid last wire step.");
    } else if (e.key === "Escape") {
      e.preventDefault();
      setState((prev) => ({ ...prev, activePairId: null }));
      setStatusMessage("Deselected active signal pair.");
    }
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Select Signal Link board size">
          {SIGNAL_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              className={`filter-chip ${state.levelIndex === idx ? "is-active" : ""}`.trim()}
              aria-pressed={state.levelIndex === idx}
              onClick={() => switchLevel(idx)}
            >
              {lvl.name}
            </button>
          ))}
        </div>

        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState((prev) => undoActiveSignalStep(prev));
              setStatusMessage("Undid last step.");
            }}
            disabled={!state.activePairId}
          >
            <span>Undo step</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              if (!state.activePairId) return;
              const id = state.activePairId;
              setState((prev) => clearSignalPair(prev, id));
              setStatusMessage(`Cleared wire ${id}.`);
            }}
            disabled={!state.activePairId}
          >
            <span>Clear pair</span>
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={resetLevel}>
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Game progress">
        <div>
          <dt>Pairs linked</dt>
          <dd>
            {connected} / {level.pairs.length}
          </dd>
        </div>
        <div>
          <dt>Grid routed</dt>
          <dd>{coverage.percent}%</dd>
        </div>
        <div>
          <dt>Active pair</dt>
          <dd>{activePair ? `${activePair.id} · ${activePair.label}` : "None"}</dd>
        </div>
        <div>
          <dt>Steps</dt>
          <dd>{state.moves}</dd>
        </div>
      </dl>

      <div className="signal-board-wrap">
        <div
          className="signal-board"
          style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`Signal Link ${level.size} by ${level.size} puzzle grid`}
          onPointerMove={handleBoardPointerMove}
        >
          {/* SVG wire overlay positioned cleanly behind endpoints */}
          <svg
            className="signal-board__wires"
            viewBox={`0 0 ${level.size * 100} ${level.size * 100}`}
            aria-hidden="true"
            focusable="false"
          >
            {level.pairs.map((pair) => {
              const cells = state.paths[pair.id] ?? [];
              if (cells.length < 2) return null;
              const points = cells.map((c) => `${c.col * 100 + 50},${c.row * 100 + 50}`).join(" ");
              const complete = isPairConnected(level, state.paths, pair.id);
              return (
                <polyline
                  key={pair.id}
                  points={points}
                  fill="none"
                  stroke={pair.color}
                  strokeWidth={complete ? 22 : 18}
                  strokeOpacity={complete ? 0.92 : 0.72}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>

          {Array.from({ length: level.size * level.size }, (_, i) => {
            const row = Math.floor(i / level.size);
            const col = i % level.size;
            const coord = { row, col };
            const ep = endpointAt(level, coord);
            const owner = pathOwnerAt(state.paths, coord);
            const ownerPair = owner ? level.pairs.find((p) => p.id === owner.pairId) : undefined;
            const activePath = state.activePairId ? state.paths[state.activePairId] ?? [] : [];
            const isTip = activePath.length > 0 && sameCoord(activePath[activePath.length - 1], coord);
            const isFocused = focusCoord.row === row && focusCoord.col === col;

            const cellDescription = ep
              ? `Row ${row + 1}, Column ${col + 1}, signal node ${ep.id} (${ep.label})${isPairConnected(level, state.paths, ep.id) ? ", connected" : ""}`
              : ownerPair
                ? `Row ${row + 1}, Column ${col + 1}, wire for pair ${ownerPair.id}${isTip ? ", active path tip" : ""}`
                : `Row ${row + 1}, Column ${col + 1}, empty cell`;

            return (
              <button
                key={`${row}-${col}`}
                ref={(el) => {
                  cellRefs.current[`${row},${col}`] = el;
                }}
                type="button"
                role="gridcell"
                tabIndex={isFocused ? 0 : -1}
                data-row={row}
                data-col={col}
                className={`signal-cell ${ep ? "is-endpoint" : ""} ${isTip ? "is-tip" : ""} ${ownerPair ? "is-wired" : ""}`.trim()}
                aria-label={cellDescription}
                onPointerDown={(e) => handlePointerDown(coord, e)}
                onPointerEnter={() => handlePointerEnter(coord)}
                onKeyDown={(e) => handleKeyDown(coord, e)}
              >
                {ep ? (
                  <span
                    className={`signal-node ${state.activePairId === ep.id ? "is-selected" : ""}`.trim()}
                    style={{ backgroundColor: ep.color, color: ep.textColor }}
                  >
                    {ep.id}
                  </span>
                ) : isTip && ownerPair ? (
                  <span className="signal-tip" style={{ borderColor: ownerPair.color }} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {statusMessage}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>
              {level.name} solved — {level.pairs.length}/{level.pairs.length} pairs linked
              {coverage.percent === 100 ? " · Perfect 100% grid" : ` · ${coverage.percent}% grid routed`}
            </strong>
          </div>
          <div className="game-complete__actions">
            {state.levelIndex < SIGNAL_LEVELS.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => switchLevel(state.levelIndex + 1)}
              >
                <span>Next board ({SIGNAL_LEVELS[state.levelIndex + 1].name})</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : null}
            <button type="button" className="btn btn--secondary btn--sm" onClick={resetLevel}>
              <span>Replay board</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

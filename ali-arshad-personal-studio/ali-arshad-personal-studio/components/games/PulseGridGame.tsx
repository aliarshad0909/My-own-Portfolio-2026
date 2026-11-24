"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  PULSE_PRESETS,
  countActivePulseCells,
  createPulsePreset,
  generateRandomPulseState,
  isPulseSolved,
  requestPulseHint,
  restartPulseState,
  togglePulseCell,
  undoPulseMove,
  type PulseBoardSize,
  type PulseState,
} from "@/lib/games/pulse-grid";

export function PulseGridGame() {
  const [state, setState] = useState<PulseState>(() => createPulsePreset(PULSE_PRESETS[0].id));
  const [focusIndex, setFocusIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Starter 3×3 board loaded. Clear every active coral alert node.",
  );
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeCount = countActivePulseCells(state.cells);
  const solved = isPulseSolved(state);

  const loadPreset = (presetId: string) => {
    const next = createPulsePreset(presetId);
    const meta = PULSE_PRESETS.find((p) => p.id === presetId);
    setState(next);
    setFocusIndex(0);
    setStatusMessage(`${meta?.label ?? "Board"} loaded. ${countActivePulseCells(next.cells)} active alerts remaining.`);
  };

  const loadShuffle = (size: PulseBoardSize) => {
    const next = generateRandomPulseState(size);
    setState(next);
    setFocusIndex(0);
    setStatusMessage(
      `Generated new guaranteed-solvable ${size}×${size} shuffle (${countActivePulseCells(next.cells)} active alerts, par ${next.par}).`,
    );
  };

  const handleToggle = (idx: number) => {
    setFocusIndex(idx);
    setState((prev) => {
      const next = togglePulseCell(prev, idx);
      const rem = countActivePulseCells(next.cells);
      const r = Math.floor(idx / next.size) + 1;
      const c = (idx % next.size) + 1;
      if (rem === 0) {
        setStatusMessage(`Grid cleared in ${next.moves} moves (par ${next.par})!`);
      } else {
        setStatusMessage(`Toggled row ${r}, column ${c}. ${rem} active alert${rem === 1 ? "" : "s"} remaining.`);
      }
      return next;
    });
  };

  const focusTile = (nextIdx: number) => {
    setFocusIndex(nextIdx);
    tileRefs.current[nextIdx]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const row = Math.floor(idx / state.size);
    const col = idx % state.size;
    if (e.key === "ArrowUp" && row > 0) {
      e.preventDefault();
      focusTile((row - 1) * state.size + col);
    } else if (e.key === "ArrowDown" && row < state.size - 1) {
      e.preventDefault();
      focusTile((row + 1) * state.size + col);
    } else if (e.key === "ArrowLeft" && col > 0) {
      e.preventDefault();
      focusTile(row * state.size + (col - 1));
    } else if (e.key === "ArrowRight" && col < state.size - 1) {
      e.preventDefault();
      focusTile(row * state.size + (col + 1));
    }
  };

  const currentPresetIdx = PULSE_PRESETS.findIndex((p) => p.id === state.presetId);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Select Pulse Grid curated board">
          {PULSE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`filter-chip ${state.presetId === preset.id ? "is-active" : ""}`.trim()}
              aria-pressed={state.presetId === preset.id}
              onClick={() => loadPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="game-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState((prev) => {
                const next = requestPulseHint(prev);
                if (next.hintIndex !== null) {
                  const r = Math.floor(next.hintIndex / next.size) + 1;
                  const c = (next.hintIndex % next.size) + 1;
                  setStatusMessage(`Hint: try toggling row ${r}, column ${c}.`);
                }
                return next;
              });
            }}
            disabled={solved}
          >
            <Icon name="lightbulb" size={15} />
            <span>Hint</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState((prev) => undoPulseMove(prev));
              setStatusMessage("Undid previous move.");
            }}
            disabled={state.history.length === 0}
          >
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState((prev) => restartPulseState(prev));
              setStatusMessage("Board reset to starting pattern.");
            }}
          >
            <Icon name="rotate-ccw" size={15} />
            <span>Restart</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => loadShuffle(state.size)}
          >
            <span>New {state.size}×{state.size} shuffle</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Pulse Grid telemetry">
        <div>
          <dt>Active alerts</dt>
          <dd>{activeCount}</dd>
        </div>
        <div>
          <dt>Moves</dt>
          <dd>{state.moves}</dd>
        </div>
        <div>
          <dt>Par target</dt>
          <dd>{state.par}</dd>
        </div>
        <div>
          <dt>Grid size</dt>
          <dd>
            {state.size}×{state.size}
          </dd>
        </div>
      </dl>

      <div className="pulse-board-wrap">
        <div
          className="pulse-board"
          style={{ gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`Pulse Grid ${state.size} by ${state.size} logic puzzle`}
        >
          {state.cells.map((active, idx) => {
            const row = Math.floor(idx / state.size) + 1;
            const col = (idx % state.size) + 1;
            const isHint = state.hintIndex === idx;
            return (
              <button
                key={idx}
                ref={(el) => {
                  tileRefs.current[idx] = el;
                }}
                type="button"
                role="gridcell"
                tabIndex={focusIndex === idx ? 0 : -1}
                className={`pulse-tile ${active ? "is-active" : "is-clear"} ${isHint ? "is-hint" : ""}`.trim()}
                aria-pressed={active}
                aria-label={`Row ${row}, Column ${col}, ${active ? "alert active" : "cleared"}${isHint ? ", suggested hint" : ""}`}
                onClick={() => handleToggle(idx)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              >
                <span className="pulse-tile__core" aria-hidden="true">
                  {active ? "×" : "·"}
                </span>
                {isHint ? <span className="pulse-tile__hint-tag">Hint</span> : null}
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
              All alerts cleared in {state.moves} moves{" "}
              {state.moves <= state.par ? `(met or beat par ${state.par}!)` : `(par ${state.par})`}
            </strong>
          </div>
          <div className="game-complete__actions">
            {currentPresetIdx >= 0 && currentPresetIdx < PULSE_PRESETS.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => loadPreset(PULSE_PRESETS[currentPresetIdx + 1].id)}
              >
                <span>Next board ({PULSE_PRESETS[currentPresetIdx + 1].label})</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => loadShuffle(state.size)}
              >
                <span>Play a fresh {state.size}×{state.size} shuffle</span>
                <Icon name="arrow-right" size={15} />
              </button>
            )}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setState((prev) => restartPulseState(prev))}
            >
              <span>Replay board</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

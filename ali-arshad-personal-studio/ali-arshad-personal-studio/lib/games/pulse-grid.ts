/**
 * Pure domain engine for Pulse Grid — an original orthogonal parity logic puzzle.
 *
 * Every board (curated or shuffled) is constructed by applying a known set of
 * unique toggles to an all-clear grid. Because GF(2) toggling is commutative
 * and self-inverse, every board is 100% mathematically guaranteed solvable, and
 * tracking the XOR delta against the target toggle set provides an exact hint
 * at any moment during play.
 */

export type PulseBoardSize = 3 | 4 | 5;

export type PulsePreset = {
  id: string;
  label: string;
  size: PulseBoardSize;
  /** Distinct cell indices (row * size + col) toggled from an all-off grid. */
  seedToggles: number[];
};

export type PulseState = {
  size: PulseBoardSize;
  presetId: string;
  /** True means alert node is currently active (needs clearing). */
  cells: boolean[];
  /** Current remaining guaranteed-valid toggles to reach all-false. */
  remainingSolution: number[];
  /** Starting cell snapshot for clean Restart. */
  initialCells: boolean[];
  initialSolution: number[];
  par: number;
  moves: number;
  history: number[];
  hintIndex: number | null;
};

export const PULSE_PRESETS: PulsePreset[] = [
  { id: "3x3-cross", label: "Starter 3×3 · Relay", size: 3, seedToggles: [0, 4, 8] },
  { id: "3x3-corners", label: "Starter 3×3 · Edges", size: 3, seedToggles: [1, 3, 5, 7] },
  { id: "4x4-bridge", label: "Standard 4×4 · Bridge", size: 4, seedToggles: [0, 5, 10, 15, 3] },
  { id: "4x4-cluster", label: "Standard 4×4 · Cluster", size: 4, seedToggles: [1, 2, 6, 9, 13, 14] },
  { id: "5x5-core", label: "Challenge 5×5 · Core", size: 5, seedToggles: [0, 4, 12, 20, 24, 7, 17] },
  { id: "5x5-lattice", label: "Challenge 5×5 · Lattice", size: 5, seedToggles: [1, 6, 8, 12, 16, 18, 23] },
];

export function affectedIndices(size: number, index: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const out = [index];
  if (row > 0) out.push((row - 1) * size + col);
  if (row < size - 1) out.push((row + 1) * size + col);
  if (col > 0) out.push(row * size + (col - 1));
  if (col < size - 1) out.push(row * size + (col + 1));
  return out;
}

export function applyToggleRaw(cells: boolean[], size: number, index: number): boolean[] {
  const next = cells.slice();
  for (const idx of affectedIndices(size, index)) {
    next[idx] = !next[idx];
  }
  return next;
}

function xorToggle(list: number[], index: number): number[] {
  return list.includes(index) ? list.filter((i) => i !== index) : [...list, index];
}

export function createPulseStateFromToggles(
  size: PulseBoardSize,
  toggles: number[],
  presetId = "custom",
): PulseState {
  const uniqueToggles = [...new Set(toggles.filter((i) => i >= 0 && i < size * size))];
  let cells = Array<boolean>(size * size).fill(false);
  for (const idx of uniqueToggles) {
    cells = applyToggleRaw(cells, size, idx);
  }
  return {
    size,
    presetId,
    cells,
    remainingSolution: uniqueToggles,
    initialCells: cells.slice(),
    initialSolution: uniqueToggles.slice(),
    par: uniqueToggles.length,
    moves: 0,
    history: [],
    hintIndex: null,
  };
}

export function createPulsePreset(presetId: string): PulseState {
  const preset = PULSE_PRESETS.find((p) => p.id === presetId) ?? PULSE_PRESETS[0];
  return createPulseStateFromToggles(preset.size, preset.seedToggles, preset.id);
}

/**
 * Deterministic-friendly guaranteed-solvable board generator.
 * Accepts an optional RNG function for reproducible tests.
 */
export function generateRandomPulseState(
  size: PulseBoardSize,
  rng: () => number = Math.random,
): PulseState {
  const total = size * size;
  const targetCount = size === 3 ? 4 : size === 4 ? 6 : 7;
  const pool = Array.from({ length: total }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, targetCount);
  const state = createPulseStateFromToggles(size, chosen, `shuffle-${size}x${size}`);
  // Guard against the mathematically improbable all-false result.
  if (countActivePulseCells(state.cells) === 0) {
    return createPulseStateFromToggles(size, [Math.floor(total / 2)], `shuffle-${size}x${size}`);
  }
  return state;
}

export function togglePulseCell(state: PulseState, index: number): PulseState {
  if (index < 0 || index >= state.cells.length) return state;
  return {
    ...state,
    cells: applyToggleRaw(state.cells, state.size, index),
    remainingSolution: xorToggle(state.remainingSolution, index),
    moves: state.moves + 1,
    history: [...state.history, index],
    hintIndex: null,
  };
}

export function undoPulseMove(state: PulseState): PulseState {
  if (state.history.length === 0) return state;
  const last = state.history[state.history.length - 1];
  return {
    ...state,
    cells: applyToggleRaw(state.cells, state.size, last),
    remainingSolution: xorToggle(state.remainingSolution, last),
    moves: Math.max(0, state.moves - 1),
    history: state.history.slice(0, -1),
    hintIndex: null,
  };
}

export function restartPulseState(state: PulseState): PulseState {
  return {
    ...state,
    cells: state.initialCells.slice(),
    remainingSolution: state.initialSolution.slice(),
    moves: 0,
    history: [],
    hintIndex: null,
  };
}

export function requestPulseHint(state: PulseState): PulseState {
  if (isPulseSolved(state) || state.remainingSolution.length === 0) {
    return { ...state, hintIndex: null };
  }
  return { ...state, hintIndex: state.remainingSolution[0] };
}

export function countActivePulseCells(cells: boolean[]): number {
  let n = 0;
  for (const c of cells) if (c) n += 1;
  return n;
}

export function isPulseSolved(state: PulseState): boolean {
  return countActivePulseCells(state.cells) === 0;
}

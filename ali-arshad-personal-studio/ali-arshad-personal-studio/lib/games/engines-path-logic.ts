/**
 * Pure domain engines for Path & Logic games:
 *  - Circuit Turn (rotatable conduit BFS power flow)
 *  - Knight Relay (L-jump beacon tour)
 *  - Mini Lattice (4x4 / 6x6 Latin-square & sub-box deduction)
 *  - Mosaic Clues (5x5 run-length nonogram)
 *  - Hazard Sweep (safe-first-click minesweeper logic)
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. CIRCUIT TURN
   Bits: 1=N, 2=E, 4=S, 8=W
   ═══════════════════════════════════════════════════════════════════════════ */
export type PipeKind = "straight" | "corner" | "tee" | "cross" | "empty";

export type PipeTile = {
  kind: PipeKind;
  /** Clockwise quarter turns 0..3 */
  rot: number;
  fixed?: boolean;
};

export type CircuitLevel = {
  id: string;
  name: string;
  size: number;
  sourceRow: number;
  sinkRow: number;
  /** Solved mask layout — scrambled deterministically via initialRots. */
  tiles: { kind: PipeKind; solvedRot: number; startRot: number }[];
};

const BASE_MASK: Record<PipeKind, number> = {
  empty: 0,
  straight: 2 | 8, // E-W
  corner: 2 | 4, // E-S
  tee: 1 | 2 | 4, // N-E-S
  cross: 1 | 2 | 4 | 8,
};

export function pipeMask(kind: PipeKind, rot: number): number {
  let m = BASE_MASK[kind];
  const r = ((rot % 4) + 4) % 4;
  for (let i = 0; i < r; i += 1) {
    let next = 0;
    if (m & 1) next |= 2;
    if (m & 2) next |= 4;
    if (m & 4) next |= 8;
    if (m & 8) next |= 1;
    m = next;
  }
  return m;
}

export const CIRCUIT_LEVELS: CircuitLevel[] = [
  {
    id: "relay-4x4",
    name: "Relay (4×4)",
    size: 4,
    sourceRow: 1,
    sinkRow: 2,
    // Path: (1,0)E -> (1,1)S -> (2,1)E -> (2,2)N -> (1,2)E -> (1,3)S -> (2,3)E
    tiles: [
      { kind: "corner", solvedRot: 0, startRot: 2 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "corner", solvedRot: 1, startRot: 3 },
      { kind: "empty", solvedRot: 0, startRot: 0 },

      { kind: "straight", solvedRot: 0, startRot: 1 }, // (1,0) W-E
      { kind: "corner", solvedRot: 1, startRot: 0 }, // (1,1) W-S -> rot1 of E-S(2|4)=S-W(4|8)
      { kind: "corner", solvedRot: 0, startRot: 2 }, // (1,2) E-S -> rot0 (2|4)
      { kind: "corner", solvedRot: 1, startRot: 3 }, // (1,3) W-S -> rot1 (4|8)

      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 3, startRot: 1 }, // (2,1) N-E -> rot3 of (2|4)=(1|2)
      { kind: "corner", solvedRot: 2, startRot: 0 }, // (2,2) W-N -> rot2 of (2|4)=(8|1)
      { kind: "corner", solvedRot: 3, startRot: 2 }, // (2,3) N-E -> rot3 (1|2) exits East to sink!

      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "tee", solvedRot: 2, startRot: 0 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "empty", solvedRot: 0, startRot: 0 },
    ],
  },
  {
    id: "junction-4x4",
    name: "Junction (4×4)",
    size: 4,
    sourceRow: 0,
    sinkRow: 3,
    // Path: (0,0)W-E -> (0,1)W-S -> (1,1)N-E -> (1,2)W-S -> (2,2)N-W -> (2,1)E-S -> (3,1)N-E -> (3,2)W-E -> (3,3)W-E
    tiles: [
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "corner", solvedRot: 1, startRot: 3 },
      { kind: "corner", solvedRot: 0, startRot: 2 },
      { kind: "empty", solvedRot: 0, startRot: 0 },

      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 3, startRot: 0 },
      { kind: "corner", solvedRot: 1, startRot: 2 },
      { kind: "straight", solvedRot: 1, startRot: 0 },

      { kind: "corner", solvedRot: 0, startRot: 1 },
      { kind: "corner", solvedRot: 0, startRot: 2 },
      { kind: "corner", solvedRot: 2, startRot: 0 },
      { kind: "empty", solvedRot: 0, startRot: 0 },

      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 3, startRot: 1 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
    ],
  },
  {
    id: "backbone-5x5",
    name: "Backbone (5×5)",
    size: 5,
    sourceRow: 2,
    sinkRow: 1,
    // Path: (2,0)W-E -> (2,1)W-N -> (1,1)S-E -> (1,2)W-S -> (2,2)N-S -> (3,2)N-E -> (3,3)W-N -> (2,3)S-N -> (1,3)S-E -> (1,4)W-E
    tiles: [
      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 0, startRot: 2 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "corner", solvedRot: 1, startRot: 0 },
      { kind: "empty", solvedRot: 0, startRot: 0 },

      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 0, startRot: 2 }, // (1,1) E-S
      { kind: "corner", solvedRot: 1, startRot: 3 }, // (1,2) W-S
      { kind: "corner", solvedRot: 0, startRot: 1 }, // (1,3) E-S
      { kind: "straight", solvedRot: 0, startRot: 1 }, // (1,4) W-E -> Sink!

      { kind: "straight", solvedRot: 0, startRot: 1 }, // (2,0) W-E <- Source
      { kind: "corner", solvedRot: 2, startRot: 0 }, // (2,1) W-N
      { kind: "straight", solvedRot: 1, startRot: 0 }, // (2,2) N-S
      { kind: "straight", solvedRot: 1, startRot: 0 }, // (2,3) N-S
      { kind: "empty", solvedRot: 0, startRot: 0 },

      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "corner", solvedRot: 3, startRot: 1 }, // (3,2) N-E
      { kind: "corner", solvedRot: 2, startRot: 0 }, // (3,3) W-N
      { kind: "corner", solvedRot: 1, startRot: 2 },

      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "tee", solvedRot: 3, startRot: 1 },
      { kind: "straight", solvedRot: 0, startRot: 1 },
      { kind: "empty", solvedRot: 0, startRot: 0 },
      { kind: "empty", solvedRot: 0, startRot: 0 },
    ],
  },
];

export type CircuitState = {
  levelIndex: number;
  rots: number[];
  moves: number;
};

export function createCircuitState(levelIndex = 0): CircuitState {
  const idx = Math.max(0, Math.min(levelIndex, CIRCUIT_LEVELS.length - 1));
  return {
    levelIndex: idx,
    rots: CIRCUIT_LEVELS[idx].tiles.map((t) => t.startRot),
    moves: 0,
  };
}

export function rotateCircuitTile(state: CircuitState, index: number): CircuitState {
  const level = CIRCUIT_LEVELS[state.levelIndex];
  if (index < 0 || index >= level.tiles.length || level.tiles[index].kind === "empty") return state;
  const nextRots = state.rots.slice();
  nextRots[index] = (nextRots[index] + 1) % 4;
  return { ...state, rots: nextRots, moves: state.moves + 1 };
}

export function computeCircuitPower(level: CircuitLevel, rots: number[]): { powered: Set<number>; solved: boolean } {
  const powered = new Set<number>();
  const size = level.size;
  const startIdx = level.sourceRow * size;
  const startMask = pipeMask(level.tiles[startIdx].kind, rots[startIdx]);
  if ((startMask & 8) === 0) return { powered, solved: false }; // Must connect West into source

  const queue = [startIdx];
  powered.add(startIdx);
  const dirs: [dr: number, dc: number, bit: number, opp: number][] = [
    [-1, 0, 1, 4],
    [0, 1, 2, 8],
    [1, 0, 4, 1],
    [0, -1, 8, 2],
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const r = Math.floor(cur / size);
    const c = cur % size;
    const m = pipeMask(level.tiles[cur].kind, rots[cur]);
    for (const [dr, dc, bit, opp] of dirs) {
      if ((m & bit) === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const ni = nr * size + nc;
      if (powered.has(ni)) continue;
      const nm = pipeMask(level.tiles[ni].kind, rots[ni]);
      if ((nm & opp) !== 0) {
        powered.add(ni);
        queue.push(ni);
      }
    }
  }

  const sinkIdx = level.sinkRow * size + (size - 1);
  const sinkMask = pipeMask(level.tiles[sinkIdx].kind, rots[sinkIdx]);
  const solved = powered.has(sinkIdx) && (sinkMask & 2) !== 0; // Must exit East into sink
  return { powered, solved };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. KNIGHT RELAY
   ═══════════════════════════════════════════════════════════════════════════ */
export type KnightLevel = {
  id: string;
  name: string;
  size: number;
  start: number;
  /** Guaranteed-valid sequence of knight steps; every non-start step is a beacon. */
  solution: number[];
};

export const KNIGHT_LEVELS: KnightLevel[] = [
  {
    id: "scout-5x5",
    name: "Scout (5×5)",
    size: 5,
    start: 0,
    // (0,0)->(1,2)->(0,4)->(2,3)->(4,4)->(3,2)->(4,0)
    solution: [0, 7, 4, 13, 24, 17, 20],
  },
  {
    id: "sweep-5x5",
    name: "Sweep (5×5)",
    size: 5,
    start: 12,
    // (2,2)->(0,1)->(2,0)->(4,1)->(3,3)->(1,4)->(0,2)->(2,3)->(4,4)
    solution: [12, 1, 10, 21, 18, 9, 2, 13, 24],
  },
  {
    id: "mesh-6x6",
    name: "Mesh (6×6)",
    size: 6,
    start: 0,
    // 0(0,0)->13(2,1)->24(4,0)->32(5,2)->21(3,3)->10(1,4)->2(0,2)->15(2,3)->28(4,4)->17(2,5)
    solution: [0, 13, 24, 32, 21, 10, 2, 15, 28, 17],
  },
];

export type KnightState = {
  levelIndex: number;
  trail: number[];
};

export function createKnightState(levelIndex = 0): KnightState {
  const idx = Math.max(0, Math.min(levelIndex, KNIGHT_LEVELS.length - 1));
  return { levelIndex: idx, trail: [KNIGHT_LEVELS[idx].start] };
}

export function isKnightMove(size: number, from: number, to: number): boolean {
  const dr = Math.abs(Math.floor(from / size) - Math.floor(to / size));
  const dc = Math.abs((from % size) - (to % size));
  return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

export function legalKnightMoves(state: KnightState): number[] {
  const level = KNIGHT_LEVELS[state.levelIndex];
  const cur = state.trail[state.trail.length - 1];
  const out: number[] = [];
  for (let i = 0; i < level.size * level.size; i += 1) {
    if (!state.trail.includes(i) && isKnightMove(level.size, cur, i)) out.push(i);
  }
  return out;
}

export function stepKnight(state: KnightState, target: number): KnightState {
  if (!legalKnightMoves(state).includes(target)) return state;
  return { ...state, trail: [...state.trail, target] };
}

export function undoKnight(state: KnightState): KnightState {
  if (state.trail.length <= 1) return state;
  return { ...state, trail: state.trail.slice(0, -1) };
}

export function isKnightSolved(state: KnightState): boolean {
  const level = KNIGHT_LEVELS[state.levelIndex];
  return level.solution.every((idx) => state.trail.includes(idx));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. MINI LATTICE (4×4 and 6×6 Sudoku)
   ═══════════════════════════════════════════════════════════════════════════ */
export type LatticePuzzle = {
  id: string;
  name: string;
  size: 4 | 6;
  boxRows: number;
  boxCols: number;
  givens: number[]; // 0 = empty
  solution: number[];
};

export const LATTICE_PUZZLES: LatticePuzzle[] = [
  {
    id: "lattice-4a",
    name: "Compact (4×4)",
    size: 4,
    boxRows: 2,
    boxCols: 2,
    givens: [
      1, 0, 0, 4,
      0, 4, 1, 0,
      2, 0, 4, 0,
      0, 3, 0, 1,
    ],
    solution: [
      1, 2, 3, 4,
      3, 4, 1, 2,
      2, 1, 4, 3,
      4, 3, 2, 1,
    ],
  },
  {
    id: "lattice-4b",
    name: "Logic (4×4 Hard)",
    size: 4,
    boxRows: 2,
    boxCols: 2,
    givens: [
      0, 3, 0, 1,
      1, 0, 3, 0,
      0, 2, 0, 4,
      4, 0, 2, 0,
    ],
    solution: [
      2, 3, 4, 1,
      1, 4, 3, 2,
      3, 2, 1, 4,
      4, 1, 2, 3,
    ],
  },
  {
    id: "lattice-6a",
    name: "Studio (6×6)",
    size: 6,
    boxRows: 2,
    boxCols: 3,
    givens: [
      1, 0, 3, 4, 0, 6,
      4, 5, 0, 1, 2, 0,
      0, 3, 4, 0, 6, 1,
      5, 0, 1, 2, 0, 4,
      3, 4, 0, 6, 1, 0,
      0, 1, 2, 0, 4, 5,
    ],
    solution: [
      1, 2, 3, 4, 5, 6,
      4, 5, 6, 1, 2, 3,
      2, 3, 4, 5, 6, 1,
      5, 6, 1, 2, 3, 4,
      3, 4, 5, 6, 1, 2,
      6, 1, 2, 3, 4, 5,
    ],
  },
];

export type LatticeState = {
  puzzleIndex: number;
  values: number[];
  selected: number | null;
  moves: number;
};

export function createLatticeState(puzzleIndex = 0): LatticeState {
  const idx = Math.max(0, Math.min(puzzleIndex, LATTICE_PUZZLES.length - 1));
  return {
    puzzleIndex: idx,
    values: LATTICE_PUZZLES[idx].givens.slice(),
    selected: LATTICE_PUZZLES[idx].givens.findIndex((v) => v === 0),
    moves: 0,
  };
}

export function setLatticeValue(state: LatticeState, index: number, val: number): LatticeState {
  const p = LATTICE_PUZZLES[state.puzzleIndex];
  if (index < 0 || index >= p.givens.length || p.givens[index] !== 0) return state;
  if (val < 0 || val > p.size) return state;
  const next = state.values.slice();
  next[index] = val;
  return { ...state, values: next, moves: state.moves + 1 };
}

export function latticeConflicts(puzzle: LatticePuzzle, values: number[]): Set<number> {
  const bad = new Set<number>();
  const s = puzzle.size;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v === 0) continue;
    const r = Math.floor(i / s);
    const c = i % s;
    const br = Math.floor(r / puzzle.boxRows) * puzzle.boxRows;
    const bc = Math.floor(c / puzzle.boxCols) * puzzle.boxCols;
    for (let j = 0; j < values.length; j += 1) {
      if (i === j || values[j] !== v) continue;
      const r2 = Math.floor(j / s);
      const c2 = j % s;
      const sameBox =
        r2 >= br && r2 < br + puzzle.boxRows && c2 >= bc && c2 < bc + puzzle.boxCols;
      if (r === r2 || c === c2 || sameBox) {
        bad.add(i);
        bad.add(j);
      }
    }
  }
  return bad;
}

export function isLatticeSolved(puzzle: LatticePuzzle, values: number[]): boolean {
  return values.every((v) => v >= 1 && v <= puzzle.size) && latticeConflicts(puzzle, values).size === 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. MOSAIC CLUES (5×5 Nonogram)
   ═══════════════════════════════════════════════════════════════════════════ */
export type MosaicPuzzle = {
  id: string;
  name: string;
  size: 5;
  pattern: number[]; // 1 = filled, 0 = empty (length 25)
};

export const MOSAIC_PUZZLES: MosaicPuzzle[] = [
  {
    id: "prism",
    name: "Prism (5×5)",
    size: 5,
    pattern: [
      0, 0, 1, 0, 0,
      0, 1, 0, 1, 0,
      0, 1, 0, 1, 0,
      1, 1, 1, 1, 1,
      1, 0, 0, 0, 1,
    ],
  },
  {
    id: "bolt",
    name: "Bolt (5×5)",
    size: 5,
    pattern: [
      0, 0, 1, 1, 0,
      0, 1, 1, 0, 0,
      1, 1, 1, 1, 1,
      0, 0, 1, 1, 0,
      0, 1, 1, 0, 0,
    ],
  },
  {
    id: "anchor",
    name: "Anchor (5×5)",
    size: 5,
    pattern: [
      0, 0, 1, 0, 0,
      0, 1, 1, 1, 0,
      0, 0, 1, 0, 0,
      1, 0, 1, 0, 1,
      0, 1, 1, 1, 0,
    ],
  },
  {
    id: "beacon",
    name: "Beacon (5×5)",
    size: 5,
    pattern: [
      0, 1, 1, 1, 0,
      1, 0, 1, 0, 1,
      1, 1, 1, 1, 1,
      0, 0, 1, 0, 0,
      0, 1, 1, 1, 0,
    ],
  },
];

export function lineClues(bits: number[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const b of bits) {
    if (b === 1) run += 1;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  return runs.length > 0 ? runs : [0];
}

export function mosaicCluesFor(pattern: number[], size = 5): { rows: number[][]; cols: number[][] } {
  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let r = 0; r < size; r += 1) {
    rows.push(lineClues(pattern.slice(r * size, r * size + size)));
  }
  for (let c = 0; c < size; c += 1) {
    const col: number[] = [];
    for (let r = 0; r < size; r += 1) col.push(pattern[r * size + c]);
    cols.push(lineClues(col));
  }
  return { rows, cols };
}

export function isMosaicSolved(puzzle: MosaicPuzzle, marks: (0 | 1 | 2)[]): boolean {
  const playerBits = marks.map((m) => (m === 1 ? 1 : 0));
  const target = mosaicCluesFor(puzzle.pattern, puzzle.size);
  const current = mosaicCluesFor(playerBits, puzzle.size);
  return JSON.stringify(target) === JSON.stringify(current);
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. HAZARD SWEEP (Safe-first-click Minesweeper)
   ═══════════════════════════════════════════════════════════════════════════ */
export type SweepCell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

export type SweepState = {
  size: number;
  mineCount: number;
  cells: SweepCell[];
  initialized: boolean;
  status: "ready" | "playing" | "won" | "lost";
};

export function createSweepState(size = 6, mineCount = 6): SweepState {
  return {
    size,
    mineCount,
    cells: Array.from({ length: size * size }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
    initialized: false,
    status: "ready",
  };
}

function neighbors8(size: number, index: number): number[] {
  const r = Math.floor(index / size);
  const c = index % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(nr * size + nc);
    }
  }
  return out;
}

export function placeSweepMines(
  state: SweepState,
  safeIndex: number,
  rng: () => number = Math.random,
): SweepState {
  const forbidden = new Set([safeIndex, ...neighbors8(state.size, safeIndex)]);
  const pool: number[] = [];
  for (let i = 0; i < state.cells.length; i += 1) {
    if (!forbidden.has(i)) pool.push(i);
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mines = new Set(pool.slice(0, state.mineCount));
  const next = state.cells.map((c, idx) => ({ ...c, mine: mines.has(idx) }));
  for (let i = 0; i < next.length; i += 1) {
    next[i].adjacent = neighbors8(state.size, i).filter((n) => next[n].mine).length;
  }
  return { ...state, cells: next, initialized: true, status: "playing" };
}

export function revealSweepCell(
  state: SweepState,
  index: number,
  rng: () => number = Math.random,
): SweepState {
  if (state.status === "won" || state.status === "lost") return state;
  const base = state.initialized ? state : placeSweepMines(state, index, rng);
  if (base.cells[index].revealed || base.cells[index].flagged) return base;

  const cells = base.cells.map((c) => ({ ...c }));
  if (cells[index].mine) {
    for (const c of cells) if (c.mine) c.revealed = true;
    return { ...base, cells, status: "lost" };
  }

  const queue = [index];
  cells[index].revealed = true;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cells[cur].adjacent === 0) {
      for (const n of neighbors8(base.size, cur)) {
        if (!cells[n].revealed && !cells[n].mine && !cells[n].flagged) {
          cells[n].revealed = true;
          queue.push(n);
        }
      }
    }
  }

  const won = cells.every((c) => c.mine || c.revealed);
  return { ...base, cells, status: won ? "won" : "playing" };
}

export function toggleSweepFlag(state: SweepState, index: number): SweepState {
  if (state.status === "won" || state.status === "lost") return state;
  if (state.cells[index].revealed) return state;
  const cells = state.cells.map((c, i) => (i === index ? { ...c, flagged: !c.flagged } : c));
  return { ...state, cells };
}

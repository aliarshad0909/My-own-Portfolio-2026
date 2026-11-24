/**
 * Pure domain engine for Signal Link — an original line-matching / connect-the-points
 * circuit puzzle. Every handcrafted level has a mathematically verified disjoint
 * full-grid solution tested in `tests/games.test.ts`.
 */

export type Coord = { row: number; col: number };

export type SignalPair = {
  id: string;
  label: string;
  color: string;
  textColor: string;
  start: Coord;
  end: Coord;
  /** Verified reference solution covering all cells cleanly without crossings. */
  solution: Coord[];
};

export type SignalLevel = {
  id: string;
  name: string;
  size: number;
  pairs: SignalPair[];
};

export type SignalPaths = Record<string, Coord[]>;

export type SignalState = {
  levelIndex: number;
  paths: SignalPaths;
  activePairId: string | null;
  moves: number;
};

export const SIGNAL_LEVELS: SignalLevel[] = [
  {
    id: "relay-5x5",
    name: "Relay (5×5)",
    size: 5,
    pairs: [
      {
        id: "A",
        label: "Alpha",
        color: "#ff7a5c",
        textColor: "#14100e",
        start: { row: 0, col: 0 },
        end: { row: 2, col: 4 },
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 1, col: 4 },
          { row: 2, col: 4 },
        ],
      },
      {
        id: "B",
        label: "Beacon",
        color: "#38bdf8",
        textColor: "#09131c",
        start: { row: 1, col: 0 },
        end: { row: 3, col: 4 },
        solution: [
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 3, col: 0 },
          { row: 4, col: 0 },
          { row: 4, col: 1 },
          { row: 4, col: 2 },
          { row: 4, col: 3 },
          { row: 4, col: 4 },
          { row: 3, col: 4 },
        ],
      },
      {
        id: "C",
        label: "Circuit",
        color: "#f2c66d",
        textColor: "#171308",
        start: { row: 1, col: 1 },
        end: { row: 3, col: 2 },
        solution: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 2, col: 3 },
          { row: 3, col: 3 },
          { row: 3, col: 2 },
        ],
      },
      {
        id: "D",
        label: "Delta",
        color: "#34d399",
        textColor: "#071a13",
        start: { row: 3, col: 1 },
        end: { row: 2, col: 2 },
        solution: [
          { row: 3, col: 1 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
        ],
      },
    ],
  },
  {
    id: "switchboard-6x6",
    name: "Switchboard (6×6)",
    size: 6,
    pairs: [
      {
        id: "A",
        label: "Alpha",
        color: "#ff7a5c",
        textColor: "#14100e",
        start: { row: 0, col: 0 },
        end: { row: 4, col: 3 },
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 1, col: 4 },
          { row: 2, col: 4 },
          { row: 3, col: 4 },
          { row: 4, col: 4 },
          { row: 4, col: 3 },
        ],
      },
      {
        id: "B",
        label: "Beacon",
        color: "#38bdf8",
        textColor: "#09131c",
        start: { row: 0, col: 5 },
        end: { row: 5, col: 3 },
        solution: [
          { row: 0, col: 5 },
          { row: 1, col: 5 },
          { row: 2, col: 5 },
          { row: 3, col: 5 },
          { row: 4, col: 5 },
          { row: 5, col: 5 },
          { row: 5, col: 4 },
          { row: 5, col: 3 },
        ],
      },
      {
        id: "C",
        label: "Circuit",
        color: "#f2c66d",
        textColor: "#171308",
        start: { row: 1, col: 0 },
        end: { row: 5, col: 2 },
        solution: [
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 3, col: 0 },
          { row: 4, col: 0 },
          { row: 5, col: 0 },
          { row: 5, col: 1 },
          { row: 5, col: 2 },
        ],
      },
      {
        id: "D",
        label: "Delta",
        color: "#34d399",
        textColor: "#071a13",
        start: { row: 1, col: 1 },
        end: { row: 2, col: 2 },
        solution: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 2, col: 3 },
          { row: 3, col: 3 },
          { row: 3, col: 2 },
          { row: 2, col: 2 },
        ],
      },
      {
        id: "E",
        label: "Echo",
        color: "#c084fc",
        textColor: "#180b24",
        start: { row: 2, col: 1 },
        end: { row: 4, col: 2 },
        solution: [
          { row: 2, col: 1 },
          { row: 3, col: 1 },
          { row: 4, col: 1 },
          { row: 4, col: 2 },
        ],
      },
    ],
  },
  {
    id: "core-matrix-7x7",
    name: "Core Matrix (7×7)",
    size: 7,
    pairs: [
      {
        id: "A",
        label: "Alpha",
        color: "#ff7a5c",
        textColor: "#14100e",
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 0, col: 5 },
          { row: 1, col: 5 },
          { row: 2, col: 5 },
          { row: 3, col: 5 },
          { row: 4, col: 5 },
          { row: 5, col: 5 },
        ],
      },
      {
        id: "B",
        label: "Beacon",
        color: "#38bdf8",
        textColor: "#09131c",
        start: { row: 0, col: 6 },
        end: { row: 6, col: 2 },
        solution: [
          { row: 0, col: 6 },
          { row: 1, col: 6 },
          { row: 2, col: 6 },
          { row: 3, col: 6 },
          { row: 4, col: 6 },
          { row: 5, col: 6 },
          { row: 6, col: 6 },
          { row: 6, col: 5 },
          { row: 6, col: 4 },
          { row: 6, col: 3 },
          { row: 6, col: 2 },
        ],
      },
      {
        id: "C",
        label: "Circuit",
        color: "#f2c66d",
        textColor: "#171308",
        start: { row: 1, col: 0 },
        end: { row: 5, col: 1 },
        solution: [
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 3, col: 0 },
          { row: 4, col: 0 },
          { row: 5, col: 0 },
          { row: 6, col: 0 },
          { row: 6, col: 1 },
          { row: 5, col: 1 },
        ],
      },
      {
        id: "D",
        label: "Delta",
        color: "#34d399",
        textColor: "#071a13",
        start: { row: 1, col: 1 },
        end: { row: 4, col: 4 },
        solution: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 1, col: 4 },
          { row: 2, col: 4 },
          { row: 3, col: 4 },
          { row: 4, col: 4 },
        ],
      },
      {
        id: "E",
        label: "Echo",
        color: "#c084fc",
        textColor: "#180b24",
        start: { row: 2, col: 1 },
        end: { row: 5, col: 2 },
        solution: [
          { row: 2, col: 1 },
          { row: 3, col: 1 },
          { row: 4, col: 1 },
          { row: 4, col: 2 },
          { row: 5, col: 2 },
        ],
      },
      {
        id: "F",
        label: "Flux",
        color: "#fb7185",
        textColor: "#1e070c",
        start: { row: 3, col: 2 },
        end: { row: 5, col: 4 },
        solution: [
          { row: 3, col: 2 },
          { row: 2, col: 2 },
          { row: 2, col: 3 },
          { row: 3, col: 3 },
          { row: 4, col: 3 },
          { row: 5, col: 3 },
          { row: 5, col: 4 },
        ],
      },
    ],
  },
];

export const sameCoord = (a: Coord, b: Coord): boolean => a.row === b.row && a.col === b.col;

export const isAdjacent = (a: Coord, b: Coord): boolean =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

export const coordKey = (c: Coord): string => `${c.row},${c.col}`;

export function createSignalState(levelIndex = 0): SignalState {
  const safeIdx = Math.max(0, Math.min(levelIndex, SIGNAL_LEVELS.length - 1));
  const level = SIGNAL_LEVELS[safeIdx];
  const paths: SignalPaths = {};
  for (const p of level.pairs) paths[p.id] = [];
  return {
    levelIndex: safeIdx,
    paths,
    activePairId: null,
    moves: 0,
  };
}

export function endpointAt(level: SignalLevel, c: Coord): SignalPair | undefined {
  return level.pairs.find((p) => sameCoord(p.start, c) || sameCoord(p.end, c));
}

export function pathOwnerAt(paths: SignalPaths, c: Coord): { pairId: string; index: number } | undefined {
  for (const [pairId, cells] of Object.entries(paths)) {
    const idx = cells.findIndex((cell) => sameCoord(cell, c));
    if (idx !== -1) return { pairId, index: idx };
  }
  return undefined;
}

export function isPairConnected(level: SignalLevel, paths: SignalPaths, pairId: string): boolean {
  const pair = level.pairs.find((p) => p.id === pairId);
  const cells = paths[pairId] ?? [];
  if (!pair || cells.length < 2) return false;
  const first = cells[0];
  const last = cells[cells.length - 1];
  return (
    (sameCoord(first, pair.start) && sameCoord(last, pair.end)) ||
    (sameCoord(first, pair.end) && sameCoord(last, pair.start))
  );
}

export function countConnectedPairs(level: SignalLevel, paths: SignalPaths): number {
  return level.pairs.filter((p) => isPairConnected(level, paths, p.id)).length;
}

export function coverageStats(level: SignalLevel, paths: SignalPaths): { filled: number; total: number; percent: number } {
  const occupied = new Set<string>();
  for (const p of level.pairs) {
    occupied.add(coordKey(p.start));
    occupied.add(coordKey(p.end));
    for (const c of paths[p.id] ?? []) occupied.add(coordKey(c));
  }
  const total = level.size * level.size;
  const filled = occupied.size;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

export function isSignalLevelSolved(level: SignalLevel, paths: SignalPaths): boolean {
  return countConnectedPairs(level, paths) === level.pairs.length;
}

/**
 * Start or resume routing when pressing down / activating a cell.
 * - Clicking an endpoint starts a fresh path from that endpoint.
 * - Clicking an existing cell on a path truncates that path back to that cell and activates it.
 * - Clicking an empty cell adjacent to the current active tip extends the active path.
 */
export function selectSignalCell(state: SignalState, cell: Coord): SignalState {
  const level = SIGNAL_LEVELS[state.levelIndex];
  if (cell.row < 0 || cell.row >= level.size || cell.col < 0 || cell.col >= level.size) {
    return state;
  }

  const ep = endpointAt(level, cell);

  // If currently routing a pair and user clicks its matching opposite endpoint adjacent to tip, complete it!
  if (state.activePairId && ep && ep.id === state.activePairId) {
    const activePath = state.paths[state.activePairId] ?? [];
    if (activePath.length >= 1 && isAdjacent(activePath[activePath.length - 1], cell) && !sameCoord(activePath[0], cell)) {
      return extendSignalPath(state, cell);
    }
  }

  // Clicking any endpoint starts routing that pair from this endpoint.
  if (ep) {
    return {
      ...state,
      paths: { ...state.paths, [ep.id]: [cell] },
      activePairId: ep.id,
      moves: state.moves + 1,
    };
  }

  // Clicking a cell already on a path: either backtrack the active pair or switch & trim that pair.
  const owner = pathOwnerAt(state.paths, cell);
  if (owner) {
    const trimmed = (state.paths[owner.pairId] ?? []).slice(0, owner.index + 1);
    return {
      ...state,
      paths: { ...state.paths, [owner.pairId]: trimmed },
      activePairId: owner.pairId,
      moves: state.moves + 1,
    };
  }

  // Empty cell: if adjacent to the current active pair's tip, extend it.
  if (state.activePairId) {
    return extendSignalPath(state, cell);
  }

  return state;
}

/**
 * Extend the currently active signal path onto an adjacent cell.
 * Prevents crossing other pairs' paths or stepping onto foreign endpoints.
 */
export function extendSignalPath(state: SignalState, cell: Coord): SignalState {
  const pairId = state.activePairId;
  if (!pairId) return state;

  const level = SIGNAL_LEVELS[state.levelIndex];
  if (cell.row < 0 || cell.row >= level.size || cell.col < 0 || cell.col >= level.size) {
    return state;
  }

  const current = state.paths[pairId] ?? [];
  if (current.length === 0) return state;

  const tip = current[current.length - 1];
  if (sameCoord(tip, cell)) return state;
  if (!isAdjacent(tip, cell)) return state;

  // Backtrack if moving onto a cell already in the active path.
  const selfIdx = current.findIndex((c) => sameCoord(c, cell));
  if (selfIdx !== -1) {
    return {
      ...state,
      paths: { ...state.paths, [pairId]: current.slice(0, selfIdx + 1) },
    };
  }

  // If this pair is already complete (both endpoints linked), do not extend past the end.
  if (isPairConnected(level, state.paths, pairId)) return state;

  // Block stepping onto a different pair's endpoint.
  const ep = endpointAt(level, cell);
  if (ep && ep.id !== pairId) return state;

  // Block crossing any other pair's existing wire.
  const owner = pathOwnerAt(state.paths, cell);
  if (owner && owner.pairId !== pairId) return state;

  const nextPath = [...current, cell];
  const nextPaths = { ...state.paths, [pairId]: nextPath };
  const finished = isPairConnected(level, nextPaths, pairId);

  return {
    ...state,
    paths: nextPaths,
    activePairId: finished ? null : pairId,
    moves: state.moves + 1,
  };
}

export function undoActiveSignalStep(state: SignalState): SignalState {
  const pairId = state.activePairId;
  if (!pairId) return state;
  const current = state.paths[pairId] ?? [];
  if (current.length <= 1) {
    return {
      ...state,
      paths: { ...state.paths, [pairId]: [] },
      activePairId: null,
    };
  }
  return {
    ...state,
    paths: { ...state.paths, [pairId]: current.slice(0, -1) },
  };
}

export function clearSignalPair(state: SignalState, pairId: string): SignalState {
  return {
    ...state,
    paths: { ...state.paths, [pairId]: [] },
    activePairId: state.activePairId === pairId ? null : state.activePairId,
  };
}

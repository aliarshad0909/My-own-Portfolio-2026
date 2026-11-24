/**
 * Pure domain engines for Word & Number games:
 *  - Cipher Five (5-letter word deduction)
 *  - Sum Shift (4x4 sliding power-of-two merge)
 *  - Equation Forge (4-number arithmetic target puzzle)
 *  - Tile Shift (3x3 / 4x4 guaranteed-solvable sliding tiles)
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. CIPHER FIVE
   ═══════════════════════════════════════════════════════════════════════════ */
export const CIPHER_WORDS = [
  "STACK", "QUERY", "ROUTE", "FRAME", "SCALE", "PIXEL", "NODES", "LOGIC", "GRAPH", "BUILD",
  "CACHE", "INDEX", "STYLE", "SCOPE", "MERGE", "DRAFT", "MODEL", "CLOUD", "TOKEN", "SHIFT",
  "RELAY", "PULSE", "PRISM", "SPARK", "LIGHT", "CRAFT", "ALIGN", "LAYER", "BOARD", "FETCH",
  "STATE", "ARRAY", "HOOKS", "TYPES", "CLEAN", "AUDIT", "BRAND", "AUDIO", "VIDEO", "BLEND",
  "SCENE", "RIGID", "SHADE", "COLOR", "ORBIT", "LASER", "SWIFT", "TRACK", "AGENT", "FLOWS",
  "PILOT", "CARGO", "TRADE", "PRICE", "STOCK", "LEDGR", "CHART", "TABLE", "GUIDE", "INPUT",
].filter((w) => w.length === 5 && /^[A-Z]{5}$/.test(w));

export type LetterVerdict = "exact" | "present" | "absent";

export function evaluateCipherGuess(target: string, guess: string): LetterVerdict[] {
  const t = target.toUpperCase().split("");
  const g = guess.toUpperCase().split("");
  const result: LetterVerdict[] = Array(5).fill("absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < 5; i += 1) {
    if (g[i] === t[i]) {
      result[i] = "exact";
    } else {
      remaining[t[i]] = (remaining[t[i]] ?? 0) + 1;
    }
  }
  for (let i = 0; i < 5; i += 1) {
    if (result[i] === "exact") continue;
    if ((remaining[g[i]] ?? 0) > 0) {
      result[i] = "present";
      remaining[g[i]] -= 1;
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. SUM SHIFT (4×4 sliding merge)
   ═══════════════════════════════════════════════════════════════════════════ */
export type ShiftDir = "up" | "down" | "left" | "right";

export type SumShiftState = {
  board: number[]; // length 16
  score: number;
  goal: 256 | 512;
  won: boolean;
  over: boolean;
  prevBoard: number[] | null;
  prevScore: number;
};

function spawnTile(board: number[], rng: () => number): number[] {
  const empty: number[] = [];
  for (let i = 0; i < board.length; i += 1) if (board[i] === 0) empty.push(i);
  if (empty.length === 0) return board;
  const pick = empty[Math.floor(rng() * empty.length)];
  const next = board.slice();
  next[pick] = rng() < 0.85 ? 2 : 4;
  return next;
}

export function createSumShiftState(goal: 256 | 512 = 256, rng: () => number = Math.random): SumShiftState {
  let board = Array<number>(16).fill(0);
  board = spawnTile(board, rng);
  board = spawnTile(board, rng);
  return { board, score: 0, goal, won: false, over: false, prevBoard: null, prevScore: 0 };
}

function slideLine(line: number[]): { next: number[]; gained: number } {
  const compact = line.filter((n) => n !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i += 1) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const merged = compact[i] * 2;
      out.push(merged);
      gained += merged;
      i += 1;
    } else {
      out.push(compact[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { next: out, gained };
}

export function canSumShiftMove(board: number[]): boolean {
  if (board.includes(0)) return true;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const v = board[r * 4 + c];
      if (c < 3 && board[r * 4 + c + 1] === v) return true;
      if (r < 3 && board[(r + 1) * 4 + c] === v) return true;
    }
  }
  return false;
}

export function moveSumShift(
  state: SumShiftState,
  dir: ShiftDir,
  rng: () => number = Math.random,
): SumShiftState {
  if (state.over) return state;
  const next = Array<number>(16).fill(0);
  let gained = 0;

  for (let i = 0; i < 4; i += 1) {
    const idxs: number[] = [];
    for (let j = 0; j < 4; j += 1) {
      if (dir === "left") idxs.push(i * 4 + j);
      else if (dir === "right") idxs.push(i * 4 + (3 - j));
      else if (dir === "up") idxs.push(j * 4 + i);
      else idxs.push((3 - j) * 4 + i);
    }
    const { next: slid, gained: g } = slideLine(idxs.map((k) => state.board[k]));
    gained += g;
    for (let j = 0; j < 4; j += 1) next[idxs[j]] = slid[j];
  }

  const changed = next.some((v, idx) => v !== state.board[idx]);
  if (!changed) return state;

  const withSpawn = spawnTile(next, rng);
  const score = state.score + gained;
  const won = state.won || withSpawn.some((v) => v >= state.goal);
  const over = !canSumShiftMove(withSpawn);
  return {
    ...state,
    board: withSpawn,
    score,
    won,
    over,
    prevBoard: state.board,
    prevScore: state.score,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. EQUATION FORGE
   ═══════════════════════════════════════════════════════════════════════════ */
export type ArithmeticOp = "+" | "-" | "*" | "/";

export type EquationChallenge = {
  id: string;
  label: string;
  numbers: number[];
  target: number;
  hint: string;
};

export const EQUATION_CHALLENGES: EquationChallenge[] = [
  { id: "eq-1", label: "Warmup #1", numbers: [3, 4, 6, 2], target: 24, hint: "Try multiplying 4 × 6, or (6 − 2) × (3 + 3) — wait: 4 × (6 + 3 − 3)? Use 6 × 4 = 24, or (3 + 2 − 1) → actually (6 − 2) × 4 + ... wait: (3 × 4) × 2 = 24, or (6 − 4) × (3...) -> Try 3 × (6 + 2) = 24!" },
  { id: "eq-2", label: "Warmup #2", numbers: [8, 5, 2, 3], target: 31, hint: "Try 5 × 8 = 40, then subtract 3 × 3? Try (8 × 3) + 5 + 2 = 31!" },
  { id: "eq-3", label: "Standard #3", numbers: [9, 6, 4, 2], target: 42, hint: "Try (9 − 2) × 6 = 42, or (6 + 1)... wait: 9 × 4 + 6 = 42!" },
  { id: "eq-4", label: "Standard #4", numbers: [7, 5, 4, 3], target: 50, hint: "Try (7 + 3) × 5 = 50!" },
  { id: "eq-5", label: "Challenge #5", numbers: [12, 8, 5, 3], target: 64, hint: "Try (12 − 4) × 8 → 5 + 3 = 8, then 8 × 8 = 64!" },
  { id: "eq-6", label: "Challenge #6", numbers: [15, 6, 4, 2], target: 48, hint: "Try (15 − 3)... wait: 6 × (15 − ... ) → (15 + 9)? Try 15 − 6 = 9; or (6 + 2) × (15...)? Check: (15 − 6 + 3)? Let's verify: (15 − 6) = 9, 4 + 2 = 6; simpler: (15 − 3)? Wait: 4 × 12 -> 15 - (6 / 2) = 12, then 12 × 4 = 48!" },
];

// Clean up hints above to exact crisp one-liners verified mathematically!
EQUATION_CHALLENGES[0].hint = "Hint: 6 + 2 = 8, then 8 × 3 = 24.";
EQUATION_CHALLENGES[1].hint = "Hint: 8 × 3 = 24, then add 5 + 2 to reach 31.";
EQUATION_CHALLENGES[2].hint = "Hint: 9 × 4 = 36, then add 6 to reach 42.";
EQUATION_CHALLENGES[3].hint = "Hint: 7 + 3 = 10, then multiply by 5 to reach 50.";
EQUATION_CHALLENGES[4].hint = "Hint: 5 + 3 = 8, then multiply 8 × 8 = 64.";
EQUATION_CHALLENGES[5].hint = "Hint: 6 ÷ 2 = 3, 15 − 3 = 12, then 12 × 4 = 48.";

export type EquationTile = { id: string; value: number; expr: string };

export type EquationState = {
  challengeIndex: number;
  tiles: EquationTile[];
  history: EquationTile[][];
  steps: string[];
};

export function createEquationState(challengeIndex = 0): EquationState {
  const idx = Math.max(0, Math.min(challengeIndex, EQUATION_CHALLENGES.length - 1));
  const ch = EQUATION_CHALLENGES[idx];
  return {
    challengeIndex: idx,
    tiles: ch.numbers.map((n, i) => ({ id: `t-${i}`, value: n, expr: String(n) })),
    history: [],
    steps: [],
  };
}

export function combineEquationTiles(
  state: EquationState,
  firstIdx: number,
  op: ArithmeticOp,
  secondIdx: number,
): { state: EquationState; error?: string } {
  if (firstIdx === secondIdx || firstIdx < 0 || secondIdx < 0) {
    return { state, error: "Pick two different number tiles." };
  }
  const a = state.tiles[firstIdx];
  const b = state.tiles[secondIdx];
  if (!a || !b) return { state, error: "Invalid tile selection." };

  let value: number;
  if (op === "+") value = a.value + b.value;
  else if (op === "-") value = a.value - b.value;
  else if (op === "*") value = a.value * b.value;
  else {
    if (b.value === 0 || a.value % b.value !== 0) {
      return { state, error: "Division must produce an exact whole integer." };
    }
    value = a.value / b.value;
  }

  const symbol = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : "+";
  const nextTile: EquationTile = {
    id: `m-${state.steps.length}-${Date.now()}`,
    value,
    expr: `(${a.expr} ${symbol} ${b.expr})`,
  };
  const remaining = state.tiles.filter((_, i) => i !== firstIdx && i !== secondIdx);
  return {
    state: {
      ...state,
      tiles: [...remaining, nextTile],
      history: [...state.history, state.tiles],
      steps: [...state.steps, `${a.value} ${symbol} ${b.value} = ${value}`],
    },
  };
}

export function isEquationSolved(state: EquationState): boolean {
  const target = EQUATION_CHALLENGES[state.challengeIndex].target;
  return state.tiles.some((t) => t.value === target);
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. TILE SHIFT (3×3 / 4×4 Guaranteed-Solvable Sliding Puzzle)
   ═══════════════════════════════════════════════════════════════════════════ */
export type SlideState = {
  size: 3 | 4;
  tiles: number[]; // 0 represents the blank slot
  moves: number;
};

export function solvedSlideBoard(size: 3 | 4): number[] {
  const total = size * size;
  return Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
}

export function slideTileAt(state: SlideState, index: number): SlideState {
  const zero = state.tiles.indexOf(0);
  const zr = Math.floor(zero / state.size);
  const zc = zero % state.size;
  const tr = Math.floor(index / state.size);
  const tc = index % state.size;
  if (Math.abs(zr - tr) + Math.abs(zc - tc) !== 1) return state;
  const next = state.tiles.slice();
  [next[zero], next[index]] = [next[index], next[zero]];
  return { ...state, tiles: next, moves: state.moves + 1 };
}

export function createSlideState(size: 3 | 4 = 3, rng: () => number = Math.random): SlideState {
  let state: SlideState = { size, tiles: solvedSlideBoard(size), moves: 0 };
  const steps = size === 3 ? 28 : 48;
  let lastZero = -1;
  for (let s = 0; s < steps; s += 1) {
    const zero = state.tiles.indexOf(0);
    const zr = Math.floor(zero / size);
    const zc = zero % size;
    const adj: number[] = [];
    if (zr > 0) adj.push((zr - 1) * size + zc);
    if (zr < size - 1) adj.push((zr + 1) * size + zc);
    if (zc > 0) adj.push(zr * size + (zc - 1));
    if (zc < size - 1) adj.push(zr * size + (zc + 1));
    const filtered = adj.filter((i) => i !== lastZero);
    const pick = filtered[Math.floor(rng() * filtered.length)] ?? adj[0];
    lastZero = zero;
    state = { ...slideTileAt(state, pick), moves: 0 };
  }
  if (isSlideSolved(state)) {
    const zero = state.tiles.indexOf(0);
    const swapIdx = zero > 0 ? zero - 1 : 1;
    state = { ...slideTileAt(state, swapIdx), moves: 0 };
  }
  return state;
}

export function isSlideSolved(state: SlideState): boolean {
  const goal = solvedSlideBoard(state.size);
  return state.tiles.every((v, i) => v === goal[i]);
}

/**
 * Pure domain engine for Studio Pairs — an original geometric memory-matching game.
 */

export type PairsDifficulty = "compact" | "standard" | "extended";

export type EmblemId =
  | "prism"
  | "circuit"
  | "orbit"
  | "waveform"
  | "lattice"
  | "compass"
  | "beacon"
  | "vector"
  | "helix"
  | "keystone";

export type EmblemMeta = {
  id: EmblemId;
  label: string;
  color: string;
};

export const EMBLEMS: EmblemMeta[] = [
  { id: "prism", label: "Prism", color: "#ff7a5c" },
  { id: "circuit", label: "Circuit", color: "#38bdf8" },
  { id: "orbit", label: "Orbit", color: "#f2c66d" },
  { id: "waveform", label: "Waveform", color: "#34d399" },
  { id: "lattice", label: "Lattice", color: "#c084fc" },
  { id: "compass", label: "Compass", color: "#fb7185" },
  { id: "beacon", label: "Beacon", color: "#60a5fa" },
  { id: "vector", label: "Vector", color: "#fbbf24" },
  { id: "helix", label: "Helix", color: "#2dd4bf" },
  { id: "keystone", label: "Keystone", color: "#f472b6" },
];

export const PAIRS_DIFFICULTIES: Record<
  PairsDifficulty,
  { id: PairsDifficulty; label: string; pairCount: number; cols: number }
> = {
  compact: { id: "compact", label: "Compact (6 pairs)", pairCount: 6, cols: 4 },
  standard: { id: "standard", label: "Standard (8 pairs)", pairCount: 8, cols: 4 },
  extended: { id: "extended", label: "Extended (10 pairs)", pairCount: 10, cols: 5 },
};

export type PairCard = {
  uid: string;
  emblemId: EmblemId;
  label: string;
  color: string;
  matched: boolean;
};

export type PairsState = {
  difficulty: PairsDifficulty;
  cards: PairCard[];
  /** Indices currently face-up for this turn (max 2). */
  flipped: number[];
  /** True when two mismatched cards are briefly shown before hiding. */
  mismatchPending: boolean;
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  lastAnnouncement: string;
};

export function createPairsState(
  difficulty: PairsDifficulty = "standard",
  rng: () => number = Math.random,
): PairsState {
  const config = PAIRS_DIFFICULTIES[difficulty];
  const selected = EMBLEMS.slice(0, config.pairCount);
  const deck: PairCard[] = [];
  for (const e of selected) {
    deck.push({ uid: `${e.id}-1`, emblemId: e.id, label: e.label, color: e.color, matched: false });
    deck.push({ uid: `${e.id}-2`, emblemId: e.id, label: e.label, color: e.color, matched: false });
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    difficulty,
    cards: deck,
    flipped: [],
    mismatchPending: false,
    moves: 0,
    matchedPairs: 0,
    totalPairs: config.pairCount,
    lastAnnouncement: `New ${config.label} board ready. Flip two cards to find matching emblems.`,
  };
}

export function clearPairsMismatch(state: PairsState): PairsState {
  if (!state.mismatchPending) return state;
  return {
    ...state,
    flipped: [],
    mismatchPending: false,
  };
}

export function flipPairCard(state: PairsState, index: number): PairsState {
  if (index < 0 || index >= state.cards.length) return state;

  // If a prior mismatch is still visible, clear it immediately and flip the newly chosen card.
  const base = state.mismatchPending ? clearPairsMismatch(state) : state;
  const card = base.cards[index];
  if (card.matched || base.flipped.includes(index)) return base;

  // First card of the turn.
  if (base.flipped.length === 0) {
    return {
      ...base,
      flipped: [index],
      lastAnnouncement: `Revealed ${card.label}. Pick a second card.`,
    };
  }

  // Second card of the turn.
  const firstIdx = base.flipped[0];
  const firstCard = base.cards[firstIdx];
  const nextMoves = base.moves + 1;

  if (firstCard.emblemId === card.emblemId) {
    const nextCards = base.cards.map((c, i) =>
      i === firstIdx || i === index ? { ...c, matched: true } : c,
    );
    const nextMatched = base.matchedPairs + 1;
    const finished = nextMatched === base.totalPairs;
    return {
      ...base,
      cards: nextCards,
      flipped: [],
      mismatchPending: false,
      moves: nextMoves,
      matchedPairs: nextMatched,
      lastAnnouncement: finished
        ? `Matched ${card.label}! All ${base.totalPairs} pairs found in ${nextMoves} moves.`
        : `Matched ${card.label}! ${nextMatched} of ${base.totalPairs} pairs found.`,
    };
  }

  return {
    ...base,
    flipped: [firstIdx, index],
    mismatchPending: true,
    moves: nextMoves,
    lastAnnouncement: `Revealed ${card.label}. No match with ${firstCard.label}.`,
  };
}

export function isPairsSolved(state: PairsState): boolean {
  return state.matchedPairs === state.totalPairs;
}

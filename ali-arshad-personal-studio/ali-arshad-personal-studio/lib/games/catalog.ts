/**
 * Original interactive browser games & portfolio experiments catalog.
 *
 * Governance:
 *  - Every game here is an original portfolio experiment written directly in
 *    this repository — zero copied branding, artwork, or third-party game code.
 *  - Explicitly separated from commercial services, client work, and SaaS
 *    demonstration case studies.
 */

export type GameSlug = "signal-link" | "pulse-grid" | "studio-pairs";

export type GameDefinition = {
  slug: GameSlug;
  title: string;
  tagline: string;
  category: string;
  experimentLabel: "Original Portfolio Experiment";
  summary: string;
  objective: string;
  instructions: string[];
  controls: {
    pointer: string;
    keyboard: string;
  };
  difficultyModes: string[];
  mechanics: string[];
  estimatedTime: string;
  accentColor: string;
};

export const STUDIO_GAMES: GameDefinition[] = [
  {
    slug: "signal-link",
    title: "Signal Link",
    tagline: "Connect matching node pairs across a circuit grid without crossing paths.",
    category: "Line-Matching Puzzle",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Route non-overlapping orthogonal paths between matching lettered signal nodes across 5×5, 6×6, and 7×7 boards. Every level has a verified 100% full-grid solution.",
    objective:
      "Connect every matching pair of nodes (A–A, B–B, C–C, …) along horizontal and vertical steps without crossing another pair's wire. Cover 100% of grid cells for a perfect routing badge.",
    instructions: [
      "Pick any lettered node to start routing that signal pair.",
      "Drag across adjacent horizontal or vertical squares — or tap step-by-step — until you reach the matching node.",
      "Move back onto a previous cell in the same path to backtrack, or use Undo / Clear Pair to re-route.",
      "Connect all pairs on the board to complete the level, and aim for 100% grid coverage.",
    ],
    controls: {
      pointer: "Click or drag from a node across adjacent squares. Tap an active path to backtrack.",
      keyboard: "Arrow keys move grid focus. Enter/Space selects a node or extends the active path to an adjacent cell. Backspace undoes the last step; Escape deselects.",
    },
    difficultyModes: ["Relay (5×5 · 4 pairs)", "Switchboard (6×6 · 5 pairs)", "Core Matrix (7×7 · 6 pairs)"],
    mechanics: ["Orthogonal pathfinding", "Zero-crossing constraint", "Dual color + letter encoding", "Full keyboard & touch routing"],
    estimatedTime: "2–5 min",
    accentColor: "#ff7a5c",
  },
  {
    slug: "pulse-grid",
    title: "Pulse Grid",
    tagline: "Clear an array of coupled alert nodes using orthogonal parity toggles.",
    category: "Grid Logic Puzzle",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Toggling any cell flips its own state and its four orthogonal neighbors. Every curated board and generated shuffle is guaranteed solvable, with live par tracking and deterministic hints.",
    objective:
      "Turn off every active coral alert node on the board in as few moves as possible. Try to match or beat the par move count.",
    instructions: [
      "Select any tile to toggle that tile together with the tiles directly above, below, left, and right.",
      "Watch how toggling an interior tile affects five cells, an edge affects four, and a corner affects three.",
      "Use Undo to step backward, Restart to retry the same board, or Hint to highlight one guaranteed valid next move.",
      "Switch between 3×3, 4×4, and 5×5 boards or generate a fresh guaranteed-solvable shuffle.",
    ],
    controls: {
      pointer: "Click or tap any tile to toggle it and its orthogonal neighbors.",
      keyboard: "Arrow keys navigate the grid; Enter or Space toggles the focused tile.",
    },
    difficultyModes: ["Starter (3×3)", "Standard (4×4)", "Challenge (5×5)"],
    mechanics: ["Mod-2 parity logic", "Guaranteed solvable generator", "Deterministic hint solver", "Move & par tracking"],
    estimatedTime: "1–4 min",
    accentColor: "#38bdf8",
  },
  {
    slug: "studio-pairs",
    title: "Studio Pairs",
    tagline: "Match original geometric emblems across responsive memory boards.",
    category: "Memory Matching",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Flip custom-drawn geometric SVG cards to pair matching emblems across 12-, 16-, and 20-card boards. Includes move counting, live elapsed timer, session best tracking, and reduced-motion flips.",
    objective:
      "Uncover and match every pair of identical geometric emblems using the fewest moves possible.",
    instructions: [
      "Flip any face-down card to reveal its geometric emblem and label.",
      "Flip a second card: matching emblems stay locked face up; mismatches flip back automatically after a brief pause (or immediately when you pick your next card).",
      "Switch between Compact (6 pairs), Standard (8 pairs), and Extended (10 pairs) boards at any time.",
      "Use Restart for a fresh shuffled layout and try to beat your best move count.",
    ],
    controls: {
      pointer: "Click or tap any face-down card to reveal it.",
      keyboard: "Arrow keys move focus across the card grid; Enter or Space flips the focused card.",
    },
    difficultyModes: ["Compact (6 pairs)", "Standard (8 pairs)", "Extended (10 pairs)"],
    mechanics: ["10 original geometric SVGs", "Accessible text labels & live region", "Move counter & timer", "Reduced-motion instant reveal"],
    estimatedTime: "1–3 min",
    accentColor: "#34d399",
  },
];

export function getGame(slug: string): GameDefinition | undefined {
  return STUDIO_GAMES.find((g) => g.slug === slug);
}

export function allGameSlugs(): GameSlug[] {
  return STUDIO_GAMES.map((g) => g.slug);
}

import { STUDIO_GAMES, type GameDefinition } from "@/lib/games/catalog";
import type { Project } from "@/lib/projects";

const REPO_TREE_BASE =
  "https://github.com/aliarshad0909/My-own-Portfolio-2026/tree/feature/next-build-100-planner-globe/ali-arshad-personal-studio/ali-arshad-personal-studio";

type GameBuildMeta = {
  enginePath: string;
  uiPath: string;
  conceptStory: string;
  designDecisions: string;
  testingNotes: string;
  accessibilityNotes: string;
  iterationLesson: string;
};

const ENGINE_MAP: Record<string, { enginePath: string; uiPath: string; testingNotes: string }> = {
  "signal-link": {
    enginePath: "lib/games/signal-link.ts",
    uiPath: "components/games/SignalLinkGame.tsx",
    testingNotes: "Automated node:test proofs verify every curated level's reference paths partition 100% of grid cells without crossings or adjacent endpoints, plus undo and clear transitions.",
  },
  "circuit-turn": {
    enginePath: "lib/games/engines-path-logic.ts",
    uiPath: "components/games/PathLogicGames.tsx",
    testingNotes: "Unit tests verify bitwise pipe-mask rotation and BFS power propagation from West source to East sink, asserting every board starts unsolved and solves cleanly at solvedRot.",
  },
  "knight-relay": {
    enginePath: "lib/games/engines-path-logic.ts",
    uiPath: "components/games/PathLogicGames.tsx",
    testingNotes: "Unit tests assert every step across all 3 levels is a legal (±1, ±2) knight jump with zero repeated squares, catching a diagonal typo on the 6×6 board before release.",
  },
  "pulse-grid": {
    enginePath: "lib/games/pulse-grid.ts",
    uiPath: "components/games/PulseGridGame.tsx",
    testingNotes: "Tracks the exact GF(2) XOR remaining solution set across curated and randomly generated boards so automated tests prove every board solves cleanly via Hint.",
  },
  "glyph-sudoku": {
    enginePath: "lib/games/engines-path-logic.ts",
    uiPath: "components/games/PathLogicGames.tsx",
    testingNotes: "Unit tests validate row, column, and sub-box conflict detection on both 4×4 and 6×6 boards plus reference-solution completeness.",
  },
  "mosaic-clues": {
    enginePath: "lib/games/engines-path-logic.ts",
    uiPath: "components/games/PathLogicGames.tsx",
    testingNotes: "Unit tests verify run-length clue encoding on all 4 curated 5×5 nonogram patterns and exact clue-matching win evaluation.",
  },
  "mine-sweep-lab": {
    enginePath: "lib/games/engines-path-logic.ts",
    uiPath: "components/games/PathLogicGames.tsx",
    testingNotes: "Seeded PRNG tests confirm the first revealed cell and its 8 neighbors are guaranteed mine-free, flag toggles block accidental reveals, and clearing all safe cells wins.",
  },
  "studio-pairs": {
    enginePath: "lib/games/studio-pairs.ts",
    uiPath: "components/games/StudioPairsGame.tsx",
    testingNotes: "Seeded deck tests exercise mismatch delays, pair locking, move counters, restart resets, and full-board completion across board sizes.",
  },
  "echo-pads": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "Pure sequence-generation tests validate bounded pad indices while UI state guards input strictly during playback phases.",
  },
  "flash-matrix": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "Pure pattern-generator tests verify unique cell selection without duplicates across escalating 4×4 difficulty rounds.",
  },
  "cipher-five": {
    enginePath: "lib/games/engines-word-number.ts",
    uiPath: "components/games/WordNumberGames.tsx",
    testingNotes: "Unit tests validate two-pass duplicate-letter evaluation (exact greens consumed before amber present counts) across a 60-word studio dictionary.",
  },
  "sum-shift": {
    enginePath: "lib/games/engines-word-number.ts",
    uiPath: "components/games/WordNumberGames.tsx",
    testingNotes: "Deterministic board tests verify single-merge-per-turn row/column sliding, score deltas, spawn placement, and game-over detection.",
  },
  "equation-forge": {
    enginePath: "lib/games/engines-word-number.ts",
    uiPath: "components/games/WordNumberGames.tsx",
    testingNotes: "Unit tests verify exact-integer division rejection (blocking fractional results), expression history undo, and target verification across all 6 challenges.",
  },
  "slide-order": {
    enginePath: "lib/games/engines-word-number.ts",
    uiPath: "components/games/WordNumberGames.tsx",
    testingNotes: "Constructs shuffles strictly by applying legal blank-tile walks from the solved board so every 3×3 and 4×4 scramble is mathematically guaranteed solvable.",
  },
  "reflex-gate": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "Pure latency stats tests confirm average and fastest millisecond aggregations while timer cleanup hooks prevent leaked timeouts on unmount.",
  },
  "orbit-catch": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "Hit-band math tests verify perfect/hit/miss boundaries around center (50%), with automatic stepped-cadence fallback under prefers-reduced-motion.",
  },
  "target-burst": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "Pure next-target selection tests guarantee consecutive beacons never repeat the same cell, paired with safe 20-second timer teardown.",
  },
  "chroma-match": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "HSL-to-RGB Euclidean accuracy tests confirm 100% score on exact matches and steep drop-off on complementary hue error.",
  },
  "contrast-judge": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "WCAG 2.2 relative luminance tests verify exact 21:1 black/white contrast, AAA studio pairings, and low-contrast fail detection.",
  },
  "gradient-sort": {
    enginePath: "lib/games/engines-memory-arcade-color.ts",
    uiPath: "components/games/MemoryArcadeColorGames.tsx",
    testingNotes: "HSL interpolation tests verify anchor-lock preservation on first/last swatches, guaranteed-scrambled starts, and sort completion.",
  },
};

function metaForGame(game: GameDefinition): GameBuildMeta {
  const rec = ENGINE_MAP[game.slug] ?? {
    enginePath: "lib/games/catalog.ts",
    uiPath: "components/games/GameLauncher.tsx",
    testingNotes: "Covered by automated pure-engine tests under tests/games.test.ts.",
  };
  return {
    enginePath: rec.enginePath,
    uiPath: rec.uiPath,
    conceptStory: `${game.title} is a personal interactive experiment built in the ${game.category} genre (${game.estimatedTime} typical session) to explore clean browser state machines without external game engines.`,
    designDecisions: `Pure game rules live in ${rec.enginePath}, completely decoupled from React rendering in ${rec.uiPath}. Boards are lazy-loaded via next/dynamic so visiting the portfolio index never ships unnecessary game bundles.`,
    testingNotes: rec.testingNotes,
    accessibilityNotes: `Supports both pointer/touch (${game.controls.pointer}) and full keyboard play (${game.controls.keyboard}), avoids relying on color alone, announces state updates via aria-live regions, and respects prefers-reduced-motion: reduce.`,
    iterationLesson: `Separating deterministic state transitions from UI layout made edge-case bugs immediately catchable in unit tests and kept touch targets responsive down to 390px mobile screens.`,
  };
}

/**
 * Exposes all 20 original browser games inside `/work` as clearly labeled
 * Personal Experiments — never client work — linking directly to each game's
 * playable route (`/games/<slug>`) and exact repository source files.
 */
export const GAME_WORK_ENTRIES: Project[] = STUDIO_GAMES.map((game, idx) => {
  const meta = metaForGame(game);
  return {
    id: `g${String(idx + 1).padStart(2, "0")}`,
    slug: `game-${game.slug}`,
    title: `${game.title} — Browser Game Experiment`,
    categories: ["Games & Experiments", "Web & Software"],
    tags: [game.category, "Personal Experiment", "Browser Game", ...game.mechanics.slice(0, 2)],
    year: "2026",
    summary: `${game.summary} Personal interactive experiment exploring game feel, state machines, and accessibility — not client work.`,
    projectType: "Personal Experiment",
    status: "Playable Experiment",
    role: "Personal creator (independent browser game experiment)",
    contribution: [
      `Pure TypeScript rules engine (${meta.enginePath})`,
      `Accessible React board & controls (${meta.uiPath})`,
      "Automated engine tests & reduced-motion fallback",
      "Original SVG cover art and keyboard/touch verification",
    ],
    technologies: ["TypeScript", "React 19", "Next.js", "SVG / CSS Grid"],
    featured: false,
    usesSampleMedia: false,
    cover: {
      src: "/images/projects/placeholder-interior.webp",
      alt: `${game.title} — original browser game experiment visual`,
      width: 1200,
      height: 675,
    },
    gallery: [],
    playUrl: `/games/${game.slug}`,
    gameSlug: game.slug,
    sourceRepoPath: `ali-arshad-personal-studio/ali-arshad-personal-studio/${meta.enginePath}`,
    sourceUrl: `${REPO_TREE_BASE}/${meta.enginePath}`,
    isCatalogExpansion: true,
    nicheLabel: `Games & Experiments · ${game.category}`,
    relatedServicePaths: ["/services/web-development/react-applications", "/services/web-development/nextjs"],
    relatedToolPaths: ["/games"],
    caseStudy: {
      background: `${meta.conceptStory} Built purely out of personal interest in interactive UI mechanics and game design — not a commercial client engagement or claimed studio game-dev service line.`,
      challenge: `Design a crisp, instantly understandable ${game.category.toLowerCase()} puzzle that runs smoothly on desktop and 390px mobile browsers with zero third-party game frameworks and full keyboard accessibility.`,
      approach: meta.designDecisions,
      features: [
        ...game.instructions,
        `Pointer / touch controls: ${game.controls.pointer}`,
        `Keyboard controls: ${game.controls.keyboard}`,
      ],
      decisions: [
        { title: "Pure Engine vs. UI Separation", text: meta.designDecisions },
        { title: "Automated Testing", text: meta.testingNotes },
        { title: "Accessibility & Reduced Motion", text: meta.accessibilityNotes },
        { title: "Iteration & What Was Learned", text: meta.iterationLesson },
      ],
      solution: `Playable directly in the browser at /games/${game.slug} with source code inspectable in ${meta.enginePath} and ${meta.uiPath}.`,
    },
  };
});

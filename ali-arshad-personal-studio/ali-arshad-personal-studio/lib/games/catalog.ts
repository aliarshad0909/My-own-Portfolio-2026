/**
 * Original 20-game interactive browser experiments catalog.
 *
 * Governance:
 *  - Every single one of the 20 games is genuinely playable, built from scratch
 *    in TypeScript & React with original names, rules, SVG art, and tests.
 *  - Zero copied game branding, artwork, or third-party source code.
 *  - Clearly labeled "Original Portfolio Experiment" — separated from services,
 *    client work, and commercial SaaS demonstrations.
 */

export const GAME_CATEGORIES = [
  "Line & Path",
  "Grid & Logic",
  "Memory & Sequence",
  "Word & Number",
  "Arcade & Reaction",
  "Visual & Color",
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

export type GameSlug =
  | "signal-link"
  | "circuit-turn"
  | "knight-relay"
  | "pulse-grid"
  | "glyph-sudoku"
  | "mosaic-clues"
  | "mine-sweep-lab"
  | "studio-pairs"
  | "echo-pads"
  | "flash-matrix"
  | "cipher-five"
  | "sum-shift"
  | "equation-forge"
  | "slide-order"
  | "reflex-gate"
  | "orbit-catch"
  | "target-burst"
  | "chroma-match"
  | "contrast-judge"
  | "gradient-sort";

export type GameDefinition = {
  slug: GameSlug;
  title: string;
  tagline: string;
  category: GameCategory;
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
  /* ── 1. Line & Path Puzzles ─────────────────────────────────────────── */
  {
    slug: "signal-link",
    title: "Signal Link",
    tagline: "Connect matching lettered node pairs across a circuit grid without crossing wires.",
    category: "Line & Path",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Route non-overlapping orthogonal paths between matching signal nodes across 5×5, 6×6, and 7×7 boards. Every handcrafted level has a verified 100% full-grid solution.",
    objective:
      "Connect every matching pair of nodes (A–A, B–B, C–C, …) along horizontal and vertical steps without crossing another pair's wire.",
    instructions: [
      "Pick any lettered node to start routing that signal pair.",
      "Drag across adjacent horizontal or vertical squares — or tap step-by-step — until you reach the matching node.",
      "Step back onto a previous cell in the same wire to backtrack, or use Undo / Clear Pair.",
      "Connect all pairs to complete the level, and aim for 100% grid coverage.",
    ],
    controls: {
      pointer: "Click or drag from a node across adjacent squares.",
      keyboard: "Arrow keys move grid focus; Enter/Space starts or extends the wire; Backspace undoes; Escape deselects.",
    },
    difficultyModes: ["Relay (5×5)", "Switchboard (6×6)", "Core Matrix (7×7)"],
    mechanics: ["Orthogonal pathfinding", "Zero-crossing constraint", "Dual color + letter encoding"],
    estimatedTime: "2–5 min",
    accentColor: "#ff7a5c",
  },
  {
    slug: "circuit-turn",
    title: "Circuit Turn",
    tagline: "Rotate conduit tiles so power flows cleanly from the source terminal to the sink.",
    category: "Line & Path",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Each tile holds a straight, corner, or T-junction conduit. Rotate pieces 90° clockwise to complete an unbroken powered route from the left source to the right terminal.",
    objective:
      "Rotate grid conduits until live coral power reaches the destination terminal in as few turns as possible.",
    instructions: [
      "Click or activate any conduit tile to rotate it 90° clockwise.",
      "Powered segments connected to the Source terminal illuminate immediately.",
      "Align an unbroken path into the Sink terminal to clear the circuit.",
      "Switch between 4×4 Relay and 5×5 Backbone layouts or restart anytime.",
    ],
    controls: {
      pointer: "Click or tap any conduit tile to rotate it 90° clockwise.",
      keyboard: "Arrow keys move across tiles; Enter or Space rotates the focused tile.",
    },
    difficultyModes: ["Relay (4×4)", "Junction (4×4)", "Backbone (5×5)"],
    mechanics: ["BFS power propagation", "Modular tile rotation", "Guaranteed solvable circuits"],
    estimatedTime: "1–3 min",
    accentColor: "#ff7a5c",
  },
  {
    slug: "knight-relay",
    title: "Knight Relay",
    tagline: "Guide an L-jumping signal relay across the grid to visit every target beacon once.",
    category: "Line & Path",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Move in classic 2-by-1 knight jumps across compact studio boards to capture every beacon without landing on the same square twice.",
    objective:
      "Reach every highlighted beacon using legal L-shaped jumps without revisiting a square.",
    instructions: [
      "Legal next landing squares are highlighted cleanly on the board.",
      "Select any valid L-jump square to advance your relay trail.",
      "Use Undo if you corner yourself, or Restart to try a fresh route.",
      "Visit every beacon on the board to clear the level.",
    ],
    controls: {
      pointer: "Click or tap any highlighted legal landing square.",
      keyboard: "Arrow keys focus cells; Enter or Space jumps to a highlighted square.",
    },
    difficultyModes: ["Scout (5×5 · 6 beacons)", "Sweep (5×5 · 8 beacons)", "Mesh (6×6 · 9 beacons)"],
    mechanics: ["Knight-graph traversal", "Self-avoiding trail", "Undo & dead-end check"],
    estimatedTime: "2–4 min",
    accentColor: "#f5c451",
  },

  /* ── 2. Grid & Logic Puzzles ────────────────────────────────────────── */
  {
    slug: "pulse-grid",
    title: "Pulse Grid",
    tagline: "Clear an array of coupled alert nodes using orthogonal parity toggles.",
    category: "Grid & Logic",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Toggling any tile flips its state and its orthogonal neighbors. Every curated board and generated shuffle is guaranteed solvable, complete with a deterministic hint solver.",
    objective:
      "Turn off every active coral alert node on the grid while trying to match or beat par.",
    instructions: [
      "Select any tile to toggle that tile plus its up, down, left, and right neighbors.",
      "Use Hint to highlight one guaranteed valid next toggle at any point.",
      "Use Undo or Restart to refine your move count.",
      "Explore 3×3, 4×4, and 5×5 curated boards or generate a fresh shuffle.",
    ],
    controls: {
      pointer: "Click or tap any tile to toggle it and its orthogonal neighbors.",
      keyboard: "Arrow keys navigate tiles; Enter or Space toggles the focused tile.",
    },
    difficultyModes: ["Starter (3×3)", "Standard (4×4)", "Challenge (5×5)"],
    mechanics: ["GF(2) parity logic", "Guaranteed-solvable shuffles", "Deterministic hint solver"],
    estimatedTime: "1–4 min",
    accentColor: "#38bdf8",
  },
  {
    slug: "glyph-sudoku",
    title: "Mini Lattice",
    tagline: "Fill 4×4 and 6×6 logic lattices so every row, column, and box holds unique values.",
    category: "Grid & Logic",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A clean, fast-paced number deduction lattice with live duplicate conflict warnings, keyboard digit entry, curated unique-solution puzzles, and an on-demand hint.",
    objective:
      "Fill every empty cell so each row, column, and sub-box contains each number exactly once.",
    instructions: [
      "Select an unlocked cell, then choose a digit from the keypad or press number keys 1–4 (or 1–6).",
      "Conflicting duplicates in the same row, column, or box highlight immediately.",
      "Press Backspace / Clear to empty a cell, or use Hint to reveal one valid value.",
      "Complete all empty cells cleanly to solve the lattice.",
    ],
    controls: {
      pointer: "Click a cell, then click a number button to fill or clear.",
      keyboard: "Arrow keys navigate cells; digits 1–6 enter values; Backspace or 0 clears.",
    },
    difficultyModes: ["Compact (4×4)", "Classic (4×4 Hard)", "Studio (6×6)"],
    mechanics: ["Constraint deduction", "Live conflict detection", "Deterministic puzzle hints"],
    estimatedTime: "2–5 min",
    accentColor: "#38bdf8",
  },
  {
    slug: "mosaic-clues",
    title: "Mosaic Clues",
    tagline: "Decode row and column run-length clues to reveal hidden 5×5 pixel emblems.",
    category: "Grid & Logic",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "An original 5×5 picture-logic puzzle where numeric row and column headers describe consecutive filled blocks. Deduce each pattern without guessing.",
    objective:
      "Fill the exact squares specified by every row and column clue to uncover the hidden geometric mark.",
    instructions: [
      "Numbers on the left and top show the length of consecutive filled blocks in that row or column.",
      "Click a square to fill it; switch to Mark Empty mode (or right-click) to cross off squares you know are blank.",
      "Satisfied row and column clues turn emerald as you progress.",
      "Match all row and column clues simultaneously to complete the emblem.",
    ],
    controls: {
      pointer: "Left-click fills a square; right-click or Mark Empty toggle crosses off blanks.",
      keyboard: "Arrow keys navigate; Enter/Space fills; X marks or unmarks blank.",
    },
    difficultyModes: ["Prism (5×5)", "Bolt (5×5)", "Anchor (5×5)", "Beacon (5×5)"],
    mechanics: ["Run-length deduction", "Row & column clue validation", "Fill & mark-blank modes"],
    estimatedTime: "2–4 min",
    accentColor: "#a78bfa",
  },
  {
    slug: "mine-sweep-lab",
    title: "Hazard Sweep",
    tagline: "Clear safe cells on a compact logic grid using numeric adjacency clues.",
    category: "Grid & Logic",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A streamlined studio mine-deduction board with guaranteed safe first clicks, automatic zero-zone expansion, and accessible Flag Mode for mouse, touch, and keyboard.",
    objective:
      "Reveal every safe cell on the grid without triggering a hidden hazard.",
    instructions: [
      "Your very first reveal is always guaranteed safe and opens an initial pocket.",
      "Revealed numbers indicate how many hazards touch that square (including diagonals).",
      "Toggle Flag Mode (or right-click / press F) to mark suspected hazards.",
      "Reveal all safe cells to clear the board.",
    ],
    controls: {
      pointer: "Click to reveal; right-click or enable Flag Mode to mark hazards.",
      keyboard: "Arrow keys navigate; Enter/Space reveals; F toggles flag on the focused tile.",
    },
    difficultyModes: ["Compact (6×6 · 6 hazards)", "Standard (8×8 · 10 hazards)"],
    mechanics: ["Safe-first-click generation", "Flood-fill reveal", "Keyboard & touch flag toggle"],
    estimatedTime: "2–4 min",
    accentColor: "#fb7185",
  },

  /* ── 3. Memory & Sequence ───────────────────────────────────────────── */
  {
    slug: "studio-pairs",
    title: "Studio Pairs",
    tagline: "Match original geometric emblems across responsive memory card boards.",
    category: "Memory & Sequence",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Flip 10 custom-drawn geometric SVG emblems to match pairs across 12-, 16-, and 20-card layouts with move counts, elapsed timer, and reduced-motion instant flips.",
    objective:
      "Uncover and lock every pair of matching geometric emblems in the fewest moves.",
    instructions: [
      "Flip any face-down card to reveal its emblem and name.",
      "Flip a second card: matches stay locked; mismatches hide briefly (or on your next pick).",
      "Switch between Compact (6 pairs), Standard (8 pairs), and Extended (10 pairs).",
      "Beat your session best move count.",
    ],
    controls: {
      pointer: "Click or tap any face-down card to flip it.",
      keyboard: "Arrow keys navigate cards; Enter or Space flips the focused card.",
    },
    difficultyModes: ["Compact (6 pairs)", "Standard (8 pairs)", "Extended (10 pairs)"],
    mechanics: ["10 original SVG emblems", "Live elapsed timer", "Reduced-motion instant flip"],
    estimatedTime: "1–3 min",
    accentColor: "#34d399",
  },
  {
    slug: "echo-pads",
    title: "Echo Pads",
    tagline: "Watch illuminated studio signal pads and repeat escalating sequence patterns.",
    category: "Memory & Sequence",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A numbered 4-pad and 6-pad sequence recall test built with crisp visual step readouts so every sequence stays clear with or without motion.",
    objective:
      "Watch each flashed sequence carefully and reproduce it in order through Round 6 (or keep going for a higher streak).",
    instructions: [
      "Press Start Sequence to watch the studio pads flash one step at a time.",
      "Repeat the exact sequence by clicking pads or pressing number keys 1–4 (or 1–6).",
      "Each cleared round adds one more step to the sequence.",
      "Reach Round 6 to clear the challenge, or switch to 6-Pad Expert mode.",
    ],
    controls: {
      pointer: "Click or tap the illuminated studio pads in sequence.",
      keyboard: "Press number keys 1–4 (or 1–6 in Expert mode), or Tab + Enter.",
    },
    difficultyModes: ["4-Pad Standard (6 rounds)", "6-Pad Extended (6 rounds)"],
    mechanics: ["Escalating sequence playback", "Dual number + color coding", "Keyboard number shortcuts"],
    estimatedTime: "1–3 min",
    accentColor: "#34d399",
  },
  {
    slug: "flash-matrix",
    title: "Flash Matrix",
    tagline: "Memorize a brief spatial constellation on a grid, then reconstruct it from memory.",
    category: "Memory & Sequence",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Study highlighted grid tiles during a short preview window, then click or keyboard-select the exact coordinates to clear five progressively denser rounds.",
    objective:
      "Reproduce all highlighted cells across 5 rounds with minimal mistakes.",
    instructions: [
      "Press Show Pattern to view the highlighted coordinates for a brief preview.",
      "Once the tiles conceal, select every cell that was illuminated.",
      "Complete all target cells in a round to advance to a larger pattern.",
      "Clear Round 5 to finish the full recall drill.",
    ],
    controls: {
      pointer: "Click or tap grid squares during the recall phase.",
      keyboard: "Arrow keys navigate grid squares; Enter or Space selects a cell.",
    },
    difficultyModes: ["4×4 Spatial Recall (5 rounds)", "5×5 Deep Recall (5 rounds)"],
    mechanics: ["Timed visual encoding", "Progressive pattern density", "Live mistake counter"],
    estimatedTime: "1–3 min",
    accentColor: "#38bdf8",
  },

  /* ── 4. Word & Number Puzzles ───────────────────────────────────────── */
  {
    slug: "cipher-five",
    title: "Cipher Five",
    tagline: "Crack a hidden 5-letter engineering or design word in six logical guesses.",
    category: "Word & Number",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A studio-themed 5-letter word deduction puzzle featuring 60 curated product, code, and creative words, dual color + symbol letter feedback, and full on-screen + physical keyboard input.",
    objective:
      "Identify the secret 5-letter word within 6 attempts using exact-spot and misplaced-letter clues.",
    instructions: [
      "Type any 5-letter word using your keyboard or the on-screen keys and press Enter.",
      "Emerald tiles (✓) mark letters in the exact spot; amber tiles (~) mark letters present elsewhere; dark tiles mark absent letters.",
      "Use clues from previous rows to narrow down the hidden studio term.",
      "Click New Word anytime for a fresh puzzle.",
    ],
    controls: {
      pointer: "Click letters on the on-screen keyboard, then press Enter.",
      keyboard: "Type A–Z directly, Backspace to delete, Enter to submit a 5-letter guess.",
    },
    difficultyModes: ["60-Word Studio Lexicon"],
    mechanics: ["Exact/present/absent evaluation", "Dual color + symbol badges", "Physical & on-screen keyboard"],
    estimatedTime: "2–4 min",
    accentColor: "#f5c451",
  },
  {
    slug: "sum-shift",
    title: "Sum Shift",
    tagline: "Slide and merge matching power-of-two tiles across a 4×4 board toward 256 or 512.",
    category: "Word & Number",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Shift every tile simultaneously along one axis so identical numbers combine. Includes one-step Undo, directional buttons for touch/mouse, and keyboard arrow/WASD support.",
    objective:
      "Combine matching numbers cleanly to forge a 256 (Sprint) or 512 (Classic) tile before the grid locks.",
    instructions: [
      "Use Arrow keys, WASD, or the directional controls to slide all tiles in one direction.",
      "When two equal tiles collide, they merge into their sum and increase your score.",
      "Each valid move spawns a fresh 2 or 4 tile in an empty square.",
      "Use Undo to recover from a misstep, or Restart for a clean grid.",
    ],
    controls: {
      pointer: "Click the directional controls (Up / Down / Left / Right).",
      keyboard: "Arrow keys or W / A / S / D slide the board.",
    },
    difficultyModes: ["Sprint (Goal 256)", "Classic (Goal 512)"],
    mechanics: ["4-axis merge engine", "Step undo", "Score & highest-tile tracker"],
    estimatedTime: "2–5 min",
    accentColor: "#ff7a5c",
  },
  {
    slug: "equation-forge",
    title: "Equation Forge",
    tagline: "Combine four studio numbers with basic operators to hit the exact target value.",
    category: "Word & Number",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Pick two numbers and an operation (+, −, ×, ÷) to fuse them into a new intermediate value until you synthesize the exact target across curated, guaranteed-solvable challenges.",
    objective:
      "Use the four starting numbers through step-by-step arithmetic operations to produce the target integer.",
    instructions: [
      "Select a first number card, choose an operator (+, −, ×, ÷), then select a second number card.",
      "The pair merges into a single result tile — repeat until one tile matches the target.",
      "Use Undo Step or Reset Puzzle if you want to explore a different order.",
      "Use Hint to reveal one valid opening step if you get stuck.",
    ],
    controls: {
      pointer: "Click number cards and operator buttons in sequence.",
      keyboard: "Tab and Enter/Space to select numbers and operators.",
    },
    difficultyModes: ["6 Curated Target Puzzles"],
    mechanics: ["Stepwise arithmetic synthesis", "Exact integer division guard", "Curated step hints"],
    estimatedTime: "2–4 min",
    accentColor: "#f5c451",
  },
  {
    slug: "slide-order",
    title: "Tile Shift",
    tagline: "Slide numbered tiles into ascending order across solvable 3×3 and 4×4 frames.",
    category: "Word & Number",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Classic spatial sliding-tile puzzle generated strictly via legal reverse moves so every scramble is 100% guaranteed solvable, with instant keyboard arrow sliding.",
    objective:
      "Arrange numbered tiles 1 through 8 (or 1 through 15) in reading order with the blank space in the bottom-right corner.",
    instructions: [
      "Click any tile adjacent to the empty slot to slide it into place.",
      "Or use Arrow keys to slide an adjacent tile into the open space.",
      "Tiles already sitting in their correct final position highlight softly in emerald.",
      "Switch between 3×3 Sprint and 4×4 Classic boards anytime.",
    ],
    controls: {
      pointer: "Click or tap any tile orthogonally adjacent to the open slot.",
      keyboard: "Arrow keys slide the neighboring tile into the empty space.",
    },
    difficultyModes: ["Sprint (3×3 · 8 tiles)", "Classic (4×4 · 15 tiles)"],
    mechanics: ["Guaranteed-solvable scramble", "Correct-slot visual indicator", "Move counter"],
    estimatedTime: "1–4 min",
    accentColor: "#38bdf8",
  },

  /* ── 5. Arcade & Reaction ───────────────────────────────────────────── */
  {
    slug: "reflex-gate",
    title: "Reflex Gate",
    tagline: "Measure your visual reaction speed across five randomized signal gates.",
    category: "Arcade & Reaction",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Wait for the armed obsidian gate to flip to emerald GO, then trigger as fast as you can. Guards against false starts and computes per-round and 5-round average latency in milliseconds.",
    objective:
      "Complete 5 clean signal triggers without jumping the gate and chase your lowest average millisecond time.",
    instructions: [
      "Press Arm Gate (or Space) to start a round.",
      "Hold steady while the gate displays WAIT — clicking early records a false start and lets you retry.",
      "The instant the panel turns bright emerald and displays GO!, click or press Space.",
      "Finish 5 clean triggers to see your average and fastest reaction time.",
    ],
    controls: {
      pointer: "Click or tap the signal gate area.",
      keyboard: "Press Space or Enter to arm and trigger the gate.",
    },
    difficultyModes: ["5-Round Precision Bench"],
    mechanics: ["High-resolution millisecond timer", "False-start detection", "5-round summary stats"],
    estimatedTime: "1 min",
    accentColor: "#34d399",
  },
  {
    slug: "orbit-catch",
    title: "Orbit Catch",
    tagline: "Lock a moving signal cursor inside the coral capture window across escalating speeds.",
    category: "Arcade & Reaction",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A crisp timing-precision challenge: trigger Capture when the scanning marker crosses the center coral zone. Includes a reduced-motion discrete-step mode so everyone can play comfortably.",
    objective:
      "Land 8 accurate captures across progressively narrower, faster target windows.",
    instructions: [
      "Press Start to launch the scanning cursor along the precision rail.",
      "Click Capture or press Space when the cursor enters the highlighted coral capture band.",
      "Landing near the center awards a Perfect hit and raises your streak; missing costs one of 3 shields.",
      "Complete 8 captures to clear the run.",
    ],
    controls: {
      pointer: "Click or tap the Capture button.",
      keyboard: "Press Space or Enter to trigger Capture.",
    },
    difficultyModes: ["Standard Run (8 captures · 3 shields)"],
    mechanics: ["Precision timing window", "Escalating difficulty", "Reduced-motion discrete mode"],
    estimatedTime: "1–2 min",
    accentColor: "#ff7a5c",
  },
  {
    slug: "target-burst",
    title: "Target Burst",
    tagline: "Clear popping signal beacons across a 4×4 studio grid during a 20-second sprint.",
    category: "Arcade & Reaction",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "A snappy 20-second accuracy and speed drill: hit each illuminated beacon as it hops across a 4×4 grid while tracking combo streaks, total hits, and click accuracy.",
    objective:
      "Score as many clean beacon hits as possible within 20 seconds while keeping accuracy high.",
    instructions: [
      "Press Start Sprint to begin the 20-second countdown.",
      "Click or activate the active coral beacon tile — each hit immediately spawns the next beacon.",
      "Consecutive clean hits build your combo streak; missed tiles reset the streak.",
      "Review total hits, best streak, and accuracy at the end of the sprint.",
    ],
    controls: {
      pointer: "Click or tap the illuminated coral beacon square.",
      keyboard: "Arrow keys navigate squares; Enter or Space hits the focused beacon.",
    },
    difficultyModes: ["20-Second Precision Sprint"],
    mechanics: ["20s countdown clock", "Live accuracy & combo tracking", "Instant replay"],
    estimatedTime: "1 min",
    accentColor: "#ff7a5c",
  },

  /* ── 6. Visual & Color Challenges ───────────────────────────────────── */
  {
    slug: "chroma-match",
    title: "Chroma Match",
    tagline: "Dial Hue, Saturation, and Lightness sliders by eye to match studio color swatches.",
    category: "Visual & Color",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Train your visual design eye by tuning accessible HSL range controls until your live preview swatch matches five curated target colors within 92% accuracy.",
    objective:
      "Match all 5 studio target swatches by balancing Hue, Saturation, and Lightness.",
    instructions: [
      "Compare the Target swatch on the left with Your Mix on the right.",
      "Adjust the Hue (0–360°), Saturation (0–100%), and Lightness (0–100%) sliders.",
      "Click Lock Match to score your perceptual match accuracy and advance through 5 rounds.",
      "Aim for an average accuracy above 90% across all five swatches.",
    ],
    controls: {
      pointer: "Drag the Hue, Saturation, and Lightness sliders, then click Lock Match.",
      keyboard: "Tab to each slider and adjust with Arrow keys; press Enter on Lock Match.",
    },
    difficultyModes: ["5-Swatch Designer Eye Test"],
    mechanics: ["Live HSL color synthesizer", "Perceptual RGB match score", "Accessible range inputs"],
    estimatedTime: "2–3 min",
    accentColor: "#a78bfa",
  },
  {
    slug: "contrast-judge",
    title: "Contrast Judge",
    tagline: "Grade live UI card pairings for WCAG 2.2 Fail, AA, or AAA contrast compliance.",
    category: "Visual & Color",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Built straight from our accessible brand-system workflow: inspect 8 realistic text-on-surface pairs, predict whether they Fail, pass AA (≥ 4.5:1), or pass AAA (≥ 7:1), and verify the exact luminance ratio.",
    objective:
      "Correctly classify all 8 UI foreground/background pairings using real WCAG 2.2 relative luminance math.",
    instructions: [
      "Inspect the rendered sample UI card showing normal body-sized text on a surface.",
      "Choose whether the contrast ratio is Fail (< 4.5:1), Pass AA (4.5:1–6.99:1), or Pass AAA (≥ 7.0:1).",
      "Immediately inspect the exact calculated WCAG luminance ratio before moving to the next card.",
      "Complete all 8 pairings to review your accessibility calibration score.",
    ],
    controls: {
      pointer: "Click Fail, Pass AA, or Pass AAA, then Next Pairing.",
      keyboard: "Tab and Enter/Space to select grades and advance.",
    },
    difficultyModes: ["8-Card WCAG 2.2 Calibration"],
    mechanics: ["Exact WCAG 2.2 luminance math", "Real hex token readout", "Instant educational feedback"],
    estimatedTime: "2–3 min",
    accentColor: "#34d399",
  },
  {
    slug: "gradient-sort",
    title: "Spectrum Order",
    tagline: "Unscramble color spectrum tiles between two fixed anchors into a smooth gradient.",
    category: "Visual & Color",
    experimentLabel: "Original Portfolio Experiment",
    summary:
      "Swap movable swatch tiles between locked start and end anchors until the entire color band transitions smoothly across three handcrafted palettes (Coral Dusk, Ocean Teal, Studio Prism).",
    objective:
      "Reorder all scrambled middle tiles into an unbroken visual color transition between the locked end anchors.",
    instructions: [
      "The first and last swatches are locked anchors showing the gradient endpoints.",
      "Select one movable tile, then select a second movable tile to swap their positions.",
      "Toggle Index Hints if you want numeric step guidance alongside visual hue inspection.",
      "Align every swatch in smooth order to clear the palette.",
    ],
    controls: {
      pointer: "Click one movable swatch, then click another to swap.",
      keyboard: "Arrow keys or Tab move between swatches; Enter/Space selects and swaps.",
    },
    difficultyModes: ["Coral Dusk (6 tiles)", "Ocean Signal (7 tiles)", "Studio Prism (8 tiles)"],
    mechanics: ["HSL spectrum interpolation", "Two-click tile swap", "Optional accessible step hints"],
    estimatedTime: "1–3 min",
    accentColor: "#a78bfa",
  },
];

export function getGame(slug: string): GameDefinition | undefined {
  return STUDIO_GAMES.find((g) => g.slug === slug);
}

export function allGameSlugs(): GameSlug[] {
  return STUDIO_GAMES.map((g) => g.slug);
}

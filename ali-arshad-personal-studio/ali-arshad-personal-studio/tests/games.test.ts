import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_CATEGORIES, STUDIO_GAMES, allGameSlugs, getGame } from "@/lib/games/catalog";
import {
  CHROMA_TARGETS,
  CONTRAST_SAMPLES,
  SPECTRUM_PALETTES,
  buildSpectrumOrdered,
  chromaMatchScore,
  evaluateOrbitHit,
  generateEchoSequence,
  generateFlashPattern,
  isSpectrumSorted,
  pickNextTargetCell,
  reflexStats,
  scrambleSpectrum,
  wcagContrastRatio,
  wcagGradeFor,
} from "@/lib/games/engines-memory-arcade-color";
import {
  CIRCUIT_LEVELS,
  KNIGHT_LEVELS,
  LATTICE_PUZZLES,
  MOSAIC_PUZZLES,
  computeCircuitPower,
  createCircuitState,
  createKnightState,
  createLatticeState,
  createSweepState,
  isKnightMove,
  isKnightSolved,
  isLatticeSolved,
  isMosaicSolved,
  latticeConflicts,
  mosaicCluesFor,
  revealSweepCell,
  rotateCircuitTile,
  setLatticeValue,
  stepKnight,
  toggleSweepFlag,
  undoKnight,
} from "@/lib/games/engines-path-logic";
import {
  CIPHER_WORDS,
  EQUATION_CHALLENGES,
  combineEquationTiles,
  createEquationState,
  createSlideState,
  createSumShiftState,
  evaluateCipherGuess,
  isEquationSolved,
  isSlideSolved,
  moveSumShift,
  slideTileAt,
  solvedSlideBoard,
} from "@/lib/games/engines-word-number";
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
} from "@/lib/games/pulse-grid";
import {
  SIGNAL_LEVELS,
  clearSignalPair,
  coordKey,
  countConnectedPairs,
  coverageStats,
  createSignalState,
  extendSignalPath,
  isAdjacent,
  isSignalLevelSolved,
  sameCoord,
  selectSignalCell,
  undoActiveSignalStep,
} from "@/lib/games/signal-link";
import {
  clearPairsMismatch,
  createPairsState,
  flipPairCard,
  isPairsSolved,
} from "@/lib/games/studio-pairs";
import { isKnownRoute } from "@/lib/seo/routes";
import { CORE_SITEMAP_PAGES } from "@/lib/site";
import { gameListSchema, gameSchema } from "@/lib/structured-data";

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("20-game catalog, categories, routes, and structured data", () => {
  it("defines 20 original portfolio experiments across 6 genres registered in routes and JSON-LD", () => {
    assert.equal(STUDIO_GAMES.length, 20);
    const slugs = allGameSlugs();
    assert.equal(new Set(slugs).size, 20, "all 20 game slugs must be unique");
    assert.ok(isKnownRoute("/games"));
    assert.ok(CORE_SITEMAP_PAGES.includes("/games"));

    for (const cat of GAME_CATEGORIES) {
      const count = STUDIO_GAMES.filter((g) => g.category === cat).length;
      assert.ok(count >= 3, `category "${cat}" should have at least 3 games (got ${count})`);
    }

    for (const game of STUDIO_GAMES) {
      assert.equal(game.experimentLabel, "Original Portfolio Experiment");
      assert.equal(getGame(game.slug)?.title, game.title);
      assert.ok(isKnownRoute(`/games/${game.slug}`));
      assert.ok(game.instructions.length >= 3, `${game.slug} missing clear instructions`);
      assert.ok(game.controls.pointer.length > 4 && game.controls.keyboard.length > 4, `${game.slug} missing control hints`);

      const schema = gameSchema(game);
      assert.equal(schema["@type"], "VideoGame");
      assert.equal(schema.isAccessibleForFree, true);
      assert.ok(schema.author["@id"].endsWith("/#person"));
      assert.ok(!JSON.stringify(schema).includes("aggregateRating"));
    }

    const list = gameListSchema(STUDIO_GAMES);
    assert.equal(list["@type"], "ItemList");
    assert.equal(list.itemListElement.length, 20);
  });
});

describe("Line & Path engines (Signal Link, Circuit Turn, Knight Relay)", () => {
  it("Signal Link ships 3 levels whose reference solutions partition 100% of grid cells without overlap", () => {
    for (const level of SIGNAL_LEVELS) {
      const visited = new Set<string>();
      for (const pair of level.pairs) {
        assert.ok(sameCoord(pair.solution[0], pair.start));
        assert.ok(sameCoord(pair.solution[pair.solution.length - 1], pair.end));
        assert.equal(isAdjacent(pair.start, pair.end), false);
        for (let i = 0; i < pair.solution.length; i += 1) {
          const cell = pair.solution[i];
          assert.ok(cell.row >= 0 && cell.row < level.size && cell.col >= 0 && cell.col < level.size);
          const key = coordKey(cell);
          assert.ok(!visited.has(key));
          visited.add(key);
          if (i > 0) assert.ok(isAdjacent(pair.solution[i - 1], cell));
        }
      }
      assert.equal(visited.size, level.size * level.size);
    }

    let state = createSignalState(0);
    const level = SIGNAL_LEVELS[0];
    for (const pair of level.pairs) {
      state = selectSignalCell(state, pair.solution[0]);
      for (let i = 1; i < pair.solution.length; i += 1) {
        state = extendSignalPath(state, pair.solution[i]);
      }
    }
    assert.equal(isSignalLevelSolved(level, state.paths), true);
    assert.equal(countConnectedPairs(level, state.paths), level.pairs.length);
    assert.equal(coverageStats(level, state.paths).percent, 100);

    state = clearSignalPair(state, "D");
    assert.equal(isSignalLevelSolved(level, state.paths), false);
    state = selectSignalCell(state, { row: 3, col: 1 });
    state = extendSignalPath(state, { row: 3, col: 2 });
    assert.equal(state.paths.D.length, 1);
    state = extendSignalPath(state, { row: 2, col: 1 });
    assert.equal(state.paths.D.length, 2);
    state = undoActiveSignalStep(state);
    assert.equal(state.paths.D.length, 1);
  });

  it("Circuit Turn levels start unsolved and power source-to-sink when rotated to solvedRot", () => {
    for (let i = 0; i < CIRCUIT_LEVELS.length; i += 1) {
      const level = CIRCUIT_LEVELS[i];
      const start = createCircuitState(i);
      assert.equal(computeCircuitPower(level, start.rots).solved, false, `${level.id} must start unsolved`);
      const solvedRots = level.tiles.map((t) => t.solvedRot);
      assert.equal(computeCircuitPower(level, solvedRots).solved, true, `${level.id} solvedRot must power sink`);
    }
    let st = createCircuitState(0);
    const before = st.rots[4];
    st = rotateCircuitTile(st, 4);
    assert.equal(st.rots[4], (before + 1) % 4);
    assert.equal(st.moves, 1);
  });

  it("Knight Relay levels contain strictly legal knight tours and support step/undo/solve", () => {
    for (let i = 0; i < KNIGHT_LEVELS.length; i += 1) {
      const level = KNIGHT_LEVELS[i];
      assert.equal(new Set(level.solution).size, level.solution.length, `${level.id} must not repeat squares`);
      let st = createKnightState(i);
      assert.equal(isKnightSolved(st), false);
      for (let step = 1; step < level.solution.length; step += 1) {
        assert.ok(isKnightMove(level.size, level.solution[step - 1], level.solution[step]));
        st = stepKnight(st, level.solution[step]);
      }
      assert.equal(isKnightSolved(st), true);
      st = undoKnight(st);
      assert.equal(isKnightSolved(st), false);
    }
  });
});

describe("Grid & Logic engines (Pulse Grid, Mini Lattice, Mosaic Clues, Hazard Sweep)", () => {
  it("Pulse Grid guarantees curated and shuffled boards solve via GF(2) hints", () => {
    for (const preset of PULSE_PRESETS) {
      let state = createPulsePreset(preset.id);
      assert.ok(countActivePulseCells(state.cells) > 0);
      const hinted = requestPulseHint(state);
      assert.ok(hinted.hintIndex !== null);
      const afterOne = togglePulseCell(hinted, hinted.hintIndex!);
      assert.deepEqual(undoPulseMove(afterOne).cells, state.cells);
      while (!isPulseSolved(state)) {
        state = togglePulseCell(state, requestPulseHint(state).hintIndex!);
      }
      assert.equal(isPulseSolved(state), true);
      assert.equal(isPulseSolved(restartPulseState(state)), false);
    }

    let randomBoard = generateRandomPulseState(4, seededRng(42));
    while (!isPulseSolved(randomBoard)) {
      randomBoard = togglePulseCell(randomBoard, requestPulseHint(randomBoard).hintIndex!);
    }
    assert.equal(isPulseSolved(randomBoard), true);
  });

  it("Mini Lattice validates 4x4 & 6x6 sub-box/row/col conflicts and reference solutions", () => {
    for (let i = 0; i < LATTICE_PUZZLES.length; i += 1) {
      const p = LATTICE_PUZZLES[i];
      assert.equal(isLatticeSolved(p, p.solution), true, `${p.id} reference solution invalid`);
      const st = createLatticeState(i);
      assert.equal(isLatticeSolved(p, st.values), false);
      const emptyIdx = p.givens.findIndex((v) => v === 0);
      const updated = setLatticeValue(st, emptyIdx, p.solution[emptyIdx]);
      assert.equal(updated.values[emptyIdx], p.solution[emptyIdx]);
    }
    const conflictSet = latticeConflicts(LATTICE_PUZZLES[0], [1, 1, 0, 4, 0, 4, 1, 0, 2, 0, 4, 0, 0, 3, 0, 1]);
    assert.ok(conflictSet.has(0) && conflictSet.has(1));
  });

  it("Mosaic Clues generates exact run-length clues and validates solved patterns", () => {
    for (const p of MOSAIC_PUZZLES) {
      const clues = mosaicCluesFor(p.pattern, p.size);
      assert.equal(clues.rows.length, 5);
      assert.equal(clues.cols.length, 5);
      assert.equal(isMosaicSolved(p, p.pattern as (0 | 1 | 2)[]), true);
      assert.equal(isMosaicSolved(p, Array(25).fill(0)), false);
    }
  });

  it("Hazard Sweep guarantees a safe first click, flags cleanly, and wins when all safe cells reveal", () => {
    let st = createSweepState(6, 5);
    st = revealSweepCell(st, 0, seededRng(17));
    assert.equal(st.initialized, true);
    assert.notEqual(st.status, "lost");
    assert.equal(st.cells[0].mine, false);

    const unrevealedIdx = st.cells.findIndex((c) => !c.revealed);
    st = toggleSweepFlag(st, unrevealedIdx);
    assert.equal(st.cells[unrevealedIdx].flagged, true);
    st = toggleSweepFlag(st, unrevealedIdx);

    for (let i = 0; i < st.cells.length; i += 1) {
      if (!st.cells[i].mine && !st.cells[i].revealed) {
        st = revealSweepCell(st, i);
      }
    }
    assert.equal(st.status, "won");
  });
});

describe("Word & Number engines (Cipher Five, Sum Shift, Equation Forge, Tile Shift)", () => {
  it("Cipher Five evaluates duplicate letters accurately", () => {
    assert.ok(CIPHER_WORDS.length >= 45);
    assert.deepEqual(evaluateCipherGuess("STACK", "STACK"), ["exact", "exact", "exact", "exact", "exact"]);
    assert.deepEqual(evaluateCipherGuess("SCALE", "SLEEP"), ["exact", "present", "present", "absent", "absent"]);
  });

  it("Sum Shift merges adjacent powers of two and updates score cleanly", () => {
    const start = createSumShiftState(256, seededRng(7));
    assert.equal(start.board.filter((n) => n > 0).length, 2);
    const controlled = {
      ...start,
      board: [2, 2, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const moved = moveSumShift(controlled, "left", seededRng(8));
    assert.equal(moved.board[0], 4);
    assert.equal(moved.board[4], 8);
    assert.equal(moved.score, 12);
  });

  it("Equation Forge enforces exact integer division and solves challenge #1 (target 24)", () => {
    assert.equal(EQUATION_CHALLENGES.length, 6);
    const st = createEquationState(0); // [3, 4, 6, 2], target 24
    const badDiv = combineEquationTiles(st, 0, "/", 1); // 3 / 4
    assert.ok(badDiv.error);
    const step1 = combineEquationTiles(st, 2, "+", 3).state; // 6 + 2 = 8 -> tiles [3, 4, 8]
    const step2 = combineEquationTiles(step1, 0, "*", 2).state; // 3 * 8 = 24
    assert.equal(isEquationSolved(step2), true);
  });

  it("Tile Shift produces scrambled solvable boards and swaps adjacent tiles cleanly", () => {
    const scrambled = createSlideState(3, seededRng(101));
    assert.equal(isSlideSolved(scrambled), false);
    const nearSolved = { size: 3 as const, tiles: [1, 2, 3, 4, 5, 6, 7, 0, 8], moves: 0 };
    const solved = slideTileAt(nearSolved, 8);
    assert.deepEqual(solved.tiles, solvedSlideBoard(3));
    assert.equal(isSlideSolved(solved), true);
  });
});

describe("Memory, Arcade & Visual engines (Studio Pairs, Echo, Flash, Reflex, Orbit, Target, Chroma, Contrast, Spectrum)", () => {
  it("Studio Pairs handles mismatches and solves all pairs cleanly", () => {
    let state = createPairsState("compact", seededRng(99));
    assert.equal(state.cards.length, 12);
    const mismatchIdx = state.cards.findIndex((c, i) => i !== 0 && c.emblemId !== state.cards[0].emblemId);
    state = flipPairCard(flipPairCard(state, 0), mismatchIdx);
    assert.equal(state.mismatchPending, true);
    state = clearPairsMismatch(state);
    const byEmblem = new Map<string, number[]>();
    state.cards.forEach((c, idx) => {
      const list = byEmblem.get(c.emblemId) ?? [];
      list.push(idx);
      byEmblem.set(c.emblemId, list);
    });
    for (const [a, b] of byEmblem.values()) {
      state = flipPairCard(flipPairCard(state, a), b);
    }
    assert.equal(isPairsSolved(state), true);
  });

  it("Echo Pads, Flash Matrix, Reflex Gate, Orbit Catch, and Target Burst helpers stay bounded and deterministic", () => {
    const seq = generateEchoSequence(5, 4, seededRng(1));
    assert.equal(seq.length, 5);
    assert.ok(seq.every((v) => v >= 0 && v < 4));

    const pat = generateFlashPattern(4, 5, seededRng(2));
    assert.equal(pat.length, 5);
    assert.equal(new Set(pat).size, 5);

    const stats = reflexStats([240, 200, 280]);
    assert.equal(stats.avg, 240);
    assert.equal(stats.best, 200);

    assert.equal(evaluateOrbitHit(50, 12), "perfect");
    assert.equal(evaluateOrbitHit(60, 12), "hit");
    assert.equal(evaluateOrbitHit(80, 12), "miss");

    assert.notEqual(pickNextTargetCell(4, 16, () => 0.25), 4);
  });

  it("Chroma Match, WCAG 2.2 Contrast Judge, and Spectrum Order compute exact perceptual/accessibility values", () => {
    assert.equal(chromaMatchScore(CHROMA_TARGETS[0].color, CHROMA_TARGETS[0].color), 100);
    assert.ok(chromaMatchScore({ h: 0, s: 100, l: 50 }, { h: 180, s: 100, l: 50 }) < 50);

    assert.equal(wcagContrastRatio("#ffffff", "#000000"), 21);
    assert.equal(wcagGradeFor("#f8f5ef", "#090c11"), "aaa");
    assert.equal(wcagGradeFor("#ffffff", "#f5c451"), "fail");
    assert.equal(CONTRAST_SAMPLES.length, 8);

    for (const pal of SPECTRUM_PALETTES) {
      const ordered = buildSpectrumOrdered(pal);
      assert.equal(isSpectrumSorted(ordered), true);
      const scrambled = scrambleSpectrum(pal, seededRng(55));
      assert.equal(isSpectrumSorted(scrambled), false);
      assert.equal(scrambled[0].locked, true);
      assert.equal(scrambled[scrambled.length - 1].locked, true);
    }
  });
});

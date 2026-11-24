import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STUDIO_GAMES, allGameSlugs, getGame } from "@/lib/games/catalog";
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

describe("games catalog, routes, and structured data", () => {
  it("defines 3 original portfolio experiments registered in routes and JSON-LD", () => {
    assert.equal(STUDIO_GAMES.length, 3);
    assert.deepEqual(allGameSlugs(), ["signal-link", "pulse-grid", "studio-pairs"]);
    assert.ok(isKnownRoute("/games"));
    assert.ok(CORE_SITEMAP_PAGES.includes("/games"));

    for (const game of STUDIO_GAMES) {
      assert.equal(game.experimentLabel, "Original Portfolio Experiment");
      assert.equal(getGame(game.slug)?.title, game.title);
      assert.ok(isKnownRoute(`/games/${game.slug}`));
      assert.ok(game.instructions.length >= 3);

      const schema = gameSchema(game);
      assert.equal(schema["@type"], "VideoGame");
      assert.equal(schema.isAccessibleForFree, true);
      assert.ok(schema.author["@id"].endsWith("/#person"));
      assert.ok(!JSON.stringify(schema).includes("aggregateRating"));
    }

    const list = gameListSchema(STUDIO_GAMES);
    assert.equal(list["@type"], "ItemList");
    assert.equal(list.itemListElement.length, 3);
  });
});

describe("Signal Link line-matching puzzle engine", () => {
  it("ships 3 handcrafted levels whose reference solutions partition 100% of grid cells without overlap", () => {
    for (let idx = 0; idx < SIGNAL_LEVELS.length; idx += 1) {
      const level = SIGNAL_LEVELS[idx];
      const visited = new Set<string>();

      for (const pair of level.pairs) {
        assert.ok(sameCoord(pair.solution[0], pair.start), `${level.id} pair ${pair.id} start mismatch`);
        assert.ok(sameCoord(pair.solution[pair.solution.length - 1], pair.end), `${level.id} pair ${pair.id} end mismatch`);
        assert.equal(isAdjacent(pair.start, pair.end), false, `${level.id} pair ${pair.id} endpoints must not be adjacent`);

        for (let i = 0; i < pair.solution.length; i += 1) {
          const cell = pair.solution[i];
          assert.ok(cell.row >= 0 && cell.row < level.size && cell.col >= 0 && cell.col < level.size);
          const key = coordKey(cell);
          assert.ok(!visited.has(key), `${level.id} overlapping cell ${key}`);
          visited.add(key);
          if (i > 0) {
            assert.ok(isAdjacent(pair.solution[i - 1], cell), `${level.id} non-adjacent step in ${pair.id}`);
          }
        }
      }

      assert.equal(visited.size, level.size * level.size, `${level.id} solution must cover 100% of grid`);
    }
  });

  it("solves a board through user interactions, prevents crossings, and supports undo/clear", () => {
    let state = createSignalState(0);
    const level = SIGNAL_LEVELS[0];

    // Play the verified solution for every pair through selectSignalCell + extendSignalPath.
    for (const pair of level.pairs) {
      state = selectSignalCell(state, pair.solution[0]);
      for (let i = 1; i < pair.solution.length; i += 1) {
        state = extendSignalPath(state, pair.solution[i]);
      }
    }

    assert.equal(isSignalLevelSolved(level, state.paths), true);
    assert.equal(countConnectedPairs(level, state.paths), level.pairs.length);
    assert.equal(coverageStats(level, state.paths).percent, 100);

    // Clear pair D and confirm crossing into pair C's occupied cell is blocked.
    state = clearSignalPair(state, "D");
    assert.equal(isSignalLevelSolved(level, state.paths), false);
    state = selectSignalCell(state, { row: 3, col: 1 });
    state = extendSignalPath(state, { row: 3, col: 2 }); // Occupied by C endpoint!
    assert.equal(state.paths.D.length, 1, "must block stepping onto foreign pair endpoint");

    // Step to valid neighbor (2,1), then undo cleanly.
    state = extendSignalPath(state, { row: 2, col: 1 });
    assert.equal(state.paths.D.length, 2);
    state = undoActiveSignalStep(state);
    assert.equal(state.paths.D.length, 1);
  });
});

describe("Pulse Grid parity logic engine", () => {
  it("guarantees every curated preset and shuffled board is solvable via remainingSolution and supports hints/undo/restart", () => {
    for (const preset of PULSE_PRESETS) {
      let state = createPulsePreset(preset.id);
      assert.ok(countActivePulseCells(state.cells) > 0, `${preset.id} must start unsolved`);

      // Test hint -> apply -> undo -> restart cycle.
      const hinted = requestPulseHint(state);
      assert.ok(hinted.hintIndex !== null);
      const afterOne = togglePulseCell(hinted, hinted.hintIndex!);
      assert.equal(afterOne.moves, 1);
      const undone = undoPulseMove(afterOne);
      assert.equal(undone.moves, 0);
      assert.deepEqual(undone.cells, state.cells);

      // Follow deterministic hints all the way to solved.
      while (!isPulseSolved(state)) {
        const nextHint = requestPulseHint(state).hintIndex;
        assert.ok(nextHint !== null, `${preset.id} must always produce a valid hint while unsolved`);
        state = togglePulseCell(state, nextHint!);
      }
      assert.equal(isPulseSolved(state), true);
      assert.equal(state.moves, preset.seedToggles.length);

      const restarted = restartPulseState(state);
      assert.equal(restarted.moves, 0);
      assert.equal(isPulseSolved(restarted), false);
    }

    // Verify shuffled 4x4 board is also guaranteed solvable.
    let s = 42;
    const rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    let randomBoard = generateRandomPulseState(4, rng);
    assert.ok(countActivePulseCells(randomBoard.cells) > 0);
    while (!isPulseSolved(randomBoard)) {
      const h = requestPulseHint(randomBoard).hintIndex!;
      randomBoard = togglePulseCell(randomBoard, h);
    }
    assert.equal(isPulseSolved(randomBoard), true);
  });
});

describe("Studio Pairs memory matching engine", () => {
  it("handles mismatches, clears mismatches cleanly, and completes when all pairs match", () => {
    let s = 99;
    const rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    let state = createPairsState("compact", rng);
    assert.equal(state.cards.length, 12);
    assert.equal(state.totalPairs, 6);

    // Trigger a mismatch intentionally.
    const idx0 = 0;
    const mismatchIdx = state.cards.findIndex((c, i) => i !== idx0 && c.emblemId !== state.cards[idx0].emblemId);
    state = flipPairCard(state, idx0);
    state = flipPairCard(state, mismatchIdx);
    assert.equal(state.mismatchPending, true);
    assert.equal(state.moves, 1);

    state = clearPairsMismatch(state);
    assert.equal(state.mismatchPending, false);
    assert.deepEqual(state.flipped, []);

    // Match every remaining pair cleanly.
    const byEmblem = new Map<string, number[]>();
    state.cards.forEach((c, idx) => {
      const list = byEmblem.get(c.emblemId) ?? [];
      list.push(idx);
      byEmblem.set(c.emblemId, list);
    });

    for (const [a, b] of byEmblem.values()) {
      state = flipPairCard(state, a);
      state = flipPairCard(state, b);
    }

    assert.equal(isPairsSolved(state), true);
    assert.equal(state.matchedPairs, 6);
    assert.equal(state.moves, 7);
  });
});

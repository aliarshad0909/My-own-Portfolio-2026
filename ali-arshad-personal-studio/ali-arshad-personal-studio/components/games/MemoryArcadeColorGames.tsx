"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  CHROMA_TARGETS,
  CONTRAST_SAMPLES,
  SPECTRUM_PALETTES,
  chromaMatchScore,
  evaluateOrbitHit,
  generateEchoSequence,
  generateFlashPattern,
  hslCss,
  isSpectrumSorted,
  pickNextTargetCell,
  reflexStats,
  scrambleSpectrum,
  wcagContrastRatio,
  wcagGradeFor,
  type HslColor,
  type WcagGrade,
} from "@/lib/games/engines-memory-arcade-color";

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── 1. ECHO PADS ──────────────────────────────────────────────────────── */
const PAD_STYLES = [
  { label: "Alpha", color: "#ff7a5c" },
  { label: "Beacon", color: "#38bdf8" },
  { label: "Circuit", color: "#34d399" },
  { label: "Delta", color: "#f5c451" },
  { label: "Echo", color: "#a78bfa" },
  { label: "Flux", color: "#fb7185" },
];

export function EchoPadsGame() {
  const [padCount, setPadCount] = useState<4 | 6>(4);
  const [sequence, setSequence] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "won" | "failed">("idle");
  const [litPad, setLitPad] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState("Press Start Sequence to watch the illuminated pads.");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const playSequence = useCallback((seq: number[]) => {
    clearTimers();
    setPhase("showing");
    setStepIndex(0);
    setStatus(`Watching Round ${seq.length} (${seq.length} step${seq.length === 1 ? "" : "s"})…`);
    seq.forEach((pad, i) => {
      timers.current.push(
        window.setTimeout(() => setLitPad(pad), 350 + i * 650),
        window.setTimeout(() => setLitPad(null), 780 + i * 650),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setPhase("input");
        setStatus(`Your turn! Repeat all ${seq.length} pad(s) in order.`);
      }, 420 + seq.length * 650),
    );
  }, []);

  const startNew = (count: 4 | 6 = padCount) => {
    clearTimers();
    setPadCount(count);
    const seq = generateEchoSequence(1, count);
    setSequence(seq);
    setRound(1);
    playSequence(seq);
  };

  const handlePad = useCallback(
    (pad: number) => {
      if (phase !== "input") return;
      setLitPad(pad);
      window.setTimeout(() => setLitPad(null), 200);
      if (pad !== sequence[stepIndex]) {
        setPhase("failed");
        setStatus(`Missed on Round ${round} (expected Pad ${sequence[stepIndex] + 1}). Press Start Sequence to retry.`);
        return;
      }
      const nextStep = stepIndex + 1;
      if (nextStep === sequence.length) {
        if (round >= 6) {
          setPhase("won");
          setStatus("Cleared all 6 rounds of Echo Pads!");
          return;
        }
        const extended = [...sequence, Math.floor(Math.random() * padCount)];
        setSequence(extended);
        setRound((r) => r + 1);
        setPhase("showing");
        timers.current.push(window.setTimeout(() => playSequence(extended), 450));
      } else {
        setStepIndex(nextStep);
        setStatus(`Correct (${nextStep}/${sequence.length}).`);
      }
    },
    [padCount, phase, playSequence, round, sequence, stepIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= padCount) handlePad(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePad, padCount]);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Echo Pads mode">
          {([4, 6] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              className={`filter-chip ${padCount === cnt ? "is-active" : ""}`.trim()}
              aria-pressed={padCount === cnt}
              onClick={() => startNew(cnt)}
            >
              {cnt}-Pad Mode
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => startNew(padCount)}>
            <Icon name="play" size={15} />
            <span>{phase === "idle" ? "Start sequence" : "Restart"}</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Echo Pads progress">
        <div><dt>Round</dt><dd>{round} / 6</dd></div>
        <div><dt>Input progress</dt><dd>{stepIndex} / {sequence.length}</dd></div>
        <div><dt>Phase</dt><dd>{phase}</dd></div>
        <div><dt>Pads</dt><dd>{padCount}</dd></div>
      </dl>

      <div className={`echo-grid ${padCount === 6 ? "echo-grid--6" : ""}`.trim()} role="group" aria-label="Echo signal pads">
        {PAD_STYLES.slice(0, padCount).map((p, idx) => {
          const lit = litPad === idx;
          return (
            <button
              key={p.label}
              type="button"
              className={`echo-pad ${lit ? "is-lit" : ""}`.trim()}
              style={{
                borderColor: p.color,
                backgroundColor: lit ? p.color : "var(--surface)",
                color: lit ? "#090c11" : "var(--text)",
              }}
              disabled={phase !== "input"}
              aria-label={`Pad ${idx + 1}: ${p.label}`}
              onClick={() => handlePad(idx)}
            >
              <span style={{ fontSize: "1.3rem" }}>{idx + 1}</span>
              <span style={{ fontSize: "0.78rem", opacity: 0.9 }}>{p.label}</span>
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">{status}</p>

      {phase === "won" ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>Cleared all 6 rounds on {padCount}-Pad Echo Pads!</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => startNew(padCount)}>
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 2. FLASH MATRIX ───────────────────────────────────────────────────── */
export function FlashMatrixGame() {
  const [size, setSize] = useState<4 | 5>(4);
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<number[]>(() => generateFlashPattern(4, 4, seededRng(2026)));
  const [picked, setPicked] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<"ready" | "preview" | "recall" | "won">("ready");
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const beginRound = (nextSize: 4 | 5, nextRound: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const count = Math.min(nextSize * nextSize - 2, 3 + nextRound);
    const pattern = generateFlashPattern(nextSize, count);
    setSize(nextSize);
    setRound(nextRound);
    setTarget(pattern);
    setPicked([]);
    setPhase("preview");
    timerRef.current = window.setTimeout(() => setPhase("recall"), 1800);
  };

  const selectCell = (idx: number) => {
    if (phase !== "recall" || picked.includes(idx)) return;
    if (target.includes(idx)) {
      const next = [...picked, idx];
      setPicked(next);
      if (next.length === target.length) {
        if (round >= 5) setPhase("won");
        else beginRound(size, round + 1);
      }
    } else {
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Flash Matrix grid size">
          {([4, 5] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              className={`filter-chip ${size === sz ? "is-active" : ""}`.trim()}
              aria-pressed={size === sz}
              onClick={() => {
                setMistakes(0);
                beginRound(sz, 1);
              }}
            >
              {sz}×{sz} Matrix
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              setMistakes(0);
              beginRound(size, 1);
            }}
          >
            <Icon name="play" size={15} />
            <span>{phase === "ready" ? "Show pattern" : "Restart"}</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Flash Matrix progress">
        <div><dt>Round</dt><dd>{round} / 5</dd></div>
        <div><dt>Found</dt><dd>{picked.length} / {target.length}</dd></div>
        <div><dt>Mistakes</dt><dd>{mistakes}</dd></div>
        <div><dt>Phase</dt><dd>{phase}</dd></div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, maxWidth: "360px" }}
        role="grid"
        aria-label={`Flash Matrix ${size} by ${size} recall grid`}
      >
        {Array.from({ length: size * size }, (_, idx) => {
          const lit = (phase === "preview" && target.includes(idx)) || picked.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              disabled={phase !== "recall"}
              className={`game-cell-btn ${lit ? "is-powered" : ""}`.trim()}
              aria-pressed={picked.includes(idx)}
              aria-label={`Cell ${idx + 1}${lit ? ", highlighted" : ""}`}
              onClick={() => selectCell(idx)}
            >
              {lit ? "●" : ""}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {phase === "ready"
          ? "Press Show Pattern to study the highlighted constellation for 1.8 seconds."
          : phase === "preview"
            ? "Memorize the coral tiles…"
            : phase === "won"
              ? `Cleared all 5 recall rounds with ${mistakes} mistake(s)!`
              : `Select all ${target.length} tiles from memory (${picked.length} found).`}
      </p>

      {phase === "won" ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>All 5 spatial rounds recalled ({mistakes} mistakes)!</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              setMistakes(0);
              beginRound(size, 1);
            }}
          >
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 3. REFLEX GATE ────────────────────────────────────────────────────── */
export function ReflexGateGame() {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "early" | "done">("idle");
  const [samples, setSamples] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const arm = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPhase("wait");
    const delay = 1100 + Math.floor(Math.random() * 1700);
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, delay);
  };

  const trigger = () => {
    if (phase === "idle" || phase === "early") {
      arm();
    } else if (phase === "wait") {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setPhase("early");
    } else if (phase === "go") {
      const ms = Math.max(1, Math.round(performance.now() - startRef.current));
      const next = [...samples, ms];
      setLastMs(ms);
      setSamples(next);
      if (next.length >= 5) setPhase("done");
      else arm();
    }
  };

  const stats = reflexStats(samples);

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">5-round visual reaction bench</span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setSamples([]);
            setLastMs(null);
            setPhase("idle");
          }}
        >
          <Icon name="rotate-ccw" size={15} />
          <span>Restart</span>
        </button>
      </div>

      <dl className="game-hud" aria-label="Reflex Gate stats">
        <div><dt>Rounds</dt><dd>{samples.length} / 5</dd></div>
        <div><dt>Last</dt><dd>{lastMs !== null ? `${lastMs} ms` : "—"}</dd></div>
        <div><dt>Average</dt><dd>{stats.count > 0 ? `${stats.avg} ms` : "—"}</dd></div>
        <div><dt>Fastest</dt><dd>{stats.count > 0 ? `${stats.best} ms` : "—"}</dd></div>
      </dl>

      <button
        type="button"
        className={`reflex-pad ${phase === "wait" ? "reflex-pad--wait" : phase === "go" ? "reflex-pad--go" : phase === "early" ? "reflex-pad--early" : ""}`.trim()}
        onClick={trigger}
        disabled={phase === "done"}
      >
        <div>
          <strong style={{ fontSize: "1.6rem", display: "block" }}>
            {phase === "idle" && "Click or Press Space to Arm Gate"}
            {phase === "wait" && "WAIT — Hold Steady…"}
            {phase === "go" && "GO! Trigger Now!"}
            {phase === "early" && "Too Early — Click to Retry Round"}
            {phase === "done" && `Done! Average: ${stats.avg} ms (Best: ${stats.best} ms)`}
          </strong>
          <span className="fine-print">
            {phase === "wait" ? "Do not trigger until the gate flips to bright emerald GO." : "Works with mouse, touch, Space, or Enter."}
          </span>
        </div>
      </button>

      {phase === "done" ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>5-round average: {stats.avg} ms · Fastest: {stats.best} ms</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              setSamples([]);
              setLastMs(null);
              arm();
            }}
          >
            <span>Run another 5 rounds</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 4. ORBIT CATCH ────────────────────────────────────────────────────── */
export function OrbitCatchGame() {
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(15);
  const [hits, setHits] = useState(0);
  const [shields, setShields] = useState(3);
  const [streak, setStreak] = useState(0);
  const [lastCall, setLastCall] = useState("Press Start Run, then trigger Capture when the marker enters the coral band.");
  const dirRef = useRef(1);
  const posRef = useRef(15);

  const won = hits >= 8;
  const lost = shields <= 0;
  const zoneHalf = Math.max(8, 16 - hits);

  useEffect(() => {
    if (!running || won || lost) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepMs = reduced ? 160 : 22;
    const delta = (reduced ? 9 : 1.55) + hits * (reduced ? 0.8 : 0.22);
    const id = window.setInterval(() => {
      let next = posRef.current + dirRef.current * delta;
      if (next >= 96) {
        next = 96;
        dirRef.current = -1;
      } else if (next <= 4) {
        next = 4;
        dirRef.current = 1;
      }
      posRef.current = next;
      setPos(next);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [hits, lost, running, won]);

  const capture = useCallback(() => {
    if (!running || won || lost) return;
    const verdict = evaluateOrbitHit(posRef.current, zoneHalf);
    if (verdict === "miss") {
      setShields((s) => s - 1);
      setStreak(0);
      setLastCall("Missed the coral band! Shield lost.");
    } else {
      setHits((h) => h + 1);
      setStreak((s) => s + 1);
      setLastCall(verdict === "perfect" ? "Perfect center capture!" : "Clean capture!");
    }
  }, [lost, running, won, zoneHalf]);

  const restart = () => {
    posRef.current = 15;
    dirRef.current = 1;
    setPos(15);
    setHits(0);
    setShields(3);
    setStreak(0);
    setRunning(true);
    setLastCall("Signal rail active — hit Capture inside the coral zone!");
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">Land 8 captures before 3 shields run out</span>
        <button type="button" className="btn btn--secondary btn--sm" onClick={restart}>
          <Icon name="rotate-ccw" size={15} />
          <span>{running ? "Restart" : "Start run"}</span>
        </button>
      </div>

      <dl className="game-hud" aria-label="Orbit Catch telemetry">
        <div><dt>Captures</dt><dd>{hits} / 8</dd></div>
        <div><dt>Shields</dt><dd>{shields} / 3</dd></div>
        <div><dt>Streak</dt><dd>{streak}</dd></div>
        <div><dt>Band width</dt><dd>{zoneHalf * 2}%</dd></div>
      </dl>

      <div className="orbit-rail" aria-hidden="true">
        <div className="orbit-zone" style={{ left: `${50 - zoneHalf}%`, width: `${zoneHalf * 2}%` }} />
        <div className="orbit-cursor" style={{ left: `${pos}%` }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        {!running && !won && !lost ? (
          <button type="button" className="btn btn--primary btn--md" onClick={restart}>
            <Icon name="play" size={16} />
            <span>Start run</span>
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--md" disabled={won || lost} onClick={capture}>
            <span>Capture signal</span>
          </button>
        )}
      </div>

      <p className="game-live" role="status" aria-live="polite">{lastCall}</p>

      {won || lost ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name={won ? "check" : "alert"} size={20} />
            <strong>{won ? "Cleared all 8 Orbit Captures!" : "Shields depleted — try another run."}</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={restart}>
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 5. TARGET BURST (20s SPRINT) ──────────────────────────────────────── */
export function TargetBurstGame() {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [target, setTarget] = useState(5);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      setActive(false);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [active, timeLeft]);

  const start = () => {
    setTimeLeft(20);
    setHits(0);
    setMisses(0);
    setStreak(0);
    setBestStreak(0);
    setTarget(pickNextTargetCell(target));
    setActive(true);
  };

  const clickTile = (idx: number) => {
    if (!active) return;
    if (idx === target) {
      setHits((h) => h + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setTarget((prev) => pickNextTargetCell(prev));
    } else {
      setMisses((m) => m + 1);
      setStreak(0);
    }
  };

  const finished = !active && timeLeft === 0;
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">20-second grid precision sprint</span>
        <button type="button" className="btn btn--primary btn--sm" onClick={start}>
          <Icon name="play" size={15} />
          <span>{active ? "Restart sprint" : "Start 20s sprint"}</span>
        </button>
      </div>

      <dl className="game-hud" aria-label="Target Burst stats">
        <div><dt>Time</dt><dd>{timeLeft}s</dd></div>
        <div><dt>Hits</dt><dd>{hits}</dd></div>
        <div><dt>Best streak</dt><dd>{bestStreak}</dd></div>
        <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
      </dl>

      <div
        className="game-board-grid"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", maxWidth: "360px" }}
        role="grid"
        aria-label="Target Burst 4 by 4 beacon grid"
      >
        {Array.from({ length: 16 }, (_, idx) => {
          const isLit = active && idx === target;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              disabled={!active}
              className={`game-cell-btn ${isLit ? "is-powered" : ""}`.trim()}
              aria-label={`Grid cell ${idx + 1}${isLit ? ", active target beacon" : ""}`}
              onClick={() => clickTile(idx)}
            >
              {isLit ? "◎" : ""}
            </button>
          );
        })}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {finished
          ? `Sprint complete! ${hits} hits · ${accuracy}% accuracy · Best streak ${bestStreak}.`
          : active
            ? `Current streak: ${streak}. Click each lit coral beacon.`
            : "Press Start 20s Sprint to begin."}
      </p>

      {finished ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>{hits} hits at {accuracy}% accuracy (best streak {bestStreak})!</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={start}>
            <span>Sprint again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 6. CHROMA MATCH ───────────────────────────────────────────────────── */
export function ChromaMatchGame() {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<HslColor>({ h: 180, s: 55, l: 55 });
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const done = scores.length >= CHROMA_TARGETS.length;
  const target = CHROMA_TARGETS[Math.min(round, CHROMA_TARGETS.length - 1)];
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const lock = () => {
    if (done) return;
    const sc = chromaMatchScore(target.color, guess);
    setLastScore(sc);
    const next = [...scores, sc];
    setScores(next);
    if (next.length < CHROMA_TARGETS.length) {
      setRound(next.length);
      setGuess({ h: 180, s: 55, l: 55 });
    }
  };

  const restart = () => {
    setRound(0);
    setScores([]);
    setLastScore(null);
    setGuess({ h: 180, s: 55, l: 55 });
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">Swatch {Math.min(round + 1, CHROMA_TARGETS.length)} of {CHROMA_TARGETS.length}: {target.name}</span>
        <button type="button" className="btn btn--secondary btn--sm" onClick={restart}>
          <Icon name="rotate-ccw" size={15} />
          <span>Restart</span>
        </button>
      </div>

      <dl className="game-hud" aria-label="Chroma Match progress">
        <div><dt>Swatches</dt><dd>{scores.length} / {CHROMA_TARGETS.length}</dd></div>
        <div><dt>Last match</dt><dd>{lastScore !== null ? `${lastScore}%` : "—"}</dd></div>
        <div><dt>Average</dt><dd>{scores.length > 0 ? `${avg}%` : "—"}</dd></div>
        <div><dt>Your HSL</dt><dd>{guess.h}° {guess.s}% {guess.l}%</dd></div>
      </dl>

      <div className="swatch-compare">
        <div className="swatch-box" style={{ backgroundColor: hslCss(target.color) }}>
          <span>Target: {target.name}</span>
        </div>
        <div className="swatch-box" style={{ backgroundColor: hslCss(guess) }}>
          <span>Your mix</span>
        </div>
      </div>

      <div className="slider-stack">
        <label className="slider-row">
          <span className="fine-print">Hue: {guess.h}°</span>
          <input type="range" min={0} max={359} value={guess.h} disabled={done} onChange={(e) => setGuess((g) => ({ ...g, h: Number(e.target.value) }))} />
        </label>
        <label className="slider-row">
          <span className="fine-print">Saturation: {guess.s}%</span>
          <input type="range" min={0} max={100} value={guess.s} disabled={done} onChange={(e) => setGuess((g) => ({ ...g, s: Number(e.target.value) }))} />
        </label>
        <label className="slider-row">
          <span className="fine-print">Lightness: {guess.l}%</span>
          <input type="range" min={10} max={90} value={guess.l} disabled={done} onChange={(e) => setGuess((g) => ({ ...g, l: Number(e.target.value) }))} />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" className="btn btn--primary btn--md" disabled={done} onClick={lock}>
          <span>Lock match</span>
        </button>
      </div>

      {done ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>5-swatch designer eye average: {avg}% accuracy!</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={restart}>
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 7. CONTRAST JUDGE (WCAG 2.2) ──────────────────────────────────────── */
export function ContrastJudgeGame() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<WcagGrade | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const sample = CONTRAST_SAMPLES[idx];
  const actualRatio = wcagContrastRatio(sample.fg, sample.bg);
  const actualGrade = wcagGradeFor(sample.fg, sample.bg);

  const grade = (choice: WcagGrade) => {
    if (picked !== null) return;
    setPicked(choice);
    if (choice === actualGrade) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= CONTRAST_SAMPLES.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <span className="fine-print">Card {idx + 1} of {CONTRAST_SAMPLES.length} · {sample.label}</span>
        <button type="button" className="btn btn--secondary btn--sm" onClick={restart}>
          <Icon name="rotate-ccw" size={15} />
          <span>Restart</span>
        </button>
      </div>

      <dl className="game-hud" aria-label="Contrast Judge score">
        <div><dt>Card</dt><dd>{idx + 1} / {CONTRAST_SAMPLES.length}</dd></div>
        <div><dt>Correct</dt><dd>{correct}</dd></div>
        <div><dt>Foreground</dt><dd>{sample.fg}</dd></div>
        <div><dt>Background</dt><dd>{sample.bg}</dd></div>
      </dl>

      <div className="contrast-preview" style={{ color: sample.fg, backgroundColor: sample.bg }}>
        <strong style={{ fontSize: "1.15rem" }}>{sample.sampleTitle}</strong>
        <p style={{ margin: 0, fontSize: "1rem" }}>{sample.sampleText}</p>
      </div>

      <div className="game-mode-tabs" style={{ justifyContent: "center" }} role="group" aria-label="Select WCAG 2.2 contrast verdict">
        {([
          ["fail", "Fail (< 4.5:1)"],
          ["aa", "Pass AA (4.5–6.99:1)"],
          ["aaa", "Pass AAA (≥ 7.0:1)"],
        ] as [WcagGrade, string][]).map(([g, label]) => (
          <button
            key={g}
            type="button"
            className={`btn ${picked === g ? "btn--primary" : "btn--secondary"} btn--sm`}
            disabled={picked !== null || done}
            onClick={() => grade(g)}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>

      {picked !== null && !done ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name={picked === actualGrade ? "check" : "alert"} size={20} />
            <strong>
              {picked === actualGrade ? "Correct!" : "Close —"} Measured WCAG ratio: {actualRatio}:1 ({actualGrade.toUpperCase()}).
            </strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={next}>
            <span>{idx + 1 >= CONTRAST_SAMPLES.length ? "Finish calibration" : "Next card"}</span>
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      ) : null}

      {done ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>WCAG 2.2 calibration complete: {correct} / {CONTRAST_SAMPLES.length} correct!</strong>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={restart}>
            <span>Play again</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── 8. SPECTRUM ORDER ─────────────────────────────────────────────────── */
export function SpectrumOrderGame() {
  const [palIdx, setPalIdx] = useState(0);
  const [swatches, setSwatches] = useState(() => scrambleSpectrum(SPECTRUM_PALETTES[0], seededRng(2026)));
  const [selected, setSelected] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const [showNumbers, setShowNumbers] = useState(false);

  const palette = SPECTRUM_PALETTES[palIdx];
  const solved = isSpectrumSorted(swatches);

  const loadPalette = (idx: number) => {
    setPalIdx(idx);
    setSwatches(scrambleSpectrum(SPECTRUM_PALETTES[idx]));
    setSelected(null);
    setSwaps(0);
  };

  const clickSwatch = (idx: number) => {
    if (solved || swatches[idx].locked) return;
    if (selected === null) {
      setSelected(idx);
    } else if (selected === idx) {
      setSelected(null);
    } else {
      setSwatches((prev) => {
        const next = prev.slice();
        [next[selected], next[idx]] = [next[idx], next[selected]];
        return next;
      });
      setSelected(null);
      setSwaps((s) => s + 1);
    }
  };

  return (
    <div className="game-stage panel">
      <div className="game-toolbar">
        <div className="game-mode-tabs" role="group" aria-label="Spectrum Order palettes">
          {SPECTRUM_PALETTES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`filter-chip ${palIdx === idx ? "is-active" : ""}`.trim()}
              aria-pressed={palIdx === idx}
              onClick={() => loadPalette(idx)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="game-actions">
          <button
            type="button"
            className={`filter-chip ${showNumbers ? "is-active" : ""}`.trim()}
            aria-pressed={showNumbers}
            onClick={() => setShowNumbers((v) => !v)}
          >
            Step hints: {showNumbers ? "ON" : "OFF"}
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadPalette(palIdx)}>
            <Icon name="rotate-ccw" size={15} />
            <span>Reshuffle</span>
          </button>
        </div>
      </div>

      <dl className="game-hud" aria-label="Spectrum Order progress">
        <div><dt>Swaps</dt><dd>{swaps}</dd></div>
        <div><dt>In order</dt><dd>{swatches.filter((s, i) => s.targetIndex === i).length} / {swatches.length}</dd></div>
        <div><dt>Palette</dt><dd>{palette.name}</dd></div>
        <div><dt>Status</dt><dd>{solved ? "Aligned" : "Scrambled"}</dd></div>
      </dl>

      <div className="spectrum-row" role="group" aria-label="Color spectrum tiles">
        {swatches.map((s, idx) => (
          <button
            key={`${s.targetIndex}-${idx}`}
            type="button"
            disabled={s.locked}
            className={`spectrum-tile ${s.locked ? "is-locked" : ""} ${selected === idx ? "is-selected" : ""}`.trim()}
            style={{ backgroundColor: s.css }}
            aria-pressed={selected === idx}
            aria-label={s.locked ? `Anchor swatch ${idx + 1} (locked)` : `Movable swatch position ${idx + 1}${showNumbers ? `, step ${s.targetIndex + 1}` : ""}`}
            onClick={() => clickSwatch(idx)}
          >
            <span>{s.locked ? "Anchor" : showNumbers ? `#${s.targetIndex + 1}` : `Pos ${idx + 1}`}</span>
          </button>
        ))}
      </div>

      <p className="game-live" role="status" aria-live="polite">
        {solved
          ? `Smooth spectrum aligned in ${swaps} swap(s)!`
          : selected !== null
            ? `Selected position ${selected + 1}. Click another movable swatch to swap.`
            : "Click two movable swatches between the locked anchors to swap them into a smooth gradient."}
      </p>

      {solved ? (
        <div className="game-complete" role="status">
          <div className="game-complete__head">
            <Icon name="check" size={20} />
            <strong>{palette.name} aligned in {swaps} swaps!</strong>
          </div>
          {palIdx < SPECTRUM_PALETTES.length - 1 ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => loadPalette(palIdx + 1)}>
              <span>Next palette</span>
              <Icon name="arrow-right" size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

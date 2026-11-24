/**
 * Pure domain engines for Memory, Arcade, and Visual/Color games:
 *  - Echo Pads (sequence recall)
 *  - Flash Matrix (spatial constellation memory)
 *  - Reflex Gate (reaction latency stats)
 *  - Orbit Catch (precision timing band)
 *  - Target Burst (timed 4x4 beacon sprint)
 *  - Chroma Match (HSL perceptual color accuracy)
 *  - Contrast Judge (exact WCAG 2.2 relative luminance & grading)
 *  - Spectrum Order (HSL gradient interpolation & sort verification)
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. ECHO PADS & FLASH MATRIX HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
export function generateEchoSequence(length: number, padCount: number, rng: () => number = Math.random): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i += 1) {
    seq.push(Math.floor(rng() * padCount));
  }
  return seq;
}

export function generateFlashPattern(size: number, count: number, rng: () => number = Math.random): number[] {
  const pool = Array.from({ length: size * size }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).sort((a, b) => a - b);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. REFLEX GATE & ORBIT CATCH & TARGET BURST HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
export function reflexStats(samplesMs: number[]): { avg: number; best: number; count: number } {
  if (samplesMs.length === 0) return { avg: 0, best: 0, count: 0 };
  const sum = samplesMs.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / samplesMs.length),
    best: Math.min(...samplesMs),
    count: samplesMs.length,
  };
}

export function evaluateOrbitHit(positionPct: number, zoneHalfWidth: number): "perfect" | "hit" | "miss" {
  const dist = Math.abs(positionPct - 50);
  if (dist <= zoneHalfWidth * 0.4) return "perfect";
  if (dist <= zoneHalfWidth) return "hit";
  return "miss";
}

export function pickNextTargetCell(prev: number, total = 16, rng: () => number = Math.random): number {
  let next = Math.floor(rng() * total);
  if (next === prev) next = (next + 1) % total;
  return next;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. CHROMA MATCH (HSL -> RGB & Perceptual Accuracy)
   ═══════════════════════════════════════════════════════════════════════════ */
export type HslColor = { h: number; s: number; l: number };

export const CHROMA_TARGETS: { name: string; color: HslColor }[] = [
  { name: "Studio Coral", color: { h: 11, s: 100, l: 68 } },
  { name: "Signal Cyan", color: { h: 199, s: 89, l: 60 } },
  { name: "Ledger Emerald", color: { h: 158, s: 64, l: 52 } },
  { name: "Amber Wire", color: { h: 42, s: 88, l: 64 } },
  { name: "Prism Violet", color: { h: 258, s: 86, l: 76 } },
];

export function hslToRgb({ h, s, l }: HslColor): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function hslCss({ h, s, l }: HslColor): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

export function chromaMatchScore(target: HslColor, guess: HslColor): number {
  const [r1, g1, b1] = hslToRgb(target);
  const [r2, g2, b2] = hslToRgb(guess);
  const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  const maxDist = Math.sqrt(3 * 255 ** 2);
  return Math.max(0, Math.min(100, Math.round((1 - dist / maxDist) * 100)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. CONTRAST JUDGE (Exact WCAG 2.2 Relative Luminance)
   ═══════════════════════════════════════════════════════════════════════════ */
export type WcagGrade = "fail" | "aa" | "aaa";

export type ContrastSample = {
  id: string;
  label: string;
  fg: string;
  bg: string;
  sampleTitle: string;
  sampleText: string;
};

export const CONTRAST_SAMPLES: ContrastSample[] = [
  { id: "c1", label: "Obsidian & Cream", fg: "#f8f5ef", bg: "#090c11", sampleTitle: "Primary Display", sampleText: "Body copy on obsidian studio canvas." },
  { id: "c2", label: "Slate on Charcoal", fg: "#64748b", bg: "#141a24", sampleTitle: "Muted Caption", sampleText: "Low-contrast grey text on dark slate." },
  { id: "c3", label: "Coral on Deep Navy", fg: "#ff7a5c", bg: "#141a24", sampleTitle: "Accent Link", sampleText: "Warm studio coral link over navy card." },
  { id: "c4", label: "Ink on Warm Coral", fg: "#140f0d", bg: "#ff7a5c", sampleTitle: "Primary Button", sampleText: "Dark ink button label on coral fill." },
  { id: "c5", label: "White on Amber", fg: "#ffffff", bg: "#f5c451", sampleTitle: "Warning Pill", sampleText: "Pure white text over bright amber." },
  { id: "c6", label: "Sky on Obsidian", fg: "#38bdf8", bg: "#090c11", sampleTitle: "Telemetry Stat", sampleText: "Cyan telemetry figure on obsidian." },
  { id: "c7", label: "Mid Coral on Card", fg: "#d95538", bg: "#1b2837", sampleTitle: "Dense Alert", sampleText: "Deep coral alert text on mid slate." },
  { id: "c8", label: "Dark Ink on Paper", fg: "#111827", bg: "#f8fafc", sampleTitle: "Light Print Spec", sampleText: "High-contrast dark text on light card." },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function wcagGradeFor(fg: string, bg: string): WcagGrade {
  const ratio = wcagContrastRatio(fg, bg);
  if (ratio >= 7.0) return "aaa";
  if (ratio >= 4.5) return "aa";
  return "fail";
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. SPECTRUM ORDER (HSL Gradient Interpolation)
   ═══════════════════════════════════════════════════════════════════════════ */
export type SpectrumPalette = {
  id: string;
  name: string;
  count: number;
  start: HslColor;
  end: HslColor;
};

export const SPECTRUM_PALETTES: SpectrumPalette[] = [
  { id: "coral-dusk", name: "Coral Dusk (6)", count: 6, start: { h: 10, s: 95, l: 64 }, end: { h: 48, s: 90, l: 62 } },
  { id: "ocean-signal", name: "Ocean Signal (7)", count: 7, start: { h: 162, s: 68, l: 50 }, end: { h: 222, s: 86, l: 62 } },
  { id: "studio-prism", name: "Studio Prism (8)", count: 8, start: { h: 268, s: 78, l: 68 }, end: { h: 356, s: 88, l: 64 } },
];

export type SpectrumSwatch = { targetIndex: number; css: string; locked: boolean };

export function buildSpectrumOrdered(palette: SpectrumPalette): SpectrumSwatch[] {
  const out: SpectrumSwatch[] = [];
  for (let i = 0; i < palette.count; i += 1) {
    const t = i / (palette.count - 1);
    const c: HslColor = {
      h: palette.start.h + (palette.end.h - palette.start.h) * t,
      s: palette.start.s + (palette.end.s - palette.start.s) * t,
      l: palette.start.l + (palette.end.l - palette.start.l) * t,
    };
    out.push({ targetIndex: i, css: hslCss(c), locked: i === 0 || i === palette.count - 1 });
  }
  return out;
}

export function scrambleSpectrum(palette: SpectrumPalette, rng: () => number = Math.random): SpectrumSwatch[] {
  const ordered = buildSpectrumOrdered(palette);
  const middle = ordered.slice(1, -1);
  for (let i = middle.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [middle[i], middle[j]] = [middle[j], middle[i]];
  }
  const combined = [ordered[0], ...middle, ordered[ordered.length - 1]];
  if (isSpectrumSorted(combined) && middle.length >= 2) {
    [combined[1], combined[2]] = [combined[2], combined[1]];
  }
  return combined;
}

export function isSpectrumSorted(swatches: SpectrumSwatch[]): boolean {
  return swatches.every((s, idx) => s.targetIndex === idx);
}

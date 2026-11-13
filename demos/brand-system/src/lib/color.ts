/**
 * Colour utilities, including WCAG 2.2 contrast.
 *
 * The ratios here are computed from the relative luminance formula in the
 * specification, not looked up — so changing a brand colour immediately shows
 * which pairings stop passing.
 */

export type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`"${hex}" is not a valid hex colour.`);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export const rgbToHex = ({ r, g, b }: RGB): string =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 to 21, rounded to two decimals. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export type ContrastUse = "body" | "large" | "ui";

/** AA thresholds: 4.5 for body text, 3 for large text and UI components. */
export const THRESHOLD: Record<ContrastUse, number> = { body: 4.5, large: 3, ui: 3 };

export type ContrastResult = { ratio: number; aa: boolean; aaa: boolean; grade: "AAA" | "AA" | "AA Large" | "Fail" };

export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  const aaa = ratio >= 7;
  const aa = ratio >= 4.5;
  return { ratio, aa, aaa, grade: aaa ? "AAA" : aa ? "AA" : ratio >= 3 ? "AA Large" : "Fail" };
}

/** Lighten or darken toward white or black by a factor of 0–1. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return rgbToHex({ r: r + (target - r) * t, g: g + (target - g) * t, b: b + (target - b) * t });
}

/** Whichever of the two reads better on the given background. */
export function readableOn(background: string, options: [string, string]): string {
  const [a, b] = options;
  return contrastRatio(a, background) >= contrastRatio(b, background) ? a : b;
}

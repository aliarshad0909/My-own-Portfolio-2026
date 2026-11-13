/** Modular type scale, computed rather than hand-listed so the ratio stays honest. */

export type ScaleStep = {
  name: string;
  /** Step relative to the base: 0 is body text. */
  step: number;
  px: number;
  rem: number;
  lineHeight: number;
  /** Tracking in em; large text needs tightening, small text needs opening up. */
  tracking: number;
  usage: string;
};

export const BASE_PX = 17;
export const RATIO = 1.25; // major third

const round = (n: number, places = 3) => Number(n.toFixed(places));

/** Line height tightens as type grows: comfortable for body, compact for display. */
export function lineHeightFor(px: number): number {
  if (px >= 48) return 1.05;
  if (px >= 32) return 1.15;
  if (px >= 24) return 1.3;
  if (px >= 20) return 1.45;
  return 1.6;
}

export function trackingFor(px: number): number {
  if (px >= 48) return -0.02;
  if (px >= 28) return -0.01;
  if (px <= 13) return 0.02;
  return 0;
}

const STEPS: [name: string, step: number, usage: string][] = [
  ["Display", 4, "Campaign headlines, hero"],
  ["H1", 3, "Page titles"],
  ["H2", 2, "Section headings"],
  ["H3", 1, "Card and block headings"],
  ["Body", 0, "Default running text"],
  ["Small", -1, "Captions, metadata"],
  ["Micro", -2, "Legal, labels"],
];

export function buildScale(basePx = BASE_PX, ratio = RATIO): ScaleStep[] {
  return STEPS.map(([name, step, usage]) => {
    const px = round(basePx * ratio ** step, 2);
    return { name, step, px, rem: round(px / 16, 3), lineHeight: lineHeightFor(px), tracking: trackingFor(px), usage };
  });
}

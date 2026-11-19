/**
 * Brand tokens for the Remotion motion system — kept in lock-step with
 * styles/tokens.css so every rendered animation uses the exact site palette and
 * typography. If a token changes in the CSS, change it here too.
 */

export const BRAND = {
  bg: "#0b0d10",
  card: "#141d22",
  surface: "#171a20",
  coral: "#ff7a5c",
  coralHover: "#ff9078",
  coralSoft: "rgba(255, 122, 92, 0.12)",
  coralLine: "rgba(255, 122, 92, 0.45)",
  onCoral: "#14100e",
  text: "#f9f6f0",
  muted: "#a9abb2",
  border: "#30363b",
  borderSoft: "rgba(48, 54, 59, 0.6)",
  danger: "#ff9a8a",
  warn: "#f2c66d",
  fontHeading: "'Space Grotesk', system-ui, sans-serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
} as const;

/** Shared render settings so every composition loops cleanly and matches size. */
export const VIDEO = {
  fps: 30,
  width: 1600,
  height: 900,
  /** Default loop length in seconds for decorative loops. */
  loopSeconds: 8,
} as const;

export const durationInFrames = (seconds: number) => Math.round(seconds * VIDEO.fps);

/** Halcyon is a fictional brand invented for this demonstration. */

export type Swatch = { name: string; hex: string; role: string; token: string; note?: string };

export const PALETTE: Swatch[] = [
  { name: "Midnight", hex: "#2A1E3F", role: "Primary surface, headlines on light", token: "--halcyon-midnight" },
  { name: "Deep Plum", hex: "#4A3466", role: "Secondary surface, gradients", token: "--halcyon-plum" },
  { name: "Apricot", hex: "#F3B98A", role: "Primary accent, calls to action", token: "--halcyon-apricot" },
  { name: "Clay", hex: "#A94F30", role: "Accent on light surfaces, links, buttons", token: "--halcyon-clay", note: "Darkened from #C96F4A, which measured 3.36:1 on Paper and failed AA for body text." },
  { name: "Mist", hex: "#CFC7DE", role: "Dividers, muted text on dark", token: "--halcyon-mist" },
  { name: "Paper", hex: "#FBF7F2", role: "Light surface, text on dark", token: "--halcyon-paper" },
  { name: "Slate", hex: "#5A5266", role: "Secondary text on light", token: "--halcyon-slate" },
  { name: "Signal", hex: "#2F7D64", role: "Confirmation, success states", token: "--halcyon-signal" },
];

/** Pairings the brand actually uses, each checked live against WCAG. */
export const PAIRINGS: { label: string; fg: string; bg: string; use: "body" | "large" | "ui" }[] = [
  { label: "Paper on Midnight", fg: "#FBF7F2", bg: "#2A1E3F", use: "body" },
  { label: "Mist on Midnight", fg: "#CFC7DE", bg: "#2A1E3F", use: "body" },
  { label: "Apricot on Midnight", fg: "#F3B98A", bg: "#2A1E3F", use: "body" },
  { label: "Midnight on Paper", fg: "#2A1E3F", bg: "#FBF7F2", use: "body" },
  { label: "Slate on Paper", fg: "#5A5266", bg: "#FBF7F2", use: "body" },
  { label: "Clay on Paper", fg: "#A94F30", bg: "#FBF7F2", use: "body" },
  { label: "Midnight on Apricot", fg: "#2A1E3F", bg: "#F3B98A", use: "body" },
  { label: "Paper on Clay", fg: "#FBF7F2", bg: "#A94F30", use: "body" },
  { label: "Paper on Deep Plum", fg: "#FBF7F2", bg: "#4A3466", use: "body" },
  { label: "Apricot on Deep Plum", fg: "#F3B98A", bg: "#4A3466", use: "large" },
];

export const BRAND = {
  name: "Halcyon",
  descriptor: "Rest, considered",
  category: "Sleep and recovery",
  positioning: "A small range of sleep products for people who have tried the apps and the gadgets and want something quieter.",
  voice: {
    is: ["Calm", "Plain-spoken", "Specific", "Unhurried"],
    isNot: ["Clinical", "Hyped", "Preachy", "Cute"],
  },
  principles: [
    { title: "Say the quiet thing", body: "No miracle claims, no sleep scores. Describe what the product is and what it does." },
    { title: "Evening light, not daylight", body: "Warm, low-contrast imagery. Nothing that looks like a pharmacy." },
    { title: "Room to breathe", body: "Generous spacing. If a layout feels full, remove something rather than shrink it." },
    { title: "One accent at a time", body: "Apricot leads. Clay supports on light surfaces. Never both competing in one view." },
  ],
  copy: {
    headline: "Sleep is not a project.",
    subhead: "A short range of things that help you wind down, without turning rest into another thing to optimise.",
    cta: "See the range",
    secondaryCta: "How it works",
    social: [
      { format: "Square post", headline: "Put the phone down.", body: "The lamp fades out over 20 minutes. You do not have to do anything." },
      { format: "Story", headline: "Sleep is not a project.", body: "A short range for winding down." },
      { format: "Wide banner", headline: "Rest, considered.", body: "Three products. Nothing to charge, nothing to track." },
    ],
  },
  spacing: [2, 4, 8, 12, 16, 24, 32, 48, 64, 96],
  radius: { sm: 6, md: 12, lg: 20, pill: 999 },
};

export const CAMPAIGN = {
  name: "Wind Down",
  objective: "Introduce the range to people who already buy thoughtfully made home goods, without competing on sleep-tech claims.",
  audience: "25–45, urban, buys for the long term, sceptical of wellness marketing.",
  channels: [
    { name: "Owned email", role: "Depth. Three-part sequence explaining the range.", asset: "Email template" },
    { name: "Organic social", role: "Repetition and tone. Square and story formats.", asset: "Social templates" },
    { name: "Paid social", role: "Reach against the lookalike audience.", asset: "Wide banner" },
    { name: "Landing page", role: "Conversion. One page, one decision.", asset: "Landing page" },
  ],
  measurement: [
    "Landing page view to email signup rate",
    "Email sequence open and click rate by step",
    "Cost per signup by channel",
    "Return rate at 90 days, as a product-fit signal",
  ],
  notActual:
    "No campaign has run. These are the metrics worth watching, not results — there are none to report.",
};

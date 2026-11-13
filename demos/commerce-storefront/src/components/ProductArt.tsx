import type { Shape } from "../lib/types.ts";

/**
 * Original, code-drawn product illustrations. Each shape is an SVG silhouette
 * tinted with the selected glaze, so variant changes are reflected instantly
 * and no third-party photography is needed.
 */
const SHAPES: Record<Shape, { body: string; extra?: string; inner?: string; topView?: boolean }> = {
  mug: {
    body: "M118 130h150l-10 150a26 26 0 0 1-26 24h-78a26 26 0 0 1-26-24z",
    extra: "M266 160c44-6 62 22 54 52s-38 46-66 40l3-24c16 3 32-6 37-22s-6-28-26-24z",
    inner: "M118 130a75 14 0 0 0 150 0a75 14 0 0 0-150 0z",
  },
  tumbler: { body: "M130 110h140l-16 176a22 22 0 0 1-22 20h-64a22 22 0 0 1-22-20z", inner: "M130 110a70 12 0 0 0 140 0a70 12 0 0 0-140 0z" },
  bowl: { body: "M70 170h260c0 78-52 134-130 134S70 248 70 170z", inner: "M70 170a130 22 0 0 0 260 0a130 22 0 0 0-260 0z" },
  plate: { body: "M200 70a130 130 0 1 0 .1 0z", inner: "M200 108a92 92 0 1 0 .1 0z", topView: true },
  platter: { body: "M200 100c94 0 150 44 150 100s-56 100-150 100S50 256 50 200s56-100 150-100z", inner: "M200 132c66 0 108 30 108 68s-42 68-108 68-108-30-108-68 42-68 108-68z", topView: true },
  vase: {
    body: "M176 70h48v36c0 24 50 44 50 110 0 52-30 88-74 88s-74-36-74-88c0-66 50-86 50-110z",
    inner: "M176 70a24 6 0 0 0 48 0a24 6 0 0 0-48 0z",
  },
  planter: {
    body: "M104 170h192l-22 118a20 20 0 0 1-20 16H146a20 20 0 0 1-20-16z",
    inner: "M104 170a96 14 0 0 0 192 0a96 14 0 0 0-192 0z",
  },
  pitcher: {
    body: "M132 96l28 14h92c8 0 14 6 14 14l-8 156a26 26 0 0 1-26 24h-72a26 26 0 0 1-26-24l-6-118c-1-22-10-40-22-52z",
    extra: "M262 150c44-4 60 26 52 56s-36 46-62 40l2-24c16 2 30-6 35-22s-6-28-26-26z",
  },
};

const tint = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mix = (c: number) => Math.round(c + (255 - c) * 0.82);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
};

/** Deterministic speckle positions so each product keeps the same pattern. */
function speckles(seed: string): [number, number, number][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const next = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  return Array.from({ length: 46 }, () => [40 + next() * 320, 60 + next() * 260, 0.8 + next() * 1.8]);
}

type Props = { shape: Shape; color: string; seed: string; label?: string };

export function ProductArt({ shape, color, seed, label }: Props) {
  const s = SHAPES[shape];
  const id = `a-${seed}-${color.slice(1)}`;
  return (
    <svg viewBox="0 0 400 400" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="art">
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={s.body} />
          {s.extra ? <path d={s.extra} /> : null}
        </clipPath>
        <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={tint(color)} />
      {s.topView ? null : <ellipse cx="200" cy="312" rx="120" ry="14" fill="#000" opacity="0.12" />}
      {shape === "planter" ? (
        <g fill="#4d6b45">
          <path d="M200 176c-6-40-30-62-58-66 6 34 26 56 58 66z" />
          <path d="M202 176c4-48 30-78 62-84-4 42-26 70-62 84z" opacity="0.85" />
          <path d="M198 176c-2-30 6-56 22-72 8 26 0 54-22 72z" opacity="0.7" />
        </g>
      ) : null}
      {s.extra ? <path d={s.extra} fill={color} /> : null}
      <path d={s.body} fill={color} data-part="body" />
      <g clipPath={`url(#${id}-c)`}>
        <rect width="400" height="400" fill={`url(#${id}-g)`} />
        {speckles(seed).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#000" opacity="0.13" />
        ))}
      </g>
      {s.inner ? <path d={s.inner} fill="#000" opacity={s.topView ? 0.09 : 0.2} /> : null}
    </svg>
  );
}

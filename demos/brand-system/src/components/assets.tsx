import { readableOn } from "../lib/color.ts";
import { BRAND } from "../data/brand.ts";

/**
 * Brand assets drawn as SVG so they stay crisp, stay editable and can be
 * downloaded as real files. Nothing here is a raster export.
 */

export function Mark({ size = 48, fill = "#F3B98A", title }: { size?: number; fill?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {/* A crescent: the shape of winding down, not a moon cliché with stars. */}
      <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={fill} />
    </svg>
  );
}

type LockupProps = { variant?: "horizontal" | "stacked" | "mark"; on?: "dark" | "light"; size?: number };

export function Lockup({ variant = "horizontal", on = "dark", size = 1 }: LockupProps) {
  const ink = on === "dark" ? "#FBF7F2" : "#2A1E3F";
  const accent = on === "dark" ? "#F3B98A" : "#A94F30";
  if (variant === "mark") return <Mark size={56 * size} fill={accent} title={`${BRAND.name} mark`} />;
  if (variant === "stacked") {
    return (
      <svg viewBox="0 0 200 128" width={200 * size} height={128 * size} role="img" aria-label={`${BRAND.name} stacked lockup`}>
        <g transform="translate(68 8)">
          <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={accent} transform="scale(1)" />
        </g>
        <text x="100" y="98" textAnchor="middle" fill={ink} fontFamily="Instrument Serif, Georgia, serif" fontSize="34">
          {BRAND.name}
        </text>
        <text x="100" y="116" textAnchor="middle" fill={accent} fontFamily="Public Sans, system-ui, sans-serif" fontSize="10" letterSpacing="3.4">
          {BRAND.descriptor.toUpperCase()}
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 280 64" width={280 * size} height={64 * size} role="img" aria-label={`${BRAND.name} horizontal lockup`}>
      <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={accent} />
      <text x="76" y="37" fill={ink} fontFamily="Instrument Serif, Georgia, serif" fontSize="34">
        {BRAND.name}
      </text>
      <text x="78" y="52" fill={accent} fontFamily="Public Sans, system-ui, sans-serif" fontSize="9.5" letterSpacing="3.2">
        {BRAND.descriptor.toUpperCase()}
      </text>
    </svg>
  );
}

type TemplateProps = { headline: string; body: string; bg?: string; accent?: string };

export function SquarePost({ headline, body, bg = "#2A1E3F", accent = "#F3B98A" }: TemplateProps) {
  const ink = readableOn(bg, ["#FBF7F2", "#2A1E3F"]);
  return (
    <svg viewBox="0 0 600 600" className="template" role="img" aria-label={`Square social post: ${headline}`}>
      <rect width="600" height="600" fill={bg} />
      <circle cx="520" cy="96" r="130" fill={accent} opacity="0.14" />
      <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={accent} transform="translate(48 44) scale(0.75)" />
      <text x="48" y="300" fill={ink} fontFamily="Instrument Serif, Georgia, serif" fontSize="62">
        {headline}
      </text>
      <foreignObject x="48" y="326" width="420" height="140">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ color: ink, fontFamily: "Public Sans, system-ui, sans-serif", fontSize: "21px", lineHeight: 1.5, opacity: 0.86 }}>
          {body}
        </div>
      </foreignObject>
      <rect x="48" y="492" width="186" height="52" rx="26" fill={accent} />
      <text x="141" y="525" textAnchor="middle" fill="#2A1E3F" fontFamily="Public Sans, system-ui, sans-serif" fontSize="17" fontWeight="600">
        {BRAND.copy.cta}
      </text>
    </svg>
  );
}

export function StoryPost({ headline, body, bg = "#4A3466", accent = "#F3B98A" }: TemplateProps) {
  const ink = readableOn(bg, ["#FBF7F2", "#2A1E3F"]);
  return (
    <svg viewBox="0 0 338 600" className="template" role="img" aria-label={`Story post: ${headline}`}>
      <defs>
        <linearGradient id="story-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor="#2A1E3F" />
        </linearGradient>
      </defs>
      <rect width="338" height="600" fill="url(#story-g)" />
      <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={accent} transform="translate(28 36) scale(0.6)" />
      <text x="28" y="300" fill={ink} fontFamily="Instrument Serif, Georgia, serif" fontSize="40">
        <tspan x="28" dy="0">{headline.split(" ").slice(0, 2).join(" ")}</tspan>
        <tspan x="28" dy="44">{headline.split(" ").slice(2).join(" ")}</tspan>
      </text>
      <foreignObject x="28" y="330" width="260" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ color: ink, fontFamily: "Public Sans, system-ui, sans-serif", fontSize: "16px", lineHeight: 1.55, opacity: 0.85 }}>
          {body}
        </div>
      </foreignObject>
      <rect x="28" y="520" width="150" height="44" rx="22" fill={accent} />
      <text x="103" y="548" textAnchor="middle" fill="#2A1E3F" fontFamily="Public Sans, system-ui, sans-serif" fontSize="15" fontWeight="600">
        {BRAND.copy.cta}
      </text>
    </svg>
  );
}

export function WideBanner({ headline, body, bg = "#FBF7F2", accent = "#A94F30" }: TemplateProps) {
  const ink = readableOn(bg, ["#FBF7F2", "#2A1E3F"]);
  return (
    <svg viewBox="0 0 728 240" className="template" role="img" aria-label={`Wide banner: ${headline}`}>
      <rect width="728" height="240" fill={bg} />
      <circle cx="660" cy="40" r="120" fill={accent} opacity="0.1" />
      <path d="M32 6a26 26 0 1 0 26 26A19.5 19.5 0 0 1 32 6z" fill={accent} transform="translate(40 30) scale(0.55)" />
      <text x="40" y="128" fill={ink} fontFamily="Instrument Serif, Georgia, serif" fontSize="44">
        {headline}
      </text>
      <text x="40" y="160" fill={ink} opacity="0.75" fontFamily="Public Sans, system-ui, sans-serif" fontSize="16">
        {body}
      </text>
      <rect x="40" y="180" width="160" height="42" rx="21" fill={accent} />
      <text x="120" y="207" textAnchor="middle" fill="#FBF7F2" fontFamily="Public Sans, system-ui, sans-serif" fontSize="15" fontWeight="600">
        {BRAND.copy.cta}
      </text>
    </svg>
  );
}

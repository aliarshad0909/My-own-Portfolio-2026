import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";

/** The obsidian background every composition shares, with a faint coral vignette. */
export const BrandBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: BRAND.bg, fontFamily: BRAND.fontBody }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 60% at 80% 20%, ${BRAND.coralSoft}, transparent 70%)`,
      }}
    />
    {children}
  </AbsoluteFill>
);

/** A rounded brand panel/card. */
export const Panel: React.FC<{
  style?: React.CSSProperties;
  active?: boolean;
  children?: React.ReactNode;
}> = ({ style, active, children }) => (
  <div
    style={{
      background: BRAND.card,
      border: `1.5px solid ${active ? BRAND.coralLine : BRAND.borderSoft}`,
      borderRadius: 16,
      boxShadow: active ? `0 0 0 4px ${BRAND.coralSoft}` : "none",
      transition: "none",
      ...style,
    }}
  >
    {children}
  </div>
);

/** A coral dot travelling along a horizontal segment, looping seamlessly. */
export const FlowDot: React.FC<{
  x1: number;
  x2: number;
  y: number;
  delay?: number;
  period?: number;
  r?: number;
}> = ({ x1, x2, y, delay = 0, period = 90, r = 6 }) => {
  const frame = useCurrentFrame();
  const t = ((frame - delay) % period) / period;
  const clamped = t < 0 ? 0 : t;
  const x = interpolate(clamped, [0, 1], [x1, x2]);
  const opacity = interpolate(clamped, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  return <circle cx={x} cy={y} r={r} fill={BRAND.coral} opacity={opacity} />;
};

/** Heading + sub text block, used as a caption layer. */
export const Caption: React.FC<{ title: string; sub?: string; x: number; y: number }> = ({
  title,
  sub,
  x,
  y,
}) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div style={{ color: BRAND.text, fontFamily: BRAND.fontHeading, fontSize: 44, fontWeight: 600 }}>
      {title}
    </div>
    {sub ? <div style={{ color: BRAND.muted, fontSize: 26, marginTop: 8 }}>{sub}</div> : null}
  </div>
);

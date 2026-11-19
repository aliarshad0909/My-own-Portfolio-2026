import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { BrandBackground, FlowDot } from "../components/primitives";

const STAGES = [
  { label: "CREATE", title: "Creative production", sub: "Brand · 3D · Video" },
  { label: "BUILD", title: "Development", sub: "Next.js · Commerce" },
  { label: "AUTOMATE", title: "AI automation", sub: "n8n · AI agents" },
];

/**
 * Homepage capabilities loop: three stages light up left-to-right as coral data
 * travels the rail, then holds — one continuous pipeline. 8s seamless loop.
 */
export const CapabilitiesPipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = [width * 0.2, width * 0.5, width * 0.8];
  const cy = height * 0.46;
  const r = 140;

  return (
    <BrandBackground>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <line x1={cx[0]} y1={cy} x2={cx[2]} y2={cy} stroke={BRAND.border} strokeWidth={2} />
        <FlowDot x1={cx[0]} x2={cx[2]} y={cy} period={fps * 4} />
        <FlowDot x1={cx[0]} x2={cx[2]} y={cy} delay={fps * 2} period={fps * 4} r={5} />
      </svg>

      {STAGES.map((s, i) => {
        const appear = spring({ frame: frame - i * 12, fps, config: { damping: 200 } });
        const pulse = interpolate(
          (frame - i * (fps * 1.33)) % (fps * 4),
          [0, fps * 0.3, fps * 0.9, fps * 1.4],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: cx[i] - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: `radial-gradient(60% 60% at 50% 40%, ${BRAND.surface}, ${BRAND.bg})`,
              border: `2px solid ${BRAND.border}`,
              boxShadow: `0 0 0 ${8 * pulse}px ${BRAND.coralSoft}`,
              transform: `scale(${appear})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ color: BRAND.coral, fontFamily: BRAND.fontHeading, fontSize: 22, letterSpacing: 4 }}>
              {s.label}
            </div>
            <div style={{ color: BRAND.text, fontFamily: BRAND.fontHeading, fontSize: 30, fontWeight: 600, marginTop: 6 }}>
              {s.title}
            </div>
            <div style={{ color: BRAND.muted, fontSize: 22, marginTop: 6 }}>{s.sub}</div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * 0.82,
          textAlign: "center",
          color: BRAND.muted,
          fontSize: 24,
          letterSpacing: 6,
        }}
      >
        ONE CONTINUOUS PIPELINE — NO HAND-OFFS
      </div>
    </BrandBackground>
  );
};

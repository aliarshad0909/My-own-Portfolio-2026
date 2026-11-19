import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { BrandBackground, FlowDot } from "../components/primitives";

/**
 * AI agent flow for the AI Agents hub: customer input → AI processing → tools /
 * knowledge → useful response, with the grounded-retrieval loop shown as the
 * agent reaching into tools and knowledge before answering. 8s seamless loop.
 */
export const AiAgentFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const input = { x: width * 0.12, y: height * 0.5 };
  const brain = { x: width * 0.5, y: height * 0.5 };
  const output = { x: width * 0.88, y: height * 0.5 };
  const tools = { x: width * 0.5, y: height * 0.18 };
  const knowledge = { x: width * 0.5, y: height * 0.82 };

  const brainScale = spring({ frame: frame - 12, fps, config: { damping: 200 } });

  const Pill: React.FC<{ p: { x: number; y: number }; label: string; title: string; delay: number }> = ({
    p,
    label,
    title,
    delay,
  }) => {
    const a = spring({ frame: frame - delay, fps, config: { damping: 200 } });
    return (
      <div
        style={{
          position: "absolute",
          left: p.x - 150,
          top: p.y - 50,
          width: 300,
          padding: "18px 22px",
          borderRadius: 14,
          background: BRAND.card,
          border: `1.5px solid ${BRAND.borderSoft}`,
          opacity: a,
          transform: `scale(${a})`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: BRAND.coral, fontFamily: BRAND.fontHeading, fontSize: 16, letterSpacing: 3 }}>{label}</div>
        <div style={{ color: BRAND.text, fontFamily: BRAND.fontHeading, fontSize: 26, fontWeight: 600, marginTop: 6 }}>{title}</div>
      </div>
    );
  };

  return (
    <BrandBackground>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <line x1={input.x + 150} y1={input.y} x2={brain.x - 150} y2={brain.y} stroke={BRAND.border} strokeWidth={2} />
        <line x1={brain.x + 150} y1={brain.y} x2={output.x - 150} y2={output.y} stroke={BRAND.border} strokeWidth={2} />
        <line x1={brain.x} y1={tools.y + 50} x2={brain.x} y2={brain.y - 90} stroke={BRAND.border} strokeWidth={2} strokeDasharray="6 8" />
        <line x1={brain.x} y1={brain.y + 90} x2={brain.x} y2={knowledge.y - 50} stroke={BRAND.border} strokeWidth={2} strokeDasharray="6 8" />

        <FlowDot x1={input.x + 150} x2={brain.x - 150} y={input.y} period={fps * 3} />
        <FlowDot x1={brain.x + 150} x2={output.x - 150} y={output.y} delay={fps * 1.5} period={fps * 3} />
      </svg>

      {/* central processing node */}
      <div
        style={{
          position: "absolute",
          left: brain.x - 100,
          top: brain.y - 100,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(60% 60% at 50% 40%, ${BRAND.surface}, ${BRAND.bg})`,
          border: `2px solid ${BRAND.coralLine}`,
          transform: `scale(${brainScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: BRAND.coral, fontFamily: BRAND.fontHeading, fontSize: 16, letterSpacing: 3 }}>AGENT</div>
        <div style={{ color: BRAND.text, fontFamily: BRAND.fontHeading, fontSize: 24, fontWeight: 600, marginTop: 4 }}>Reason</div>
      </div>

      <Pill p={input} label="INPUT" title="Customer asks" delay={0} />
      <Pill p={output} label="RESPONSE" title="Useful answer" delay={24} />
      <Pill p={tools} label="TOOLS" title="Actions / APIs" delay={16} />
      <Pill p={knowledge} label="KNOWLEDGE" title="Your content" delay={20} />
    </BrandBackground>
  );
};

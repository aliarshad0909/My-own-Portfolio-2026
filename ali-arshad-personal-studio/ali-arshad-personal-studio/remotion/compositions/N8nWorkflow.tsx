import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { BrandBackground, FlowDot } from "../components/primitives";

const NODES = [
  { label: "TRIGGER", title: "New inquiry", color: BRAND.coral },
  { label: "CONDITION", title: "Qualified?", color: BRAND.warn },
  { label: "ACTION", title: "Enrich + route", color: BRAND.coral },
  { label: "OUTCOME", title: "CRM + follow-up", color: BRAND.text },
];

/**
 * n8n workflow loop for the AI Automation hub: trigger → condition → action →
 * business outcome, with data flowing cleanly between nodes. Illustrative, not
 * a live screenshot. 8s seamless loop.
 */
export const N8nWorkflow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const nodeW = 300;
  const nodeH = 150;
  const gap = (width - NODES.length * nodeW) / (NODES.length + 1);
  const y = height / 2 - nodeH / 2;
  const railY = height / 2;

  const xOf = (i: number) => gap + i * (nodeW + gap);

  return (
    <BrandBackground>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {NODES.slice(0, -1).map((_, i) => {
          const x1 = xOf(i) + nodeW;
          const x2 = xOf(i + 1);
          return (
            <g key={i}>
              <line x1={x1} y1={railY} x2={x2} y2={railY} stroke={BRAND.border} strokeWidth={2} />
              <FlowDot x1={x1} x2={x2} y={railY} delay={i * (fps * 0.6)} period={fps * 3} />
            </g>
          );
        })}
      </svg>

      {NODES.map((n, i) => {
        const appear = spring({ frame: frame - i * 10, fps, config: { damping: 200 } });
        return (
          <div
            key={n.label}
            style={{
              position: "absolute",
              left: xOf(i),
              top: y,
              width: nodeW,
              height: nodeH,
              borderRadius: 16,
              background: BRAND.card,
              border: `1.5px solid ${BRAND.borderSoft}`,
              transform: `translateY(${(1 - appear) * 24}px)`,
              opacity: appear,
              padding: 24,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: n.color }} />
              <div style={{ color: BRAND.muted, fontFamily: BRAND.fontHeading, fontSize: 18, letterSpacing: 3 }}>
                {n.label}
              </div>
            </div>
            <div style={{ color: BRAND.text, fontFamily: BRAND.fontHeading, fontSize: 32, fontWeight: 600, marginTop: 18 }}>
              {n.title}
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.2, textAlign: "center", color: BRAND.muted, fontSize: 24, letterSpacing: 4 }}>
        AUTOMATED WORKFLOW · ILLUSTRATIVE
      </div>
    </BrandBackground>
  );
};

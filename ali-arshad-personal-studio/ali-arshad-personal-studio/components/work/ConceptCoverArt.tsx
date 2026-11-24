import type { ConceptVisualSpec } from "@/lib/projects-expansion-a";

/**
 * Bespoke dark-studio architectural blueprint SVG covers for the 66 expansion
 * project showcases so every card & detail header looks intentionally designed
 * with zero repetitive stock placeholder images.
 */
export function ConceptCoverArt({
  spec,
  title,
  status,
}: {
  spec: ConceptVisualSpec;
  title: string;
  status: string;
}) {
  const { accent, code, pattern } = spec;

  return (
    <svg
      viewBox="0 0 800 450"
      width={800}
      height={450}
      className="concept-cover-svg"
      role="img"
      aria-label={`${title} — ${status} architectural blueprint`}
    >
      <defs>
        <radialGradient id={`glow-${code}`} cx="78%" cy="22%" r="68%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.04" />
          <stop offset="100%" stopColor="#090c11" stopOpacity="0" />
        </radialGradient>
        <pattern id={`grid-${code}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="800" height="450" fill="#0c1118" />
      <rect width="800" height="450" fill={`url(#grid-${code})`} opacity="0.65" />
      <rect width="800" height="450" fill={`url(#glow-${code})`} />

      {/* Top technical header strip */}
      <rect x="34" y="28" width="108" height="28" rx="14" fill="#141c27" stroke={accent} strokeWidth="1.5" />
      <text x="88" y="47" textAnchor="middle" fill={accent} fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
        {code}
      </text>
      <rect x="154" y="28" width="150" height="28" rx="14" fill="#141c27" stroke="#334155" strokeWidth="1" />
      <text x="229" y="47" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
        {status.toUpperCase()}
      </text>

      {/* Pattern-specific clean architectural diagram */}
      {pattern === "flow" ? (
        <g>
          <path d="M120 225 H280 M360 225 H520 M600 225 H690" stroke={accent} strokeWidth="4" strokeDasharray="8 6" />
          {[
            { x: 64, l: "TRIGGER" },
            { x: 280, l: "VALIDATE" },
            { x: 520, l: "DELIVER" },
          ].map((n) => (
            <g key={n.l}>
              <rect x={n.x} y={176} width={116} height={98} rx={14} fill="#141d29" stroke={accent} strokeWidth="2" />
              <circle cx={n.x + 24} cy={202} r={6} fill={accent} />
              <text x={n.x + 58} y={238} textAnchor="middle" fill="#f8f5ef" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
                {n.l}
              </text>
            </g>
          ))}
        </g>
      ) : pattern === "chart" ? (
        <g>
          <rect x="70" y="106" width="660" height="260" rx="16" fill="#121a24" stroke="#283548" strokeWidth="1.5" />
          {[140, 210, 280, 350, 420, 490, 560, 630].map((x, i) => {
            const h = [78, 114, 96, 152, 134, 178, 162, 206][i];
            return <rect key={x} x={x} y={336 - h} width={38} height={h} rx={7} fill={i >= 6 ? accent : "#243244"} fillOpacity={i >= 6 ? 0.85 : 1} />;
          })}
          <polyline points="159,240 229,204 299,224 369,166 439,184 509,140 579,156 649,116" fill="none" stroke="#f8f5ef" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : pattern === "agent" ? (
        <g>
          <circle cx="400" cy="228" r="76" fill="#141d29" stroke={accent} strokeWidth="2.5" />
          <circle cx="400" cy="228" r="120" fill="none" stroke={accent} strokeOpacity="0.32" strokeDasharray="6 6" strokeWidth="2" />
          {[
            [180, 150, "RETRIEVE"],
            [620, 150, "VERIFY"],
            [180, 310, "CITE"],
            [620, 310, "ESCALATE"],
          ].map(([x, y, lbl]) => (
            <g key={lbl as string}>
              <line x1={x as number} y1={y as number} x2={400} y2={228} stroke={accent} strokeOpacity="0.45" strokeWidth="2" />
              <rect x={(x as number) - 64} y={(y as number) - 24} width={128} height={48} rx={12} fill="#141d29" stroke="#334155" strokeWidth="1.5" />
              <text x={x as number} y={(y as number) + 5} textAnchor="middle" fill="#f8f5ef" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
                {lbl as string}
              </text>
            </g>
          ))}
          <text x="400" y="233" textAnchor="middle" fill={accent} fontSize="15" fontWeight="700" fontFamily="ui-monospace, monospace">
            AGENT CORE
          </text>
        </g>
      ) : pattern === "commerce" ? (
        <g>
          <rect x="86" y="106" width="380" height="256" rx="16" fill="#131c27" stroke="#2d3b4e" strokeWidth="1.5" />
          <rect x="116" y="136" width="144" height="144" rx="12" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="2" />
          <rect x="282" y="140" width="150" height="18" rx="6" fill="#f8f5ef" fillOpacity="0.85" />
          <rect x="282" y="172" width="110" height="14" rx="5" fill="#64748b" />
          <rect x="282" y="220" width="136" height="44" rx="10" fill={accent} />
          <rect x="498" y="106" width="216" height="256" rx="16" fill="#131c27" stroke={accent} strokeOpacity="0.55" strokeWidth="1.5" />
          {[144, 194, 244, 294].map((y, i) => (
            <rect key={y} x="524" y={y} width={164} height={32} rx={8} fill={i === 3 ? accent : "#1c2736"} fillOpacity={i === 3 ? 0.3 : 1} />
          ))}
        </g>
      ) : pattern === "ledger" ? (
        <g>
          <rect x="80" y="104" width="640" height="260" rx="16" fill="#121a24" stroke="#283548" strokeWidth="1.5" />
          {[138, 192, 246, 300].map((y, i) => (
            <g key={y}>
              <rect x="108" y={y} width="584" height="38" rx="8" fill="#182332" stroke={i === 1 ? accent : "#263447"} />
              <circle cx="132" cy={y + 19} r="6" fill={i % 2 === 0 ? "#34d399" : accent} />
              <rect x="156" y={y + 13} width="180" height="12" rx="4" fill="#94a3b8" fillOpacity="0.55" />
              <rect x="546" y={y + 11} width="118" height="16" rx="6" fill={accent} fillOpacity="0.28" />
            </g>
          ))}
        </g>
      ) : pattern === "media" ? (
        <g>
          <rect x="96" y="102" width="608" height="200" rx="16" fill="#121a24" stroke={accent} strokeWidth="2" />
          <polygon points="374,166 446,202 374,238" fill={accent} />
          <rect x="96" y="324" width="608" height="40" rx="10" fill="#141e2b" stroke="#2d3b4e" />
          <rect x="116" y="336" width="220" height="16" rx="8" fill={accent} />
          <rect x="352" y="336" width="140" height="16" rx="8" fill="#38bdf8" fillOpacity="0.7" />
        </g>
      ) : pattern === "brand" ? (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={92 + i * 160} y={114} width={136} height={150} rx={16} fill={i === 0 ? accent : i === 1 ? "#16202e" : i === 2 ? "#38bdf8" : "#f8f5ef"} stroke="#334155" strokeWidth="1.5" />
          ))}
          <rect x="92" y="294" width="616" height="68" rx="14" fill="#131c27" stroke="#2b384a" />
          <text x="122" y="337" fill="#f8f5ef" fontSize="26" fontWeight="700">Aa Bb Cc · WCAG 2.2 Verified</text>
        </g>
      ) : (
        <g>
          <rect x="76" y="104" width="200" height="260" rx="14" fill="#131c27" stroke="#293648" />
          <rect x="300" y="104" width="424" height="118" rx="14" fill="#141e2b" stroke={accent} strokeWidth="1.8" />
          <rect x="300" y="242" width="202" height="122" rx="14" fill="#131c27" stroke="#293648" />
          <rect x="522" y="242" width="202" height="122" rx="14" fill="#131c27" stroke="#293648" />
          <circle cx="116" cy="146" r="14" fill={accent} fillOpacity="0.28" stroke={accent} strokeWidth="2" />
          <rect x="104" y="184" width="136" height="12" rx="4" fill="#64748b" />
          <rect x="104" y="210" width="108" height="12" rx="4" fill="#334155" />
          <rect x="328" y="138" width="210" height="18" rx="6" fill="#f8f5ef" fillOpacity="0.85" />
          <rect x="328" y="170" width="320" height="12" rx="4" fill="#94a3b8" fillOpacity="0.55" />
        </g>
      )}
    </svg>
  );
}

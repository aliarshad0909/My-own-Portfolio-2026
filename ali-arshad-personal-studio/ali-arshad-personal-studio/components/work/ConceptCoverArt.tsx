import type { ConceptVisualSpec } from "@/lib/projects-expansion-a";
import type { ProjectStatus } from "@/lib/projects";

type Props = {
  spec: ConceptVisualSpec;
  title: string;
  status: ProjectStatus;
};

/**
 * Original technical schematic SVG artwork for Concepts, Sample Scenarios, and
 * Built Prototypes without raster screenshots. Distinct across 14 architectural
 * patterns, strictly lightweight, and explicitly badged as schematic/concept
 * artwork rather than a production client screenshot.
 */
export function ConceptCoverArt({ spec, title, status }: Props) {
  const { accent, code, pattern } = spec;
  const badgeText = status === "Prototype" ? "PROTOTYPE SCHEMATIC" : status.toUpperCase();

  return (
    <svg
      viewBox="0 0 640 360"
      width={640}
      height={360}
      className="concept-cover-svg"
      role="img"
      aria-label={`${title} — ${status} architectural schematic illustration (not a client screenshot)`}
    >
      <defs>
        <linearGradient id={`bg-${code}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d131d" />
          <stop offset="100%" stopColor="#141d2b" />
        </linearGradient>
        <radialGradient id={`glow-${code}`} cx="78%" cy="22%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="360" fill={`url(#bg-${code})`} />
      <rect width="640" height="360" fill={`url(#glow-${code})`} />

      <g stroke="#223044" strokeWidth="1" opacity="0.55">
        {[80, 160, 240, 320, 400, 480, 560].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={360} />
        ))}
        {[72, 144, 216, 288].map((y) => (
          <line key={y} x1={0} y1={y} x2={640} y2={y} />
        ))}
      </g>

      {pattern === "flow" || pattern === "webhook" ? (
        <g>
          <path d="M90 185 H220 M280 185 H380 M440 185 H540" stroke={accent} strokeWidth="2.5" strokeDasharray={pattern === "webhook" ? "7 5" : undefined} />
          <path d="M250 185 Q315 110 380 140 M250 185 Q315 260 380 230" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 5" />
          {[
            [62, 160, 60, 50],
            [218, 160, 64, 50],
            [380, 114, 70, 48],
            [380, 206, 70, 48],
            [522, 160, 64, 50],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="10" fill="#101824" stroke={i === 1 || i === 4 ? accent : "#384b63"} strokeWidth="2" />
          ))}
          {pattern === "webhook" ? (
            <circle cx="250" cy="185" r="9" fill={accent} />
          ) : null}
        </g>
      ) : null}

      {pattern === "chart" || pattern === "finops" ? (
        <g>
          <rect x="74" y="102" width="492" height="196" rx="12" fill="#0f1723" stroke="#29384d" strokeWidth="1.5" />
          {[
            [114, 212, 42, 62],
            [180, 174, 42, 100],
            [246, 192, 42, 82],
            [312, 142, 42, 132],
            [378, 158, 42, 116],
            [444, 126, 42, 148],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill={i >= 4 ? accent : "#243447"} opacity={i >= 4 ? 0.9 : 0.85} />
          ))}
          <polyline points="135,204 201,166 267,184 333,134 399,148 465,118" fill="none" stroke="#f8f5ef" strokeWidth="2.5" strokeLinecap="round" />
          {pattern === "finops" ? (
            <line x1="90" y1="148" x2="544" y2="148" stroke={accent} strokeWidth="1.5" strokeDasharray="6 4" />
          ) : null}
        </g>
      ) : null}

      {pattern === "eval" ? (
        <g>
          <circle cx="210" cy="196" r="76" fill="#0f1723" stroke="#2e4057" strokeWidth="2" />
          <circle cx="210" cy="196" r="54" fill="none" stroke={accent} strokeWidth="7" strokeDasharray="248 92" strokeLinecap="round" />
          <circle cx="210" cy="196" r="24" fill="#172334" stroke="#38bdf8" strokeWidth="2" />
          <rect x="330" y="114" width="232" height="44" rx="10" fill="#101824" stroke={accent} strokeWidth="1.8" />
          <rect x="330" y="174" width="232" height="44" rx="10" fill="#101824" stroke="#34d399" strokeWidth="1.8" />
          <rect x="330" y="234" width="232" height="44" rx="10" fill="#101824" stroke="#384b63" strokeWidth="1.5" />
          {[136, 196, 256].map((cy, i) => (
            <circle key={cy} cx="354" cy={cy} r="7" fill={i < 2 ? "#34d399" : accent} />
          ))}
        </g>
      ) : null}

      {pattern === "gateway" || pattern === "scanner" ? (
        <g>
          <polygon points="320,96 404,132 404,218 320,276 236,218 236,132" fill="#101824" stroke={accent} strokeWidth="2.4" />
          <polygon points="320,126 376,150 376,208 320,246 264,208 264,150" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="90" y1="184" x2="236" y2="184" stroke={accent} strokeWidth="2.5" />
          <line x1="404" y1="164" x2="548" y2="164" stroke="#34d399" strokeWidth="2.5" />
          <line x1="404" y1="206" x2="516" y2="206" stroke="#fb7185" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="320" cy="184" r="14" fill={accent} />
        </g>
      ) : null}

      {pattern === "schema" ? (
        <g>
          <rect x="74" y="114" width="186" height="176" rx="10" fill="#101824" stroke="#384b63" strokeWidth="1.8" />
          <rect x="380" y="114" width="186" height="176" rx="10" fill="#101824" stroke={accent} strokeWidth="2" />
          <path d="M260 162 H380 M260 206 H380 M260 250 H380" stroke={accent} strokeWidth="2" strokeDasharray="5 4" />
          {[142, 182, 222, 260].map((y, i) => (
            <g key={y}>
              <rect x="94" y={y} width="124" height="12" rx="6" fill={i === 1 ? "#38bdf8" : "#253447"} />
              <rect x="400" y={y} width="136" height="12" rx="6" fill={i === 2 ? accent : "#2c3d54"} />
            </g>
          ))}
        </g>
      ) : null}

      {pattern === "agent" ? (
        <g>
          <circle cx="320" cy="192" r="52" fill="#101824" stroke={accent} strokeWidth="2.5" />
          <circle cx="320" cy="192" r="24" fill={accent} opacity="0.25" />
          <circle cx="320" cy="192" r="10" fill={accent} />
          {[
            [156, 130],
            [484, 130],
            [156, 254],
            [484, 254],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <line x1="320" y1="192" x2={cx} y2={cy} stroke="#384b63" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx={cx} cy={cy} r="22" fill="#101824" stroke="#475a75" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="6" fill="#f8f5ef" opacity="0.85" />
            </g>
          ))}
        </g>
      ) : null}

      {pattern === "commerce" ? (
        <g>
          <rect x="74" y="106" width="210" height="186" rx="12" fill="#101824" stroke={accent} strokeWidth="2" />
          <rect x="94" y="128" width="170" height="92" rx="8" fill={accent} opacity="0.2" />
          <rect x="94" y="236" width="110" height="12" rx="6" fill="#f8f5ef" opacity="0.85" />
          <rect x="94" y="258" width="76" height="10" rx="5" fill="#64748b" />
          <rect x="308" y="106" width="258" height="84" rx="12" fill="#101824" stroke="#2c3d54" strokeWidth="1.5" />
          <rect x="308" y="208" width="258" height="84" rx="12" fill="#101824" stroke="#2c3d54" strokeWidth="1.5" />
          <rect x="330" y="132" width="140" height="12" rx="6" fill="#f8f5ef" opacity="0.85" />
          <rect x="330" y="156" width="204" height="10" rx="5" fill="#475569" />
          <rect x="330" y="234" width="166" height="12" rx="6" fill={accent} opacity="0.9" />
          <rect x="330" y="258" width="180" height="10" rx="5" fill="#475569" />
        </g>
      ) : null}

      {pattern === "ledger" ? (
        <g>
          {[112, 168, 224].map((y, idx) => (
            <g key={y}>
              <rect x="74" y={y} width="492" height="44" rx="10" fill="#101824" stroke={idx === 0 ? accent : "#2c3d54"} strokeWidth="1.8" />
              <circle cx="102" cy={y + 22} r="7" fill={idx === 0 ? accent : "#38bdf8"} />
              <rect x="124" y={y + 16} width="150" height="12" rx="6" fill="#e2e8f0" opacity="0.8" />
              <rect x="310" y={y + 16} width="108" height="12" rx="6" fill="#475569" />
              <rect x="466" y={y + 13} width="80" height="18" rx="9" fill={accent} opacity="0.24" />
            </g>
          ))}
        </g>
      ) : null}

      {pattern === "media" ? (
        <g>
          <rect x="82" y="102" width="476" height="148" rx="14" fill="#101824" stroke={accent} strokeWidth="2" />
          <polygon points="298,150 298,202 346,176" fill={accent} />
          <rect x="82" y="266" width="476" height="28" rx="8" fill="#101824" stroke="#2c3d54" />
          <rect x="92" y="274" width="188" height="12" rx="6" fill={accent} opacity="0.85" />
          <rect x="292" y="274" width="126" height="12" rx="6" fill="#38bdf8" opacity="0.7" />
        </g>
      ) : null}

      {pattern === "brand" ? (
        <g>
          <circle cx="194" cy="196" r="76" fill={accent} opacity="0.22" stroke={accent} strokeWidth="2" />
          <circle cx="242" cy="196" r="54" fill="none" stroke="#f8f5ef" strokeOpacity="0.6" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={348 + i * 54}
              y={132}
              width="42"
              height="128"
              rx="10"
              fill={i === 0 ? accent : i === 1 ? "#38bdf8" : i === 2 ? "#f8f5ef" : "#243245"}
              opacity={i === 2 ? 0.85 : 0.9}
            />
          ))}
        </g>
      ) : null}

      {pattern === "grid" ? (
        <g>
          <rect x="74" y="108" width="150" height="184" rx="12" fill="#101824" stroke="#2c3d54" strokeWidth="1.5" />
          <rect x="242" y="108" width="324" height="84" rx="12" fill="#101824" stroke={accent} strokeWidth="2" />
          <rect x="242" y="208" width="154" height="84" rx="12" fill="#101824" stroke="#2c3d54" strokeWidth="1.5" />
          <rect x="412" y="208" width="154" height="84" rx="12" fill="#101824" stroke="#2c3d54" strokeWidth="1.5" />
          <circle cx="102" cy="138" r="10" fill={accent} opacity="0.3" stroke={accent} strokeWidth="2" />
          <rect x="266" y="134" width="160" height="12" rx="6" fill="#f8f5ef" opacity="0.85" />
          <rect x="266" y="158" width="248" height="10" rx="5" fill="#475569" />
        </g>
      ) : null}

      <g>
        <rect x="28" y="24" width="102" height="28" rx="14" fill="#111824" stroke={accent} strokeWidth="1.4" />
        <text x="79" y="42" textAnchor="middle" fill={accent} fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700">
          {code}
        </text>
        <rect x="140" y="24" width="184" height="28" rx="14" fill="#111824" stroke="#334155" strokeWidth="1.2" />
        <text x="232" y="42" textAnchor="middle" fill="#cbd5e1" fontFamily="ui-monospace, monospace" fontSize="10.5" fontWeight="600">
          {badgeText}
        </text>
      </g>
    </svg>
  );
}

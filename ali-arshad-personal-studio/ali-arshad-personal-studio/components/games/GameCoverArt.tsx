import type { GameSlug } from "@/lib/games/catalog";

/**
 * Original geometric SVG preview illustrations for the /games index cards.
 * Drawn inline with zero external bitmap dependencies.
 */
export function GameCoverArt({ slug }: { slug: GameSlug }) {
  if (slug === "signal-link") {
    return (
      <svg
        viewBox="0 0 400 225"
        width={400}
        height={225}
        className="game-card__svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="400" height="225" fill="#0f1419" />
        {/* Subtle 5x5 grid */}
        <g stroke="#24303a" strokeWidth="1">
          {[110, 146, 182, 218, 254, 290].map((x) => (
            <line key={`v-${x}`} x1={x} y1={22} x2={x} y2={202} />
          ))}
          {[22, 58, 94, 130, 166, 202].map((y) => (
            <line key={`h-${y}`} x1={110} y1={y} x2={290} y2={y} />
          ))}
        </g>
        {/* Signal paths */}
        <polyline
          points="128,40 272,40 272,112"
          fill="none"
          stroke="#ff7a5c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="128,76 128,184 272,184 272,148"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="164,76 236,76 236,148 200,148"
          fill="none"
          stroke="#f2c66d"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="164,148 164,112 200,112"
          fill="none"
          stroke="#34d399"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Endpoints */}
        {[
          { cx: 128, cy: 40, fill: "#ff7a5c", t: "A", tc: "#14100e" },
          { cx: 272, cy: 112, fill: "#ff7a5c", t: "A", tc: "#14100e" },
          { cx: 128, cy: 76, fill: "#38bdf8", t: "B", tc: "#09131c" },
          { cx: 272, cy: 148, fill: "#38bdf8", t: "B", tc: "#09131c" },
          { cx: 164, cy: 76, fill: "#f2c66d", t: "C", tc: "#171308" },
          { cx: 200, cy: 148, fill: "#f2c66d", t: "C", tc: "#171308" },
          { cx: 164, cy: 148, fill: "#34d399", t: "D", tc: "#071a13" },
          { cx: 200, cy: 112, fill: "#34d399", t: "D", tc: "#071a13" },
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={12} fill={n.fill} />
            <text
              x={n.cx}
              y={n.cy + 4}
              textAnchor="middle"
              fill={n.tc}
              fontSize="11"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
            >
              {n.t}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "pulse-grid") {
    const active = new Set([0, 2, 5, 6, 9, 10, 13, 15]);
    return (
      <svg
        viewBox="0 0 400 225"
        width={400}
        height={225}
        className="game-card__svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="400" height="225" fill="#0f1419" />
        {Array.from({ length: 16 }, (_, i) => {
          const r = Math.floor(i / 4);
          const c = i % 4;
          const x = 114 + c * 44;
          const y = 26 + r * 44;
          const on = active.has(i);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={38}
                height={38}
                rx={8}
                fill={on ? "rgba(255, 122, 92, 0.2)" : "#171d24"}
                stroke={on ? "#ff7a5c" : "#2c3640"}
                strokeWidth={on ? 2 : 1}
              />
              {on ? (
                <circle cx={x + 19} cy={y + 19} r={7} fill="#ff7a5c" />
              ) : (
                <circle cx={x + 19} cy={y + 19} r={3} fill="#394552" />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 225"
      width={400}
      height={225}
      className="game-card__svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="225" fill="#0f1419" />
      {[
        { x: 96, y: 26, open: true, color: "#ff7a5c", shape: "prism" },
        { x: 150, y: 26, open: false, color: "#2c3640", shape: "" },
        { x: 204, y: 26, open: true, color: "#34d399", shape: "wave" },
        { x: 258, y: 26, open: false, color: "#2c3640", shape: "" },
        { x: 96, y: 84, open: false, color: "#2c3640", shape: "" },
        { x: 150, y: 84, open: true, color: "#ff7a5c", shape: "prism" },
        { x: 204, y: 84, open: false, color: "#2c3640", shape: "" },
        { x: 258, y: 84, open: true, color: "#38bdf8", shape: "orbit" },
        { x: 96, y: 142, open: true, color: "#38bdf8", shape: "orbit" },
        { x: 150, y: 142, open: false, color: "#2c3640", shape: "" },
        { x: 204, y: 142, open: true, color: "#34d399", shape: "wave" },
        { x: 258, y: 142, open: false, color: "#2c3640", shape: "" },
      ].map((card, idx) => (
        <g key={idx}>
          <rect
            x={card.x}
            y={card.y}
            width={46}
            height={50}
            rx={8}
            fill={card.open ? "#162128" : "#151a20"}
            stroke={card.open ? card.color : "#2c3640"}
            strokeWidth={card.open ? 1.75 : 1}
          />
          {card.shape === "prism" ? (
            <polygon
              points={`${card.x + 23},${card.y + 13} ${card.x + 35},${card.y + 36} ${card.x + 11},${card.y + 36}`}
              fill="none"
              stroke={card.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          ) : null}
          {card.shape === "orbit" ? (
            <g stroke={card.color} fill="none" strokeWidth="2">
              <circle cx={card.x + 23} cy={card.y + 25} r={10} />
              <circle cx={card.x + 23} cy={card.y + 25} r={3} fill={card.color} />
            </g>
          ) : null}
          {card.shape === "wave" ? (
            <path
              d={`M ${card.x + 10} ${card.y + 25} Q ${card.x + 16} ${card.y + 13}, ${card.x + 23} ${card.y + 25} T ${card.x + 36} ${card.y + 25}`}
              fill="none"
              stroke={card.color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : null}
          {!card.open ? (
            <circle cx={card.x + 23} cy={card.y + 25} r={4} fill="#2e3844" />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

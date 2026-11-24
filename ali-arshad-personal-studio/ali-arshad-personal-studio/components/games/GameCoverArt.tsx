import type { GameSlug } from "@/lib/games/catalog";

/**
 * Unique original geometric SVG cover artwork for every one of the 20 playable
 * browser games on `/games`. Zero external bitmap assets.
 */
export function GameCoverArt({ slug }: { slug: GameSlug }) {
  const bg = "#0d121a";

  if (slug === "signal-link") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <g stroke="#243040" strokeWidth="1">
          {[110, 146, 182, 218, 254, 290].map((x) => <line key={x} x1={x} y1={22} x2={x} y2={202} />)}
          {[22, 58, 94, 130, 166, 202].map((y) => <line key={y} x1={110} y1={y} x2={290} y2={y} />)}
        </g>
        <polyline points="128,40 272,40 272,112" fill="none" stroke="#ff7a5c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="128,76 128,184 272,184 272,148" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="164,76 236,76 236,148 200,148" fill="none" stroke="#f5c451" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="164,148 164,112 200,112" fill="none" stroke="#34d399" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {[
          [128, 40, "#ff7a5c", "A"], [272, 112, "#ff7a5c", "A"],
          [128, 76, "#38bdf8", "B"], [272, 148, "#38bdf8", "B"],
          [164, 76, "#f5c451", "C"], [200, 148, "#f5c451", "C"],
          [164, 148, "#34d399", "D"], [200, 112, "#34d399", "D"],
        ].map(([cx, cy, fill, t], i) => (
          <g key={i}>
            <circle cx={cx as number} cy={cy as number} r={11} fill={fill as string} />
            <text x={cx as number} y={(cy as number) + 4} textAnchor="middle" fill="#090c11" fontSize="10" fontWeight="700">{t as string}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "circuit-turn") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <path d="M52 112 H148 V64 H252 V160 H348" fill="none" stroke="#ff7a5c" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M148 160 H200 V112" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {[148, 252].map((x) => <circle key={x} cx={x} cy={64} r={7} fill="#ff947a" />)}
        <circle cx={52} cy={112} r={12} fill="#ff7a5c" />
        <circle cx={348} cy={160} r={12} fill="#34d399" />
      </svg>
    );
  }

  if (slug === "knight-relay") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {Array.from({ length: 16 }, (_, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          return <rect key={i} x={118 + c * 42} y={30 + r * 42} width={36} height={36} rx={7} fill="#141c27" stroke="#293444" />;
        })}
        <polyline points="136,48 220,90 178,174 262,132" fill="none" stroke="#f5c451" strokeWidth="4" strokeDasharray="6 5" />
        <circle cx={136} cy={48} r={10} fill="#ff7a5c" />
        <circle cx={220} cy={90} r={8} fill="#38bdf8" />
        <circle cx={178} cy={174} r={8} fill="#34d399" />
        <circle cx={262} cy={132} r={10} fill="#f5c451" />
      </svg>
    );
  }

  if (slug === "pulse-grid") {
    const active = new Set([0, 2, 5, 6, 9, 10, 13, 15]);
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {Array.from({ length: 16 }, (_, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          const x = 114 + c * 44, y = 26 + r * 44;
          const on = active.has(i);
          return (
            <g key={i}>
              <rect x={x} y={y} width={38} height={38} rx={8} fill={on ? "rgba(255,122,92,0.22)" : "#151d28"} stroke={on ? "#ff7a5c" : "#2c3645"} strokeWidth={on ? 2 : 1} />
              <circle cx={x + 19} cy={y + 19} r={on ? 7 : 3} fill={on ? "#ff7a5c" : "#3a4859"} />
            </g>
          );
        })}
      </svg>
    );
  }

  if (slug === "glyph-sudoku") {
    const nums = ["1", "", "3", "4", "", "4", "1", "", "2", "", "4", "", "", "3", "", "1"];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {nums.map((n, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          const x = 116 + c * 43, y = 28 + r * 43;
          return (
            <g key={i}>
              <rect x={x} y={y} width={38} height={38} rx={7} fill={n ? "#1a2534" : "#121822"} stroke={n ? "#38bdf8" : "#2a3444"} />
              <text x={x + 19} y={y + 24} textAnchor="middle" fill="#f8f5ef" fontSize="15" fontWeight="700">{n}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (slug === "mosaic-clues") {
    const bits = [0,0,1,0,0, 0,1,0,1,0, 0,1,0,1,0, 1,1,1,1,1, 1,0,0,0,1];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {bits.map((b, i) => {
          const r = Math.floor(i / 5), c = i % 5;
          return <rect key={i} x={125 + c * 31} y={36 + r * 31} width={27} height={27} rx={5} fill={b ? "#a78bfa" : "#151d28"} stroke="#2d394a" />;
        })}
      </svg>
    );
  }

  if (slug === "mine-sweep-lab") {
    const vals = ["", "1", "⚑", "1", "1", "2", "2", "1", "⚑", "2", "✹", "1"];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {vals.map((v, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          const x = 114 + c * 44, y = 44 + r * 46;
          return (
            <g key={i}>
              <rect x={x} y={y} width={38} height={40} rx={7} fill={v === "✹" ? "rgba(251,113,133,0.28)" : v === "⚑" ? "rgba(245,196,81,0.2)" : "#182230"} stroke={v === "✹" ? "#fb7185" : v === "⚑" ? "#f5c451" : "#334155"} />
              <text x={x + 19} y={y + 25} textAnchor="middle" fill="#f8f5ef" fontSize="15" fontWeight="700">{v}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (slug === "studio-pairs") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {[
          [96, 26, "#ff7a5c", true], [150, 26, "#2c3645", false], [204, 26, "#34d399", true], [258, 26, "#2c3645", false],
          [96, 84, "#2c3645", false], [150, 84, "#ff7a5c", true], [204, 84, "#2c3645", false], [258, 84, "#38bdf8", true],
          [96, 142, "#38bdf8", true], [150, 142, "#2c3645", false], [204, 142, "#34d399", true], [258, 142, "#2c3645", false],
        ].map(([x, y, c, open], i) => (
          <g key={i}>
            <rect x={x as number} y={y as number} width={46} height={50} rx={8} fill={open ? "#16212e" : "#121822"} stroke={c as string} strokeWidth={open ? 1.8 : 1} />
            <circle cx={(x as number) + 23} cy={(y as number) + 25} r={open ? 9 : 4} fill={open ? "none" : "#2f3a4a"} stroke={open ? (c as string) : "none"} strokeWidth="2.2" />
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "echo-pads") {
    const pads = [[116, 34, "#ff7a5c", "1"], [206, 34, "#38bdf8", "2"], [116, 120, "#34d399", "3"], [206, 120, "#f5c451", "4"]];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {pads.map(([x, y, c, t], i) => (
          <g key={i}>
            <rect x={x as number} y={y as number} width={78} height={74} rx={12} fill={i === 1 ? (c as string) : "#151e29"} stroke={c as string} strokeWidth="2.5" />
            <text x={(x as number) + 39} y={(y as number) + 44} textAnchor="middle" fill={i === 1 ? "#090c11" : "#f8f5ef"} fontSize="20" fontWeight="700">{t as string}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "flash-matrix") {
    const lit = new Set([1, 4, 6, 10, 14]);
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {Array.from({ length: 16 }, (_, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          return <rect key={i} x={116 + c * 43} y={28 + r * 43} width={36} height={36} rx={7} fill={lit.has(i) ? "#38bdf8" : "#141c27"} stroke={lit.has(i) ? "#7dd3fc" : "#293545"} />;
        })}
      </svg>
    );
  }

  if (slug === "cipher-five") {
    const row = [["S", "#34d399"], ["T", "#1e293b"], ["A", "#f5c451"], ["C", "#34d399"], ["K", "#34d399"]];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {row.map(([ch, c], i) => (
          <g key={i}>
            <rect x={76 + i * 50} y={82} width={44} height={52} rx={8} fill={c} fillOpacity={0.28} stroke={c} strokeWidth="2" />
            <text x={98 + i * 50} y={115} textAnchor="middle" fill="#f8f5ef" fontSize="20" fontWeight="700">{ch}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "sum-shift") {
    const cells = [["2", "#1e293b"], ["8", "#5e3528"], ["64", "#c64c32"], ["256", "#1d7a58"]];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {cells.map(([n, c], i) => (
          <g key={i}>
            <rect x={68 + i * 68} y={76} width={60} height={68} rx={10} fill={c} stroke="#38475b" />
            <text x={98 + i * 68} y={117} textAnchor="middle" fill="#f8f5ef" fontSize="18" fontWeight="700">{n}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "equation-forge") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {["3", "×", "8", "=", "24"].map((t, i) => (
          <g key={i}>
            <rect x={54 + i * 60} y={84} width={50} height={54} rx={10} fill={i === 4 ? "rgba(52,211,153,0.22)" : "#16202e"} stroke={i === 4 ? "#34d399" : i % 2 === 1 ? "#ff7a5c" : "#3a495c"} strokeWidth="1.8" />
            <text x={79 + i * 60} y={118} textAnchor="middle" fill="#f8f5ef" fontSize="20" fontWeight="700">{t}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "slide-order") {
    const nums = ["1", "2", "3", "4", "5", "6", "7", "8", ""];
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        {nums.map((n, i) => {
          const r = Math.floor(i / 3), c = i % 3;
          return (
            <g key={i}>
              <rect x={122 + c * 54} y={32 + r * 54} width={48} height={48} rx={9} fill={n ? "#172230" : "#0f151e"} stroke={n ? "#38bdf8" : "#263242"} strokeDasharray={n ? undefined : "4 4"} />
              <text x={146 + c * 54} y={62 + r * 54} textAnchor="middle" fill="#f8f5ef" fontSize="18" fontWeight="700">{n}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (slug === "reflex-gate") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <rect x={64} y={56} width={272} height={112} rx={16} fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="2.5" />
        <text x={200} y={108} textAnchor="middle" fill="#a7f3d0" fontSize="24" fontWeight="700">GO · 214 ms</text>
        <text x={200} y={136} textAnchor="middle" fill="#94a3b8" fontSize="12">5-ROUND REACTION BENCH</text>
      </svg>
    );
  }

  if (slug === "orbit-catch") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <rect x={44} y={88} width={312} height={48} rx={24} fill="#141c27" stroke="#334155" strokeWidth="2" />
        <rect x={162} y={88} width={76} height={48} fill="rgba(255,122,92,0.28)" stroke="#ff7a5c" strokeWidth="2" />
        <rect x={194} y={96} width={12} height={32} rx={6} fill="#f8f5ef" />
      </svg>
    );
  }

  if (slug === "target-burst") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <circle cx={200} cy={112} r={62} fill="none" stroke="#ff7a5c" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx={200} cy={112} r={38} fill="rgba(255,122,92,0.2)" stroke="#ff7a5c" strokeWidth="2.5" />
        <circle cx={200} cy={112} r={12} fill="#ff7a5c" />
      </svg>
    );
  }

  if (slug === "chroma-match") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <rect x={68} y={50} width={120} height={124} rx={14} fill="#ff7a5c" />
        <rect x={212} y={50} width={120} height={124} rx={14} fill="#f88668" stroke="#f8f5ef" strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "contrast-judge") {
    return (
      <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
        <rect width="400" height="225" fill={bg} />
        <rect x={68} y={48} width={264} height={128} rx={14} fill="#141a24" stroke="#34d399" strokeWidth="2" />
        <text x={200} y={108} textAnchor="middle" fill="#f8f5ef" fontSize="28" fontWeight="700">Aa · 15.8:1</text>
        <text x={200} y={140} textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="700">WCAG 2.2 AAA PASS</text>
      </svg>
    );
  }

  // gradient-sort (Spectrum Order)
  const stops = ["#ff7a5c", "#fb9258", "#f7aa55", "#f5c451", "#a3d977", "#34d399"];
  return (
    <svg viewBox="0 0 400 225" width={400} height={225} className="game-card__svg" aria-hidden="true" focusable="false">
      <rect width="400" height="225" fill={bg} />
      {stops.map((c, i) => (
        <rect key={c} x={52 + i * 50} y={58} width={42} height={108} rx={9} fill={c} />
      ))}
    </svg>
  );
}

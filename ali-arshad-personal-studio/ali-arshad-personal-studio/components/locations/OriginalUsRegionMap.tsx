import type { FictionalMapMarker } from "@/lib/geo/fictional-profiles";

type Props = {
  /** Scenario title shown inside accessible description & map title. */
  scenarioName: string;
  /** Synthetic illustrative markers plotted on the original 4-region US map geometry. */
  markers: FictionalMapMarker[];
  /** Explicit honesty caption displayed cleanly beneath the map. */
  caption: string;
  /** Render compact legend (for location cards) or full accessible marker list (for detail pages). */
  detailed?: boolean;
};

/**
 * Reuses the studio's exact original 4-region geometric US schematic map
 * (`public/images/site-visuals/locations/us-remote-regions-map.svg` — WEST,
 * MIDWEST, SOUTH, NORTHEAST + AK/HI insets, identical polygon coordinates and
 * obsidian/coral visual system) as the visual base, overlaying explicitly
 * labeled synthetic illustrative markers for fictional demo scenarios.
 */
export function OriginalUsRegionMap({ scenarioName, markers, caption, detailed = false }: Props) {
  const highlightedRegions = new Set(markers.map((m) => m.region));
  const summaryText = markers
    .map((m) => `${m.shortLabel}: ${m.syntheticLocation} (${m.markerKind}). ${m.description}`)
    .join(" ");

  return (
    <figure className={`fictional-map ${detailed ? "fictional-map--detailed" : ""}`.trim()}>
      <div className="fictional-map__banner" role="note">
        <span>FICTIONAL DEMO SCENARIO · SYNTHETIC ILLUSTRATIVE MARKERS · NOT A REAL CLIENT OR ADDRESS</span>
      </div>

      <svg
        viewBox="0 0 708 492"
        width={708}
        height={492}
        role="img"
        aria-label={`Original studio 4-region US schematic map illustrating fictional scenario ${scenarioName}. ${summaryText}`}
      >
        <title>{scenarioName} — Fictional Illustrative Markers on Original US Regional Map</title>
        <defs>
          <linearGradient id="orig-usm-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1116" />
            <stop offset="100%" stopColor="#131b21" />
          </linearGradient>
        </defs>

        {/* Preserved original frame & header from us-remote-regions-map.svg */}
        <rect width="708" height="492" rx="12" fill="url(#orig-usm-bg)" stroke="#253038" strokeWidth="1.5" />
        <text
          x="24"
          y="34"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Inter, sans-serif"
          fontSize="12"
          fontWeight="600"
          letterSpacing="1.3"
          fill="#a9abb2"
        >
          ORIGINAL US REGIONAL SCHEMATIC · SYNTHETIC FICTIONAL OVERLAY
        </text>

        {/* WEST REGION polygon (exact original path) */}
        <path
          d="M54 96 L244 96 L244 328 L160 328 L120 296 L64 252 L44 174 Z"
          fill={highlightedRegions.has("West") ? "#222f39" : "#1b262e"}
          stroke="#ff7a5c"
          strokeOpacity={highlightedRegions.has("West") ? 0.95 : 0.45}
          strokeWidth={highlightedRegions.has("West") ? 2.5 : 1.75}
        />
        <text x="72" y="128" fontFamily="system-ui, sans-serif" fontSize="15" fontWeight="600" fill="#f9f6f0" opacity="0.88">
          WEST
        </text>
        <text x="72" y="146" fontFamily="system-ui, sans-serif" fontSize="11.5" fill="#a9abb2">
          13 States · PT / MT
        </text>

        {/* AK & HI minimal insets (exact original positions) */}
        <rect x="54" y="356" width="84" height="48" rx="8" fill="#162027" stroke="#364854" />
        <text x="69" y="385" fontFamily="system-ui, sans-serif" fontSize="12.5" fill="#d9d7d2">
          AK · Remote
        </text>
        <rect x="150" y="356" width="84" height="48" rx="8" fill="#162027" stroke="#364854" />
        <text x="166" y="385" fontFamily="system-ui, sans-serif" fontSize="12.5" fill="#d9d7d2">
          HI · Remote
        </text>

        {/* MIDWEST REGION polygon (exact original path) */}
        <path
          d="M254 96 L486 96 L496 226 L464 248 L254 248 Z"
          fill={highlightedRegions.has("Midwest") ? "#1f2d37" : "#172229"}
          stroke={highlightedRegions.has("Midwest") ? "#ff7a5c" : "#3c4f5d"}
          strokeOpacity={highlightedRegions.has("Midwest") ? 0.9 : 0.9}
          strokeWidth={highlightedRegions.has("Midwest") ? 2.5 : 1.75}
        />
        <text x="274" y="128" fontFamily="system-ui, sans-serif" fontSize="15" fontWeight="600" fill="#f9f6f0" opacity="0.88">
          MIDWEST
        </text>
        <text x="274" y="146" fontFamily="system-ui, sans-serif" fontSize="11.5" fill="#a9abb2">
          12 States · CT / ET
        </text>

        {/* SOUTH REGION polygon (exact original path) */}
        <path
          d="M254 258 L544 258 L568 318 L528 424 L490 424 L452 362 L352 384 L318 418 L254 358 Z"
          fill={highlightedRegions.has("South") ? "#222e37" : "#19232a"}
          stroke="#ff7a5c"
          strokeOpacity={highlightedRegions.has("South") ? 0.95 : 0.4}
          strokeWidth={highlightedRegions.has("South") ? 2.5 : 1.75}
        />
        <text x="274" y="288" fontFamily="system-ui, sans-serif" fontSize="15" fontWeight="600" fill="#f9f6f0" opacity="0.88">
          SOUTH
        </text>
        <text x="274" y="306" fontFamily="system-ui, sans-serif" fontSize="11.5" fill="#a9abb2">
          16 States + D.C.
        </text>

        {/* NORTHEAST REGION polygon (exact original path) */}
        <path
          d="M498 96 L646 84 L662 152 L614 218 L552 246 L508 226 Z"
          fill={highlightedRegions.has("Northeast") ? "#24323c" : "#1d2830"}
          stroke="#ff7a5c"
          strokeOpacity={highlightedRegions.has("Northeast") ? 0.95 : 0.55}
          strokeWidth={highlightedRegions.has("Northeast") ? 2.5 : 1.75}
        />
        <text x="518" y="124" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="600" fill="#f9f6f0" opacity="0.88">
          NORTHEAST
        </text>
        <text x="518" y="141" fontFamily="system-ui, sans-serif" fontSize="11.5" fill="#a9abb2">
          9 States · ET
        </text>

        {/* Connecting dashed network arcs when multiple fictional markers interact */}
        {markers.length > 1 ? (
          <g stroke="#f5c451" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.65" fill="none">
            {markers.slice(1).map((m) => (
              <line key={`arc-${m.id}`} x1={markers[0].x} y1={markers[0].y} x2={m.x} y2={m.y} />
            ))}
          </g>
        ) : null}

        {/* Explicit synthetic illustrative markers */}
        {markers.map((marker, idx) => {
          const isRemote = marker.markerKind.includes("Remote");
          const pinColor = isRemote ? "#38bdf8" : "#ff7a5c";
          const labelWidth = Math.min(188, Math.max(122, marker.shortLabel.length * 7.2 + 22));
          const labelX = marker.x > 490 ? marker.x - labelWidth - 14 : marker.x + 16;
          const labelY = Math.max(66, Math.min(410, marker.y - 13));
          return (
            <g key={marker.id}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r={20}
                fill={isRemote ? "rgba(56, 189, 248, 0.14)" : "rgba(245, 196, 81, 0.16)"}
                stroke="#f5c451"
                strokeWidth="1.25"
                strokeDasharray="3 3"
              />
              <circle cx={marker.x} cy={marker.y} r={10} fill={pinColor} stroke="#f8f5ef" strokeWidth="2" />
              <text
                x={marker.x}
                y={marker.y + 3.5}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="10"
                fontWeight="700"
                fill="#0b0f16"
              >
                {idx + 1}
              </text>
              <rect
                x={labelX}
                y={labelY}
                width={labelWidth}
                height={26}
                rx="6"
                fill="rgba(11, 16, 23, 0.92)"
                stroke="#f5c451"
                strokeOpacity="0.6"
                strokeWidth="1"
              />
              <text
                x={labelX + 9}
                y={labelY + 17}
                fontFamily="ui-monospace, monospace"
                fontSize="10.5"
                fontWeight="600"
                fill="#f8f5ef"
              >
                {marker.shortLabel}
              </text>
            </g>
          );
        })}

        <text x="24" y="468" fontFamily="system-ui, sans-serif" fontSize="12" fill="#f5c451">
          Synthetic illustrative markers only — zero real client offices, stores, or street addresses.
        </text>
      </svg>

      <figcaption className="fictional-map__caption">
        <p>{caption}</p>
        <ul className="fictional-map__legend" aria-label={`Synthetic marker descriptions for ${scenarioName}`}>
          {markers.map((m, i) => (
            <li key={m.id}>
              <strong>
                [{i + 1}] {m.shortLabel} ({m.region} · {m.markerKind}):
              </strong>{" "}
              {detailed ? m.description : m.syntheticLocation}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

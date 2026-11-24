import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { FictionalCustomerProfile } from "@/lib/geo/fictional-profiles";

/**
 * Renders explicitly disclosed fictional demo customer profiles with synthetic,
 * illustrative map pin graphics (zero real street addresses, zero real client claims).
 */
export function FictionalCustomerShowcase({
  locationLabel,
  profiles,
}: {
  locationLabel: string;
  profiles: FictionalCustomerProfile[];
}) {
  if (profiles.length === 0) return null;

  return (
    <div className="location-detail__projects" aria-labelledby="fictional-profiles-heading">
      <p className="eyebrow eyebrow--plain">Illustrative fictional customer scenarios</p>
      <h2 className="section-title section-title--sm" id="fictional-profiles-heading">
        Fictional demo customer examples relevant to {locationLabel}
      </h2>
      <p className="section-sub measure">
        The example businesses below are <strong>100% fictional demo customer profiles</strong> created solely to show how our remote services and
        working software demonstrations could fit real operating models. None are real clients, none hired this studio, and every map pin is a
        synthetic illustrative marker rather than a real address.
      </p>

      <div className="fictional-profile-grid">
        {profiles.map((p) => (
          <article key={p.id} className="fictional-card">
            <div className="game-card__badges">
              <span className="badge badge--draft">{p.disclosureBadge}</span>
              <span className="badge">{p.operatingModel}</span>
            </div>

            <div>
              <h3 className="card-title">{p.fictionalName}</h3>
              <p className="fine-print" style={{ marginTop: "4px" }}>
                Industry: {p.industry} · Scenario footprint:{" "}
                {p.hasPhysicalStorefrontInScenario
                  ? "Simulated physical locations (fictional)"
                  : "Simulated 100% remote company (no physical store)"}
              </p>
            </div>

            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9375rem", lineHeight: 1.58 }}>
              <strong style={{ color: "var(--text)" }}>Sample problem:</strong> {p.sampleProblem}
            </p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9375rem", lineHeight: 1.58 }}>
              <strong style={{ color: "var(--text)" }}>Illustrative remote approach:</strong> {p.illustrativeApproach}
            </p>

            <div className="fictional-map">
              <svg
                viewBox="0 0 420 170"
                width={420}
                height={170}
                role="img"
                aria-label={`Illustrative schematic map showing synthetic marker for fictional scenario ${p.fictionalName} — not a real business address`}
              >
                <rect width="420" height="170" fill="#0d131d" />
                <g stroke="#1e2a3a" strokeWidth="1">
                  {[60, 120, 180, 240, 300, 360].map((x) => (
                    <line key={x} x1={x} y1={0} x2={x} y2={170} />
                  ))}
                  {[34, 68, 102, 136].map((y) => (
                    <line key={y} x1={0} y1={y} x2={420} y2={y} />
                  ))}
                </g>
                {/* Stylized regional outline band */}
                <path
                  d="M42 42 Q120 26 210 38 T378 46 L366 132 Q270 144 195 130 T54 126 Z"
                  fill="rgba(56, 189, 248, 0.06)"
                  stroke="#2b3a4f"
                  strokeDasharray="4 4"
                />
                {/* Synthetic pin */}
                <circle
                  cx={Math.round((p.mapPin.xPct / 100) * 420)}
                  cy={Math.round((p.mapPin.yPct / 100) * 170)}
                  r={22}
                  fill="rgba(245, 196, 81, 0.14)"
                  stroke="#f5c451"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={Math.round((p.mapPin.xPct / 100) * 420)}
                  cy={Math.round((p.mapPin.yPct / 100) * 170)}
                  r={7}
                  fill="#ff7a5c"
                  stroke="#f8f5ef"
                  strokeWidth="2"
                />
                <text
                  x={14}
                  y={22}
                  fill="#f5c451"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                >
                  SYNTHETIC ILLUSTRATIVE MARKER · NOT A REAL ADDRESS
                </text>
                <text
                  x={14}
                  y={156}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {p.mapPin.approximateCoordsLabel}
                </text>
              </svg>
              <div className="fictional-map__caption">{p.mapPin.caption}</div>
            </div>

            <div>
              <p className="eyebrow eyebrow--plain" style={{ marginBottom: "8px" }}>
                Paired working studio demos &amp; services
              </p>
              <ul className="niche-directory__list">
                {p.pairedExamples.map((ex) => (
                  <li key={ex.href}>
                    <Link href={ex.href}>
                      <span>
                        {ex.title} <small className="muted">({ex.buildLabel})</small>
                      </span>
                      <Icon name="arrow-up-right" size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

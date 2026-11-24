import Link from "next/link";
import { OriginalUsRegionMap } from "@/components/locations/OriginalUsRegionMap";
import { Icon } from "@/components/ui/Icon";
import type { FictionalCustomerProfile } from "@/lib/geo/fictional-profiles";

/**
 * Renders explicitly disclosed fictional demo customer profiles reusing the
 * studio's original 4-region US schematic map with synthetic illustrative
 * markers and direct links to each fictional organization's detail & team page.
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
        The example organizations below are <strong>100% fictional demo scenarios</strong> created solely to show how our remote services and
        working software demonstrations could apply to real operating models. None are real clients, none hired this studio, and every marker plotted
        on the regional map is synthetic and illustrative rather than a real address.
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

            <OriginalUsRegionMap
              scenarioName={p.fictionalName}
              markers={p.mapMarkers}
              caption={p.mapPin.caption}
            />

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

            <div className="fictional-card__footer">
              <Link href={`/demo-scenarios/${p.slug}`} className="btn btn--secondary btn--sm">
                <span>Inspect fictional scenario &amp; team ({p.teamHierarchy.length} roles)</span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

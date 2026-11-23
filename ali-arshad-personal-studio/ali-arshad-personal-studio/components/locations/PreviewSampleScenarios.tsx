import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { shouldShowPreviewSamples, type PreviewSampleScenario } from "@/lib/geo/preview-samples";

/**
 * Preview-only sample scenario panel for location pages.
 * Automatically returns `null` when `VERCEL_ENV === "production"`, keeping all
 * TEST / SAMPLE CONTENT strictly out of production pages and sitemaps.
 */
export function PreviewSampleScenarios({
  locationName,
  scenarios,
}: {
  locationName: string;
  scenarios: PreviewSampleScenario[];
}) {
  if (!shouldShowPreviewSamples() || scenarios.length === 0) return null;

  return (
    <section
      className="preview-samples"
      aria-label={`Test and sample preview scenarios for ${locationName}`}
      data-preview-only="true"
    >
      <div className="preview-samples__banner" role="note">
        <span className="preview-samples__pill">
          <Icon name="alert" size={14} />
          <span>TEST / SAMPLE CONTENT</span>
        </span>
        <p className="preview-samples__notice">
          Preview-only sample scenarios for {locationName}. Shown exclusively on local and preview builds — automatically omitted in production and
          never presented as past client work.
        </p>
      </div>

      <div className="preview-samples__grid">
        {scenarios.map((s) => (
          <article key={s.id} className="preview-samples__card">
            <div className="preview-samples__head">
              <span className="preview-samples__tag">{s.label}</span>
              <span className="preview-samples__sector">{s.sector}</span>
            </div>
            <h3 className="card-title">{s.title}</h3>
            <p className="preview-samples__text">
              <strong>Sample need:</strong> {s.problem}
            </p>
            <p className="preview-samples__text">
              <strong>Illustrative studio approach:</strong> {s.proposedApproach}
            </p>
            <div className="preview-samples__foot">
              <Link className="text-link" href={s.serviceHref}>
                Related service: {s.serviceLabel} <span aria-hidden="true">→</span>
              </Link>
              <p className="fine-print">{s.disclaimer}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SERVICES } from "@/lib/services";
import { BUSINESS_PILLARS } from "@/lib/seo/service-areas";

/**
 * Deep-link each pillar to its most detailed destination: the dedicated service
 * hub page when one exists, the Studio Network for partner-delivered work, and
 * the services overview anchor as a final fallback. One source of truth, so the
 * card and the destination never drift.
 */
function serviceHref(id: string): string {
  const pillar = BUSINESS_PILLARS.find((p) => p.pillarId === id);
  if (pillar?.hubSlugs[0]) return `/services/${pillar.hubSlugs[0]}`;
  if (id === "specialist-collaboration") return "/studio-network";
  return `/services#${id}`;
}

/**
 * The six services as an editorial card grid.
 *
 * Each card carries the benefit line rather than the capability list; the
 * full detail lives on /services, which each card links into by anchor.
 * Partner-delivered services keep their label here, as everywhere else.
 */
export function ServiceShowcaseHome() {
  return (
    <section className="section" aria-labelledby="home-services-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Studio approach &amp; services</p>
            <h2 className="section-title" id="home-services-title">
              Agency polish, independent execution
            </h2>
          </div>
          <p className="section-sub section-sub--inline">
            Six ways to work together, with one direct point of contact across creative, technical and commercial work. I shape and deliver the core work myself, bringing in independent specialists only when a project needs extra depth or capacity.
          </p>
        </div>

        <ul className="svc-grid">
          {SERVICES.map((s, i) => (
            <li key={s.id} className="svc-card reveal">
              <Link href={serviceHref(s.id)} className="svc-card__link">
                <span className="svc-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={s.icon} size={26} className="svc-card__icon" />
                <span className="svc-card__title">{s.shortTitle}</span>
                <span className="svc-card__text">{s.positioning}</span>
                {s.partnerDelivered ? <span className="svc-card__flag">With partners</span> : null}
                <span className="svc-card__go" aria-hidden="true">
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

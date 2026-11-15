import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SERVICES } from "@/lib/services";

/**
 * The six services as an editorial card grid.
 *
 * Each card carries the benefit line rather than the capability list — the
 * full detail lives on /services, which each card links into by anchor.
 * Partner-delivered services keep their label here, as everywhere else.
 */
export function ServiceShowcaseHome() {
  return (
    <section className="section" aria-labelledby="home-services-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">What I do</p>
            <h2 className="section-title" id="home-services-title">
              Six ways to work together
            </h2>
          </div>
          <p className="section-sub section-sub--inline">
            One point of contact across creative, technical and commercial work — so nothing is lost in the hand-off between them.
          </p>
        </div>

        <ul className="svc-grid">
          {SERVICES.map((s, i) => (
            <li key={s.id} className="svc-card reveal">
              <Link href={`/services#${s.id}`} className="svc-card__link">
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

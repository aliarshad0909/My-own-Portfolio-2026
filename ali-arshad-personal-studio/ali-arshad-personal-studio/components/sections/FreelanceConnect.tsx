import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FREELANCE, activeSocials } from "@/lib/site";

export function FreelanceConnect() {
  const socials = activeSocials();
  const fiverrUrl = FREELANCE.fiverr.url;

  return (
    <section className="section section--surface" aria-labelledby="freelance-connect-title">
      <div className="container">
        <div className="connect-band reveal">
          <div className="connect-band__copy">
            <p className="eyebrow eyebrow--plain">Freelance &amp; social</p>
            <h2 className="section-title section-title--sm" id="freelance-connect-title">
              Looking for a reliable creative and technical partner?
            </h2>
            <p className="section-sub">
              Engage directly with the studio, hire via Upwork for milestone-based work, or try our free planning calculators to scope your next move.
            </p>

            <div className="connect-band__actions">
              <a
                href={FREELANCE.upwork.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary btn--sm"
                aria-label="Hire Me on Upwork (opens in a new tab)"
              >
                <span>{FREELANCE.upwork.ctaLabel}</span>
                <Icon name="arrow-up-right" size={16} className="btn__icon" />
              </a>

              {fiverrUrl ? (
                <a
                  href={fiverrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--sm"
                  aria-label="Find Me on Fiverr (opens in a new tab)"
                >
                  <span>{FREELANCE.fiverr.ctaLabel}</span>
                  <Icon name="arrow-up-right" size={16} className="btn__icon" />
                </a>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm btn--inactive"
                  disabled
                  aria-disabled="true"
                  title="Fiverr profile link will be enabled once configured"
                >
                  <span>Find Me on Fiverr</span>
                  <span className="connect-band__soon">Soon</span>
                </button>
              )}

              <Link href="/work" className="btn btn--ghost btn--sm connect-band__ghost">
                <span>View Portfolio</span>
                <Icon name="arrow-right" size={16} className="btn__icon" />
              </Link>
            </div>
          </div>

          <div className="connect-band__aside">
            <div className="connect-band__card">
              <p className="label">Follow &amp; connect</p>
              <ul className="connect-socials" aria-label="Social profiles">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="connect-social"
                      aria-label={`${s.label} (opens in a new tab)`}
                    >
                      <Icon name={s.icon} size={18} />
                      <span>{s.label}</span>
                      <Icon name="arrow-up-right" size={14} className="connect-social__arrow" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/tools" className="connect-tools-card">
              <span className="connect-tools-card__icon" aria-hidden="true">
                <Icon name="calculator" size={20} />
              </span>
              <span className="connect-tools-card__text">
                <strong>Calculator Centre</strong>
                <small>Shipping, landed cost, currency, automation ROI &amp; project estimator</small>
              </span>
              <Icon name="arrow-right" size={16} className="connect-tools-card__arrow" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { FREELANCE, activeSocials } from "@/lib/site";

export function FreelanceConnect() {
  const socials = activeSocials();
  const fiverrUrl = FREELANCE.fiverr.url;

  return (
    <section className="section section--surface" aria-labelledby="freelance-connect-title">
      <div className="container">
        <div className="connect-band reveal">
          <div className="connect-band__copy">
            <p className="eyebrow eyebrow--plain">Direct or milestone engagement</p>
            <h2 className="section-title section-title--sm" id="freelance-connect-title">
              Work directly with the studio — or start on Upwork
            </h2>
            <p className="section-sub">
              Start a direct conversation through the inquiry form, hire via Upwork for milestone-based billing, or use the free calculators to rough
              out scope and ROI before we talk.
            </p>

            <div className="connect-band__actions">
              <TrackedLink
                href="/contact"
                event="cta_click"
                props={{ placement: "connect-band", label: "Start a Project" }}
                className="btn btn--primary btn--sm"
              >
                <span>Start a Project</span>
                <Icon name="arrow-right" size={16} className="btn__icon" />
              </TrackedLink>

              <TrackedLink
                href={FREELANCE.upwork.url}
                external
                event="cta_click"
                props={{ placement: "connect-band", label: "Upwork" }}
                className="btn btn--secondary btn--sm"
                ariaLabel="Hire Me on Upwork (opens in a new tab)"
              >
                <span>{FREELANCE.upwork.ctaLabel}</span>
                <Icon name="arrow-up-right" size={16} className="btn__icon" />
              </TrackedLink>

              {fiverrUrl ? (
                <TrackedLink
                  href={fiverrUrl}
                  external
                  event="cta_click"
                  props={{ placement: "connect-band", label: "Fiverr" }}
                  className="btn btn--secondary btn--sm"
                  ariaLabel="Find Me on Fiverr (opens in a new tab)"
                >
                  <span>{FREELANCE.fiverr.ctaLabel}</span>
                  <Icon name="arrow-up-right" size={16} className="btn__icon" />
                </TrackedLink>
              ) : null}
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
                <strong>Business Calculators</strong>
                <small>Project estimator, automation ROI, landed cost &amp; shipping tools</small>
              </span>
              <Icon name="arrow-right" size={16} className="connect-tools-card__arrow" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

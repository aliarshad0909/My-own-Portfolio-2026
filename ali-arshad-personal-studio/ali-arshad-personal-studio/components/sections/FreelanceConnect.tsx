import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { FREELANCE, activeSocials } from "@/lib/site";

/**
 * Homepage high-contrast conversion centerpiece featuring the restored
 * sculpted 3D "A" studio mark alongside direct inquiry, Upwork milestone
 * engagement, free calculators, and verified studio profiles.
 */
export function FreelanceConnect() {
  const socials = activeSocials();
  const fiverrUrl = FREELANCE.fiverr.url;

  return (
    <section className="section section--luminous" aria-labelledby="freelance-connect-title">
      <div className="container">
        <div className="connect-showcase reveal">
          <div className="connect-showcase__grid">
            <div className="connect-showcase__copy">
              <p className="eyebrow">Direct or milestone engagement · Start a conversation</p>
              <h2 className="section-title" id="freelance-connect-title">
                Ready to build something <span className="accent">concrete and shippable</span>?
              </h2>
              <p className="section-sub">
                Tell me what you are building, automating, or refining. You get a direct, plain-language reply from Ali on technical fit, realistic
                scope, and practical next steps — no sales layers and no agency retainers.
              </p>

              <div className="connect-band__actions">
                <TrackedLink
                  href="/contact"
                  event="cta_click"
                  props={{ placement: "connect-band", label: "Discuss Your Project" }}
                  className="btn btn--primary btn--md"
                >
                  <Icon name="send" size={17} />
                  <span>Start a Project</span>
                </TrackedLink>

                <TrackedLink
                  href={FREELANCE.upwork.url}
                  external
                  event="cta_click"
                  props={{ placement: "connect-band", label: "Upwork" }}
                  className="btn btn--secondary btn--md"
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
                    className="btn btn--secondary btn--md"
                    ariaLabel="Find Me on Fiverr (opens in a new tab)"
                  >
                    <span>{FREELANCE.fiverr.ctaLabel}</span>
                    <Icon name="arrow-up-right" size={16} className="btn__icon" />
                  </TrackedLink>
                ) : null}
              </div>

              <div className="connect-showcase__meta">
                <ul className="connect-socials connect-socials--inline" aria-label="Social profiles">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="connect-social"
                        aria-label={`${s.label} (opens in a new tab)`}
                      >
                        <Icon name={s.icon} size={17} />
                        <span>{s.label}</span>
                        <Icon name="arrow-up-right" size={13} className="connect-social__arrow" />
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="connect-showcase__quicklinks">
                  <Link href="/tools" className="connect-tools-card">
                    <span className="connect-tools-card__icon" aria-hidden="true">
                      <Icon name="calculator" size={19} />
                    </span>
                    <span className="connect-tools-card__text">
                      <strong>10 Business Calculators</strong>
                      <small>Web scope, automation ROI, landed cost &amp; margin</small>
                    </span>
                    <Icon name="arrow-right" size={15} className="connect-tools-card__arrow" />
                  </Link>
                  <Link href="/games" className="connect-tools-card">
                    <span className="connect-tools-card__icon" aria-hidden="true">
                      <Icon name="play" size={19} />
                    </span>
                    <span className="connect-tools-card__text">
                      <strong>20 Playable Browser Games</strong>
                      <small>Original interactive studio experiments</small>
                    </span>
                    <Icon name="arrow-right" size={15} className="connect-tools-card__arrow" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="connect-showcase__stage">
              <SignatureMark3D variant="cta" />
              <div className="connect-showcase__caption">
                <span className="connect-showcase__pill">Remote · US &amp; International</span>
                <span className="connect-showcase__pill">Written Scope First</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

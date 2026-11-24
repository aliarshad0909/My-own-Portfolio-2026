import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { FREELANCE, activeSocials } from "@/lib/site";

/**
 * Homepage full-width warm coral/copper/dark conversion section featuring the
 * sculpted 3D "A" mark floating directly in open visual space on the right,
 * paired with direct inquiry, Upwork milestone engagement, free calculators,
 * playable games, and verified studio profiles on the left.
 */
export function FreelanceConnect() {
  const socials = activeSocials();
  const fiverrUrl = FREELANCE.fiverr.url;

  return (
    <section className="cta-band cta-band--home" id="contact-section" aria-labelledby="freelance-connect-title">
      <div className="cta-band__texture" aria-hidden="true" />
      <div className="container cta-band__container">
        <div className="cta-band__grid cta-band__grid--signature">
          <div className="cta-band__copy reveal">
            <p className="eyebrow cta-band__eyebrow">Direct or milestone engagement · Start a conversation</p>
            <h2 className="cta-band__title" id="freelance-connect-title">
              Ready to build something <span className="cta-band__accent">concrete and shippable</span>?
            </h2>
            <p className="cta-band__text">
              Tell me what you are building, automating, or refining. You get a direct, plain-language reply from Ali on technical fit, realistic
              scope, and practical next steps — no sales layers and no agency retainers.
            </p>

            <div className="cta-band__actions">
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

            <div className="cta-band__meta">
              <ul className="connect-socials connect-socials--inline" aria-label="Social profiles">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="connect-social cta-band__social"
                      aria-label={`${s.label} (opens in a new tab)`}
                    >
                      <Icon name={s.icon} size={17} />
                      <span>{s.label}</span>
                      <Icon name="arrow-up-right" size={13} className="connect-social__arrow" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="cta-band__quicklinks">
                <Link href="/tools" className="connect-tools-card cta-band__quicklink">
                  <span className="connect-tools-card__icon" aria-hidden="true">
                    <Icon name="calculator" size={19} />
                  </span>
                  <span className="connect-tools-card__text">
                    <strong>10 Business Calculators</strong>
                    <small>Web scope, automation ROI, landed cost &amp; margin</small>
                  </span>
                  <Icon name="arrow-right" size={15} className="connect-tools-card__arrow" />
                </Link>
                <Link href="/games" className="connect-tools-card cta-band__quicklink">
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

          <div className="cta-band__visual">
            <SignatureMark3D variant="cta" />
          </div>
        </div>
      </div>
    </section>
  );
}

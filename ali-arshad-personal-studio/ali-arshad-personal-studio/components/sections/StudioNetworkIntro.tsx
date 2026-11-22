import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Concise, accurate homepage introduction to the Studio Network.
 * Distinguishes Ali's direct solo execution from independent collaborators
 * without implying a US office, employees, or a staffed agency.
 */
export function StudioNetworkIntro() {
  return (
    <section className="section section--tight" aria-labelledby="home-network-title">
      <div className="container">
        <div className="network-intro reveal">
          <div className="network-intro__copy">
            <p className="eyebrow eyebrow--plain">Studio Network</p>
            <h2 className="section-title section-title--sm" id="home-network-title">
              A solo studio first — with independent specialists when scope calls for it
            </h2>
            <p className="section-sub">
              Most work is designed and engineered directly by me. For US-focused engagements that need extra capacity or specialist skills such as
              security reviews, mobile engineering, or specialized production, I collaborate transparently with vetted independent contractors under
              one point of contact.
            </p>
          </div>

          <div className="network-intro__actions">
            <Link href="/studio-network" className="btn btn--secondary btn--sm">
              <span>How the Studio Network Works</span>
              <Icon name="arrow-right" size={16} className="btn__icon" />
            </Link>
            <Link href="/studio-network#join-network" className="btn btn--ghost btn--sm">
              <span>Register as a Collaborator</span>
              <Icon name="arrow-up-right" size={15} className="btn__icon" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

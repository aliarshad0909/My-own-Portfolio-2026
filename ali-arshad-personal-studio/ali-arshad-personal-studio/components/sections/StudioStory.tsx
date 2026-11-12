import Image from "next/image";
import { ArrowLink } from "@/components/ui/Button";
import { ContactCTA } from "@/components/sections/ContactCTA";

/** "About the Studio" panel paired with the contact CTA, as in the approved homepage. */
export function StudioStory() {
  return (
    <section className="section section--tight" aria-labelledby="studio-title">
      <div className="container studio-row">
        <div className="panel studio reveal">
          <div className="studio__media">
            <Image
              src="/images/studio/studio-workspace.webp"
              alt="A warm, dimly lit desk with a monitor, desk lamp and plants"
              fill
              sizes="(min-width: 1024px) 260px, 100vw"
              className="studio__image"
            />
          </div>
          <div className="studio__copy">
            <p className="eyebrow eyebrow--plain">The Studio</p>
            <h2 className="section-title section-title--sm" id="studio-title">
              A One-Person Studio with Agency-Level Reach
            </h2>
            <p>
              I&rsquo;m Ali Arshad, a multidisciplinary creative and technical professional with a background in business and supply chain management. I combine design, development, automation, and commercial thinking to deliver focused solutions. For specialized requirements, I collaborate with trusted technical professionals.
            </p>
            <ArrowLink href="/about">More About Me</ArrowLink>
          </div>
        </div>
        <ContactCTA />
      </div>
    </section>
  );
}

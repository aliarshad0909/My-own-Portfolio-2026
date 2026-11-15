import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

const STRANDS: { icon: IconName; label: string }[] = [
  { icon: "briefcase", label: "Business administration" },
  { icon: "globe", label: "Supply chain management" },
  { icon: "trending", label: "Brand management" },
  { icon: "clapperboard", label: "Creative production" },
  { icon: "code", label: "Web & software development" },
  { icon: "bot", label: "Intelligent automation" },
];

/** Short personal introduction, with the portrait already in the repository. */
export function StudioStory() {
  return (
    <section className="section" aria-labelledby="studio-title">
      <div className="container intro">
        <div className="intro__media reveal">
          <Image
            src="/images/portraits/portrait-about.webp"
            alt="Portrait of Ali Arshad wearing a black leather jacket"
            width={1157}
            height={1360}
            sizes="(min-width: 1024px) 420px, 80vw"
            className="intro__portrait"
          />
        </div>

        <div className="intro__copy reveal">
          <p className="eyebrow eyebrow--plain">Who I am</p>
          <h2 className="section-title" id="studio-title">
            Business-minded. Creatively driven. Technically equipped.
          </h2>
          <p>
            I&rsquo;m Ali Arshad. I started in business — a BBA in Supply Chain Management — and moved outward from there into brand management, creative
            production, software development and automation. Each discipline arrived because the one before it needed it.
          </p>
          <p>
            That range is the point. A sourcing problem and a slow checkout are the same problem seen from two ends, and having both perspectives in the
            same head is what removes the hand-offs where projects usually lose their shape.
          </p>

          <ul className="intro__strands" aria-label="Background">
            {STRANDS.map((s) => (
              <li key={s.label}>
                <Icon name={s.icon} size={16} />
                <span>{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="intro__actions">
            <ButtonLink href="/about" variant="secondary" icon={null}>
              About me
            </ButtonLink>
            <ButtonLink href="/experience" variant="secondary" icon={null}>
              My experience
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

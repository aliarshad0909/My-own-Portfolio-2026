import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Testimonials } from "@/components/sections/Testimonials";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { getKeyword } from "@/lib/seo/keyword-registry";
import { isIndexable, shouldRender } from "@/lib/seo/publication";

const state = getKeyword("net-studio-network")?.state ?? "Researched";

export const metadata: Metadata = pageMetadata({
  title: "The Studio Network: Partner-Delivered Work, Coordinated",
  description:
    "How an independent studio of one takes on work that needs more than one specialism: a vetted network of collaborators, coordinated under a single point of contact.",
  path: "/studio-network",
  index: isIndexable(state),
});

const PRINCIPLES = [
  {
    icon: "users" as const,
    title: "One point of contact",
    text: "You deal directly with me. I coordinate any specialist collaborators so you are never handed off to strangers mid-project.",
  },
  {
    icon: "check" as const,
    title: "Honest attribution",
    text: "When a partner delivers a specialist module, I state it plainly upfront. Partner work is never presented as my solo output.",
  },
  {
    icon: "alert" as const,
    title: "Named only with consent",
    text: "Collaborators are introduced when a project needs them and named publicly only with permission — zero implied partnerships or fake logos.",
  },
  {
    icon: "code" as const,
    title: "The right specialist, not guesswork",
    text: "Blockchain engineering, deep security reviews or heavy infrastructure: when work sits outside my core craft, qualified specialists handle it.",
  },
];

export default function StudioNetworkPage() {
  if (!shouldRender(state)) notFound();
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Studio Network", path: "/studio-network" },
        ]}
      />
      <PageHero
        eyebrow="How collaboration works"
        title="A studio of one, with a specialist network behind it"
        lead="Most projects are designed and engineered directly by me. When a build genuinely needs deep outside expertise, the Studio Network keeps delivery transparent under one accountable point of contact."
      />

      <section className="section section--tight" aria-labelledby="network-principles">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Operating principles</p>
            <h2 className="section-title section-title--sm" id="network-principles">
              No pretending a solo studio is a 30-person agency
            </h2>
            <p className="section-sub">
              Every partner involvement is agreed in writing before work starts, so you always know who is building what and why.
            </p>
          </div>
          <ul className="hub-deliverables">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="hub-deliverable">
                <div className="hub-deliverable__head">
                  <span className="hub-deliverable__icon" aria-hidden="true">
                    <Icon name={p.icon} size={18} />
                  </span>
                  <h3 className="hub-deliverable__title">{p.title}</h3>
                </div>
                <p className="hub-deliverable__detail">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials title="What partners and clients say" />

      <ContactCTA
        standalone
        eyebrow="Multi-discipline scope"
        title="Planning a project that needs more than one specialism?"
        text="Tell me the full scope. If part of it is better handled with a vetted partner, I will say so openly and coordinate delivery cleanly."
        button="Discuss your scope"
        href={`/contact?service=${encodeURIComponent("Specialist Technical Collaboration")}`}
      />
    </>
  );
}

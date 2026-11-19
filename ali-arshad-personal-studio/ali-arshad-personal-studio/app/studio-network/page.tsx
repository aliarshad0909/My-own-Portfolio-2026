import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Testimonials } from "@/components/sections/Testimonials";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema } from "@/lib/structured-data";
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
    title: "One point of contact",
    text: "You deal with me. I coordinate the specialists; you are never handed off to a stranger mid-project.",
  },
  {
    title: "Honest attribution",
    text: "When a partner does the work, I say so. Their work is never presented as mine.",
  },
  {
    title: "Named only with consent",
    text: "Collaborators are introduced when a project needs them and only named publicly with their agreement. No logos are displayed to imply relationships that are not real.",
  },
  {
    title: "The right specialism, not the nearest",
    text: "Blockchain, advanced security, large-scale infrastructure: for work outside my own depth I bring in someone qualified rather than improvising.",
  },
];

export default function StudioNetworkPage() {
  if (!shouldRender(state)) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Studio Network", path: "/studio-network" },
        ])}
      />
      <PageHero
        eyebrow="How it works"
        title="A studio of one, with a network behind it"
        lead="Some projects need more than one pair of hands or one specialism. The Studio Network is how that is handled honestly: coordinated partners, a single point of contact, and no pretending a solo studio is an agency."
      />

      <section className="container section">
        <p className="measure">
          Most projects are delivered directly. When one needs expertise beyond
          mine, I bring in a vetted collaborator rather than stretch past what I
          can genuinely do well. The arrangement is simple and stated upfront, so
          you always know who is doing what.
        </p>
      </section>

      <section className="container section--tight">
        <h2 className="section-title">The principles</h2>
        <ul className="hub-list">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <Icon name="check" size={18} />
              <span>
                <strong>{p.title}.</strong> {p.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Testimonials title="What partners and clients say" />

      <ContactCTA
        title="A project that needs more than one specialism?"
        text="Tell me the whole scope. If part of it is better delivered by a partner, I'll say so and coordinate it."
      />
    </>
  );
}

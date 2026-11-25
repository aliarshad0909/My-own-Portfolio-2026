import type { Metadata } from "next";
import Link from "next/link";
import { GamesBrowser } from "@/components/games/GamesBrowser";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { STUDIO_GAMES } from "@/lib/games/catalog";
import { pageMetadata } from "@/lib/seo";
import { gameListSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Games & Interactive Experiments: 20 Playable Browser Puzzles",
  description:
    "Twenty original, lightweight browser mini-games built directly in TypeScript and React across line/path puzzles, grid logic, memory, word/number challenges, arcade drills, and WCAG color games.",
  path: "/games",
});

export default function GamesIndexPage() {
  return (
    <>
      <JsonLd data={gameListSchema(STUDIO_GAMES)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Games & Experiments", path: "/games" },
        ]}
      />

      <PageHero
        eyebrow="Interactive Lab · 20 Original Portfolio Experiments"
        title={
          <>
            Playable browser <span className="accent">mini-games</span>
          </>
        }
        lead="Twenty original, lightweight games programmed from scratch in TypeScript and React across six genres — pathfinding, grid deduction, memory, word/number puzzles, reaction drills, and WCAG color calibration. Kept cleanly separate from commercial services and client work."
      >
        <div className="hero__actions">
          <ButtonLink href="/games/signal-link">Play Signal Link</ButtonLink>
          <ButtonLink href="/games/contrast-judge" variant="secondary" icon={null}>
            Try WCAG Contrast Judge
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Experiment disclosure">
        <p className="notice notice--wide">
          <Icon name="lightbulb" size={18} />
          <span>
            <strong>Original portfolio experiments:</strong> All 20 games on this page are genuinely playable original experiments authored inside
            this repository with zero copied artwork or external game engines. None are client projects or paid commercial engagements.
          </span>
        </p>
      </section>

      <section className="section" aria-labelledby="games-grid-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Filter across 6 genres</p>
            <h2 className="section-title" id="games-grid-title">
              Twenty lightweight games — lazy-loaded, keyboard &amp; touch ready
            </h2>
            <p className="section-sub">
              Every game runs 100% locally in your browser with accessible labels, keyboard support, clear restart/completion states, and reduced-motion safeguards.
            </p>
          </div>

          <GamesBrowser games={STUDIO_GAMES} />
        </div>
      </section>

      <section className="section section--surface section--tight" aria-labelledby="games-explore-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Looking for client services or business software?</p>
            <h2 className="section-title section-title--sm" id="games-explore-title">
              Explore the commercial side of the studio
            </h2>
          </div>
          <ul className="hub-card-grid">
            <li>
              <Link href="/services" className="hub-link-card">
                <span className="hub-link-card__kind">Services</span>
                <span className="hub-link-card__title">
                  <span>All 6 studio services &amp; 26 niches</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Web engineering, n8n workflow automation, AI agents, dashboards, branding, and creative production.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/work" className="hub-link-card">
                <span className="hub-link-card__kind">Portfolio</span>
                <span className="hub-link-card__title">
                  <span>Curated Portfolio across 7 Collections</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Inspect live PostgreSQL SaaS sandboxes, locally tested prototypes, and labeled architecture concepts.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/blog/building-20-browser-games-typescript" className="hub-link-card">
                <span className="hub-link-card__kind">Build log</span>
                <span className="hub-link-card__title">
                  <span>Read the 20-game engineering build log</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  How we architected pure TypeScript game engines, GF(2) hint solvers, and WCAG accessibility.
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Interactive UI & full-stack engineering"
        title="Need custom interactive tools, configurators, or web software?"
        text="The same TypeScript state-machine and accessibility rigor behind these browser experiments powers production client apps and SaaS platforms."
        button="Discuss a web build"
        href="/contact?service=Web%20%26%20Software%20Development"
      />
    </>
  );
}

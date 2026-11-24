import type { Metadata } from "next";
import Link from "next/link";
import { GameCoverArt } from "@/components/games/GameCoverArt";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { STUDIO_GAMES } from "@/lib/games/catalog";
import { pageMetadata } from "@/lib/seo";
import { gameListSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Games & Interactive Experiments: Playable Browser Puzzles",
  description:
    "Three original, lightweight browser mini-games built directly in the studio: Signal Link (line-matching circuit puzzle), Pulse Grid (grid parity logic), and Studio Pairs (geometric memory matching).",
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
        eyebrow="Interactive Lab · Original Portfolio Experiments"
        title={
          <>
            Playable browser <span className="accent">mini-games</span>
          </>
        }
        lead="Small, original interactive puzzles built directly in TypeScript and React to explore state machines, grid logic, keyboard accessibility, and responsive pointer interactions — kept cleanly separate from commercial services and client work."
      >
        <div className="hero__actions">
          <ButtonLink href={`/games/${STUDIO_GAMES[0].slug}`}>Play {STUDIO_GAMES[0].title}</ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            View commercial demonstrations
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Experiment disclosure">
        <p className="notice notice--wide">
          <Icon name="lightbulb" size={18} />
          <span>
            <strong>Original portfolio experiments:</strong> Every game on this page was designed and programmed from scratch for this studio
            portfolio. These are self-initiated interactive UI experiments — not paid client projects or commercial software offers.
          </span>
        </p>
      </section>

      <section className="section" aria-labelledby="games-grid-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Playable in the browser</p>
            <h2 className="section-title" id="games-grid-title">
              Three lightweight puzzles — zero downloads, keyboard &amp; touch ready
            </h2>
            <p className="section-sub">
              Each game runs locally in your browser with zero external assets, full keyboard focus navigation, and reduced-motion support.
            </p>
          </div>

          <ul className="game-grid">
            {STUDIO_GAMES.map((game) => (
              <li key={game.slug} className="game-card panel">
                <Link href={`/games/${game.slug}`} className="game-card__media" aria-label={`Open ${game.title}`}>
                  <GameCoverArt slug={game.slug} />
                </Link>
                <div className="game-card__body">
                  <div className="game-card__badges">
                    <span className="badge badge--concept">{game.experimentLabel}</span>
                    <span className="badge">{game.category}</span>
                  </div>
                  <h3 className="card-title">
                    <Link href={`/games/${game.slug}`}>{game.title}</Link>
                  </h3>
                  <p className="game-card__summary">{game.summary}</p>
                  <ul className="game-card__meta" aria-label={`${game.title} highlights`}>
                    {game.difficultyModes.map((mode) => (
                      <li key={mode}>{mode}</li>
                    ))}
                  </ul>
                  <div className="game-card__footer">
                    <span className="fine-print">Typical session: {game.estimatedTime}</span>
                    <Link href={`/games/${game.slug}`} className="btn btn--primary btn--sm">
                      <Icon name="play" size={15} />
                      <span>Play {game.title}</span>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
                  <span>Project Finder (14 studio demonstrations)</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Inspect live PostgreSQL SaaS sandboxes, AI agent builds, and documented architecture case studies.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/tools" className="hub-link-card">
                <span className="hub-link-card__kind">Free utilities</span>
                <span className="hub-link-card__title">
                  <span>Calculator Centre (10 business tools)</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Estimate web project scope, automation ROI, landed cost, reorder points, and profit margins.
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

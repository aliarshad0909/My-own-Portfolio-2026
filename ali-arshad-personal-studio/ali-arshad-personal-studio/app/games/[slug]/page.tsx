import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameLauncher } from "@/components/games/GameLauncher";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { STUDIO_GAMES, allGameSlugs, getGame } from "@/lib/games/catalog";
import { pageMetadata } from "@/lib/seo";
import { gameSchema } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return allGameSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};
  return pageMetadata({
    title: `${game.title} — ${game.category} | Interactive Experiment`,
    description: `${game.summary} Original playable browser experiment by Ali Arshad.`,
    path: `/games/${game.slug}`,
  });
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const idx = STUDIO_GAMES.findIndex((g) => g.slug === game.slug);
  const prevGame = STUDIO_GAMES[(idx - 1 + STUDIO_GAMES.length) % STUDIO_GAMES.length];
  const nextGame = STUDIO_GAMES[(idx + 1) % STUDIO_GAMES.length];
  const sameCategory = STUDIO_GAMES.filter((g) => g.slug !== game.slug && g.category === game.category);
  const crossCategory = STUDIO_GAMES.filter((g) => g.slug !== game.slug && g.category !== game.category);
  const relatedGames = [...sameCategory, ...crossCategory].slice(0, 5);

  return (
    <>
      <JsonLd data={gameSchema(game)} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Games & Experiments", path: "/games" },
          { name: game.title, path: `/games/${game.slug}` },
        ]}
      />

      <PageHero
        eyebrow={`${game.experimentLabel} · ${game.category}`}
        title={game.title}
        lead={game.tagline}
      >
        <div className="game-detail__badges">
          <span className="badge badge--concept">{game.experimentLabel}</span>
          <span className="badge">{game.category}</span>
          <span className="badge">Browser playable · {game.estimatedTime}</span>
        </div>
        <div className="hero__actions" style={{ marginTop: "16px" }}>
          <ButtonLink href={`/work/game-${game.slug}`} variant="secondary" icon={null}>
            Read build story &amp; engineering notes
          </ButtonLink>
          <ButtonLink href="/work?collection=games-experiments" variant="secondary" icon={null}>
            Games collection in Work
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--tight" aria-labelledby="play-area-title">
        <div className="container">
            <h2 className="visually-hidden" id="play-area-title">
              Play {game.title}
            </h2>
            <GameLauncher slug={game.slug} />
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="how-to-play-title">
        <div className="container game-guide-grid">
          <div className="panel">
            <p className="eyebrow eyebrow--plain">How to play</p>
            <h2 className="section-title section-title--sm" id="how-to-play-title">
              Objective &amp; rules
            </h2>
            <p className="measure" style={{ marginTop: "10px" }}>
              {game.objective}
            </p>
            <ol className="game-steps">
              {game.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="panel">
            <p className="eyebrow eyebrow--plain">Controls &amp; engineering</p>
            <h2 className="section-title section-title--sm">Input, accessibility &amp; mechanics</h2>
            <dl className="game-controls-dl">
              <div>
                <dt>Mouse / Touch</dt>
                <dd>{game.controls.pointer}</dd>
              </div>
              <div>
                <dt>Keyboard</dt>
                <dd>{game.controls.keyboard}</dd>
              </div>
              <div>
                <dt>Reduced motion</dt>
                <dd>
                  Respects <code>prefers-reduced-motion: reduce</code> with instant state transitions and zero continuous animation.
                </dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>
                  Original self-initiated portfolio experiment built in TypeScript &amp; React — not client work.
                </dd>
              </div>
            </dl>
            <ul className="game-card__meta" style={{ marginTop: "16px" }} aria-label="Game mechanics">
              {game.mechanics.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <nav className="case-nav" aria-label="Game navigation">
        <div className="container case-nav__inner">
          <Link href={`/games/${prevGame.slug}`} className="case-nav__link case-nav__link--prev">
            <span className="case-nav__label">
              <Icon name="arrow-right" size={15} className="flip" />
              Previous game
            </span>
            <span className="case-nav__title">{prevGame.title}</span>
          </Link>
          <Link href="/games" className="case-nav__all">
            All {STUDIO_GAMES.length} games
          </Link>
          <Link href={`/games/${nextGame.slug}`} className="case-nav__link case-nav__link--next">
            <span className="case-nav__label">
              Next game
              <Icon name="arrow-right" size={15} />
            </span>
            <span className="case-nav__title">{nextGame.title}</span>
          </Link>
        </div>
      </nav>

      <section className="section section--tight" aria-labelledby="more-games-title">
        <div className="container">
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow eyebrow--plain">More interactive experiments</p>
              <h2 className="section-title section-title--sm" id="more-games-title">
                Try another browser puzzle
              </h2>
            </div>
            <ButtonLink href="/games" variant="secondary" icon={null}>
              All {STUDIO_GAMES.length} games &amp; experiments
            </ButtonLink>
          </div>

          <ul className="hub-card-grid">
            {relatedGames.map((other) => (
              <li key={other.slug}>
                <Link href={`/games/${other.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    {other.category} · {other.estimatedTime}
                  </span>
                  <span className="hub-link-card__title">
                    <span>{other.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{other.tagline}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/work" className="hub-link-card">
                <span className="hub-link-card__kind">Commercial portfolio</span>
                <span className="hub-link-card__title">
                  <span>Explore 7 curated Work collections</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Inspect live PostgreSQL SaaS sandboxes, locally tested monorepo apps, AI agents, and n8n workflows.
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

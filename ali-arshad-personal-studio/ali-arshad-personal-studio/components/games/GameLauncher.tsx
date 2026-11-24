"use client";

import dynamic from "next/dynamic";
import type { GameSlug } from "@/lib/games/catalog";

const LoadingBoard = () => (
  <div className="game-stage panel game-stage--loading" role="status" aria-live="polite">
    <p className="muted">Loading interactive game board…</p>
  </div>
);

const SignalLinkGame = dynamic(
  () => import("@/components/games/SignalLinkGame").then((m) => m.SignalLinkGame),
  { loading: LoadingBoard },
);

const PulseGridGame = dynamic(
  () => import("@/components/games/PulseGridGame").then((m) => m.PulseGridGame),
  { loading: LoadingBoard },
);

const StudioPairsGame = dynamic(
  () => import("@/components/games/StudioPairsGame").then((m) => m.StudioPairsGame),
  { loading: LoadingBoard },
);

export function GameLauncher({ slug }: { slug: GameSlug }) {
  if (slug === "signal-link") return <SignalLinkGame />;
  if (slug === "pulse-grid") return <PulseGridGame />;
  return <StudioPairsGame />;
}

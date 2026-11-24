"use client";

import dynamic from "next/dynamic";
import type { GameSlug } from "@/lib/games/catalog";

const LoadingBoard = () => (
  <div className="game-stage panel game-stage--loading" role="status" aria-live="polite">
    <p className="muted">Loading interactive game board…</p>
  </div>
);

const SignalLinkGame = dynamic(() => import("@/components/games/SignalLinkGame").then((m) => m.SignalLinkGame), { loading: LoadingBoard });
const PulseGridGame = dynamic(() => import("@/components/games/PulseGridGame").then((m) => m.PulseGridGame), { loading: LoadingBoard });
const StudioPairsGame = dynamic(() => import("@/components/games/StudioPairsGame").then((m) => m.StudioPairsGame), { loading: LoadingBoard });

const CircuitTurnGame = dynamic(() => import("@/components/games/PathLogicGames").then((m) => m.CircuitTurnGame), { loading: LoadingBoard });
const KnightRelayGame = dynamic(() => import("@/components/games/PathLogicGames").then((m) => m.KnightRelayGame), { loading: LoadingBoard });
const MiniLatticeGame = dynamic(() => import("@/components/games/PathLogicGames").then((m) => m.MiniLatticeGame), { loading: LoadingBoard });
const MosaicCluesGame = dynamic(() => import("@/components/games/PathLogicGames").then((m) => m.MosaicCluesGame), { loading: LoadingBoard });
const HazardSweepGame = dynamic(() => import("@/components/games/PathLogicGames").then((m) => m.HazardSweepGame), { loading: LoadingBoard });

const CipherFiveGame = dynamic(() => import("@/components/games/WordNumberGames").then((m) => m.CipherFiveGame), { loading: LoadingBoard });
const SumShiftGame = dynamic(() => import("@/components/games/WordNumberGames").then((m) => m.SumShiftGame), { loading: LoadingBoard });
const EquationForgeGame = dynamic(() => import("@/components/games/WordNumberGames").then((m) => m.EquationForgeGame), { loading: LoadingBoard });
const TileShiftGame = dynamic(() => import("@/components/games/WordNumberGames").then((m) => m.TileShiftGame), { loading: LoadingBoard });

const EchoPadsGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.EchoPadsGame), { loading: LoadingBoard });
const FlashMatrixGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.FlashMatrixGame), { loading: LoadingBoard });
const ReflexGateGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.ReflexGateGame), { loading: LoadingBoard });
const OrbitCatchGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.OrbitCatchGame), { loading: LoadingBoard });
const TargetBurstGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.TargetBurstGame), { loading: LoadingBoard });
const ChromaMatchGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.ChromaMatchGame), { loading: LoadingBoard });
const ContrastJudgeGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.ContrastJudgeGame), { loading: LoadingBoard });
const SpectrumOrderGame = dynamic(() => import("@/components/games/MemoryArcadeColorGames").then((m) => m.SpectrumOrderGame), { loading: LoadingBoard });

export function GameLauncher({ slug }: { slug: GameSlug }) {
  switch (slug) {
    case "signal-link": return <SignalLinkGame />;
    case "circuit-turn": return <CircuitTurnGame />;
    case "knight-relay": return <KnightRelayGame />;
    case "pulse-grid": return <PulseGridGame />;
    case "glyph-sudoku": return <MiniLatticeGame />;
    case "mosaic-clues": return <MosaicCluesGame />;
    case "mine-sweep-lab": return <HazardSweepGame />;
    case "studio-pairs": return <StudioPairsGame />;
    case "echo-pads": return <EchoPadsGame />;
    case "flash-matrix": return <FlashMatrixGame />;
    case "cipher-five": return <CipherFiveGame />;
    case "sum-shift": return <SumShiftGame />;
    case "equation-forge": return <EquationForgeGame />;
    case "slide-order": return <TileShiftGame />;
    case "reflex-gate": return <ReflexGateGame />;
    case "orbit-catch": return <OrbitCatchGame />;
    case "target-burst": return <TargetBurstGame />;
    case "chroma-match": return <ChromaMatchGame />;
    case "contrast-judge": return <ContrastJudgeGame />;
    case "gradient-sort": return <SpectrumOrderGame />;
  }
}

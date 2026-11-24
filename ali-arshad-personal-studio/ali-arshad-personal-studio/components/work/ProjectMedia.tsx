"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GameCoverArt } from "@/components/games/GameCoverArt";
import { ConceptCoverArt } from "@/components/work/ConceptCoverArt";
import type { Project } from "@/lib/projects";

type Props = { project: Project; sizes: string; priority?: boolean };

/**
 * Card media. Renders:
 *  - original GameCoverArt for playable browser game experiments,
 *  - explicitly badged AI-generated architectural illustrations for featured concepts,
 *  - bespoke ConceptCoverArt schematics for concepts/prototypes without screenshots,
 *  - or real application screenshots (with optional hover preview clip respecting reduced motion).
 */
export function ProjectMedia({ project, sizes, priority = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowMotion(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const card = wrapRef.current?.closest(".project-card");
    if (!card || !project.previewVideo || !allowMotion) return;
    const on = () => setActive(true);
    const off = () => setActive(false);
    card.addEventListener("pointerenter", on);
    card.addEventListener("pointerleave", off);
    card.addEventListener("focusin", on);
    card.addEventListener("focusout", off);
    return () => {
      card.removeEventListener("pointerenter", on);
      card.removeEventListener("pointerleave", off);
      card.removeEventListener("focusin", on);
      card.removeEventListener("focusout", off);
    };
  }, [project.previewVideo, allowMotion]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active]);

  return (
    <div className="project-card__media" ref={wrapRef}>
      {project.gameSlug ? (
        <GameCoverArt slug={project.gameSlug} />
      ) : project.generatedVisual ? (
        <>
          <Image
            src={project.generatedVisual.src}
            alt={project.generatedVisual.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="project-card__image"
          />
          <span className="project-card__art-tag">{project.generatedVisual.label}</span>
        </>
      ) : project.conceptVisual ? (
        <ConceptCoverArt spec={project.conceptVisual} title={project.title} status={project.status} />
      ) : (
        <Image src={project.cover.src} alt={project.cover.alt} fill sizes={sizes} priority={priority} className="project-card__image" />
      )}
      {project.previewVideo && allowMotion && active ? (
        <video ref={ref} className="project-card__video" src={project.previewVideo} muted loop playsInline preload="none" aria-hidden="true" />
      ) : null}
    </div>
  );
}

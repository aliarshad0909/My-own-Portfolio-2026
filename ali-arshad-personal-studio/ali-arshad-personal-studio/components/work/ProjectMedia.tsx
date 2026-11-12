"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

type Props = { project: Project; sizes: string; priority?: boolean };

/**
 * Card media. Shows the cover image; if the project has a preview clip it is
 * only fetched and played on hover/focus, and never when the visitor prefers
 * reduced motion. No video is loaded up front.
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

  // Play on hover or keyboard focus of the surrounding card link.
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
      <Image src={project.cover.src} alt={project.cover.alt} fill sizes={sizes} priority={priority} className="project-card__image" />
      {project.previewVideo && allowMotion && active ? (
        <video ref={ref} className="project-card__video" src={project.previewVideo} muted loop playsInline preload="none" aria-hidden="true" />
      ) : null}
    </div>
  );
}

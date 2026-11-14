"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Still = { src: string; alt: string; width: number; height: number };

type Props = {
  /** The still that is always correct on its own: poster, print, reduced motion, failed autoplay. */
  still: Still;
  /** Optional motion sources, best format first (e.g. WebM then MP4). Omit for a plain still. */
  sources?: { src: string; type: string }[];
  /** Accessible description of what the motion shows, when it adds meaning beyond the still. */
  label?: string;
  className?: string;
  /** Hover-to-play rather than autoplay; sensible for previews in a grid. */
  playOnHover?: boolean;
};

/**
 * A slot for externally produced motion — a short MP4/WebM loop, a rendered
 * turntable, a hero sequence — that is safe to ship before the asset exists.
 *
 *   - With no `sources`, it is just the still.
 *   - With sources, it autoplays muted and looped, as browsers allow.
 *   - Under prefers-reduced-motion the video is never requested; the still shows.
 *   - If autoplay is refused or the file fails, the still shows and the
 *     interface does not change shape, because the still is the poster.
 *
 * Keep clips short (under ~6s), silent, encoded with faststart, and sized to
 * the slot. The motion-production pipeline in demos/ produces exactly that.
 */
export function MotionMedia({ still, sources, label, className, playOnHover = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canMove, setCanMove] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!sources || sources.length === 0) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCanMove(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [sources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canMove || playOnHover) return;
    // play() returns a promise that rejects when autoplay is blocked.
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => setFailed(true));
  }, [canMove, playOnHover]);

  const showVideo = canMove && !failed && sources && sources.length > 0;

  const play = () => {
    const attempt = videoRef.current?.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => setFailed(true));
  };
  const pause = () => videoRef.current?.pause();

  return (
    <div className={`motion-media ${className ?? ""}`.trim()}>
      <Image src={still.src} alt={still.alt} width={still.width} height={still.height} className="motion-media__still" sizes="(min-width: 1024px) 50vw, 100vw" />
      {showVideo ? (
        <video
          ref={videoRef}
          className="motion-media__video"
          muted
          loop
          playsInline
          preload="metadata"
          poster={still.src}
          aria-label={label}
          aria-hidden={label ? undefined : true}
          onError={() => setFailed(true)}
          onMouseEnter={playOnHover ? play : undefined}
          onMouseLeave={playOnHover ? pause : undefined}
          onFocus={playOnHover ? play : undefined}
          onBlur={playOnHover ? pause : undefined}
          tabIndex={playOnHover ? 0 : -1}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : null}
    </div>
  );
}

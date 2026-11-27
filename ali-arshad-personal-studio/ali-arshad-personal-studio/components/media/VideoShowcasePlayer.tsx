"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { ShowcaseVideoItem } from "@/lib/creative-videos";

type Props = {
  videos: ShowcaseVideoItem[];
  notice?: string;
};

/**
 * Lazy-loaded, click-to-play video showcase.
 *
 * Performance & accessibility rules:
 *  - Renders an optimized WebP poster first; zero video bytes are requested
 *    until a visitor clicks Play or presses Enter/Space.
 *  - Never autoplays, honoring `prefers-reduced-motion` and mobile data budgets.
 *  - Includes explicit work-type labels (Studio Motion Demo vs Approved Client Work),
 *    objective, work performed, deliverables, and accessible text summary.
 */
export function VideoShowcasePlayer({ videos, notice }: Props) {
  const [playingIds, setPlayingIds] = useState<Record<string, boolean>>({});

  if (videos.length === 0) return null;

  const activate = (id: string) => {
    setPlayingIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="video-showcase">
      <div className="card-grid card-grid--3 video-showcase__grid">
        {videos.map((v) => {
          const isPlaying = Boolean(playingIds[v.id]);
          return (
            <article key={v.id} className="panel video-card">
              <div className={`video-card__stage video-card__stage--${v.aspectRatio.replace("/", "-")}`}>
                {isPlaying ? (
                  <video
                    className="video-card__video"
                    poster={v.poster}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    aria-label={`${v.title} (${v.workType})`}
                  >
                    {v.webmSrc ? <source src={v.webmSrc} type="video/webm" /> : null}
                    <source src={v.src} type="video/mp4" />
                    Your browser does not support embedded HTML5 video.
                  </video>
                ) : (
                  <button
                    type="button"
                    className="video-card__poster-btn"
                    onClick={() => activate(v.id)}
                    aria-label={`Play ${v.title} (${v.formatMeta})`}
                  >
                    <Image
                      src={v.poster}
                      alt={v.posterAlt}
                      fill
                      sizes="(min-width: 1024px) 380px, 94vw"
                      className="video-card__poster-img"
                    />
                    <span className="video-card__play-pill" aria-hidden="true">
                      <Icon name="play" size={18} />
                      <span>Play preview</span>
                    </span>
                    <span className="video-card__type-badge">{v.workType}</span>
                  </button>
                )}
              </div>

              <div className="video-card__body">
                <p className="eyebrow eyebrow--plain">
                  {v.service} · {v.formatMeta}
                </p>
                <h3 className="card-title">{v.title}</h3>
                <p className="video-card__text">
                  <strong>Objective:</strong> {v.objective}
                </p>
                <p className="video-card__text">
                  <strong>Work performed:</strong> {v.workPerformed}
                </p>
                <ul className="tag-list" aria-label="Deliverables">
                  {v.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <details className="video-card__transcript">
                  <summary>Visual summary / transcript notes</summary>
                  <p>{v.transcriptSummary}</p>
                </details>
              </div>
            </article>
          );
        })}
      </div>

      {notice ? (
        <p className="notice notice--wide" style={{ marginTop: "18px" }}>
          <Icon name="alert" size={18} />
          <span>{notice}</span>
        </p>
      ) : null}
    </div>
  );
}

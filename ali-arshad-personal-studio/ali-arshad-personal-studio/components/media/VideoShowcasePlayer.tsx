"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { ShowcaseVideoItem } from "@/lib/creative-videos";

type FilterKey = "all" | "Authorized Portfolio Edit" | "Studio Motion Demo" | "Short-Form Social" | "Video Editing" | "Motion Graphics";

type Props = {
  videos: ShowcaseVideoItem[];
  notice?: string;
  enableFilters?: boolean;
};

/**
 * Lazy-loaded, click-to-play video showcase.
 *
 * Performance & accessibility rules:
 *  - Renders an optimized WebP poster first; zero video bytes are requested
 *    until a visitor clicks Play or presses Enter/Space.
 *  - Never autoplays on page load, honoring `prefers-reduced-motion` and mobile data budgets.
 *  - Preserves deliverable credits/attribution and attaches WebVTT caption tracks when present.
 */
export function VideoShowcasePlayer({ videos, notice, enableFilters = false }: Props) {
  const [playingIds, setPlayingIds] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filterOptions = useMemo(() => {
    if (!enableFilters || videos.length <= 4) return [];
    const opts: { key: FilterKey; label: string; count: number }[] = [
      { key: "all", label: "All Videos", count: videos.length },
      {
        key: "Authorized Portfolio Edit",
        label: "Portfolio & Client Edits",
        count: videos.filter((v) => v.workType === "Authorized Portfolio Edit").length,
      },
      {
        key: "Studio Motion Demo",
        label: "Studio Motion Demos",
        count: videos.filter((v) => v.workType === "Studio Motion Demo").length,
      },
      {
        key: "Short-Form Social",
        label: "Short-Form 9:16",
        count: videos.filter((v) => v.service === "Short-Form Social").length,
      },
      {
        key: "Video Editing",
        label: "Long-Form 16:9",
        count: videos.filter((v) => v.service === "Video Editing").length,
      },
      {
        key: "Motion Graphics",
        label: "Motion & 3D",
        count: videos.filter((v) => v.service === "Motion Graphics" || v.service === "3D Brand Motion").length,
      },
    ];
    return opts.filter((o) => o.count > 0);
  }, [enableFilters, videos]);

  const visibleVideos = useMemo(() => {
    if (activeFilter === "all") return videos;
    if (activeFilter === "Authorized Portfolio Edit" || activeFilter === "Studio Motion Demo") {
      return videos.filter((v) => v.workType === activeFilter);
    }
    if (activeFilter === "Motion Graphics") {
      return videos.filter((v) => v.service === "Motion Graphics" || v.service === "3D Brand Motion");
    }
    return videos.filter((v) => v.service === activeFilter);
  }, [videos, activeFilter]);

  if (videos.length === 0) return null;

  const activate = (id: string) => {
    setPlayingIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="video-showcase">
      {filterOptions.length > 0 ? (
        <div className="sourcing-catalog__bar video-showcase__filters" role="tablist" aria-label="Filter video showcase">
          {filterOptions.map((opt) => {
            const active = activeFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`location-pill ${active ? "location-pill--all" : ""}`.trim()}
                onClick={() => setActiveFilter(opt.key)}
              >
                {opt.label} ({opt.count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="card-grid card-grid--3 video-showcase__grid">
        {visibleVideos.map((v) => {
          const isPlaying = Boolean(playingIds[v.id]);
          const stageClass = `video-card__stage video-card__stage--${v.aspectRatio.replace("/", "-")}`;
          return (
            <article key={v.id} className="panel video-card">
              <div className={stageClass}>
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
                    {v.captionsSrc ? (
                      <track
                        kind="captions"
                        src={v.captionsSrc}
                        srcLang="en"
                        label="English summary captions"
                      />
                    ) : null}
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
                {v.attributionNote ? (
                  <p className="fine-print video-card__attr">{v.attributionNote}</p>
                ) : null}
                <ul className="tag-list" aria-label="Deliverables">
                  {v.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <details className="video-card__transcript">
                  <summary>Visual summary &amp; transcript notes</summary>
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

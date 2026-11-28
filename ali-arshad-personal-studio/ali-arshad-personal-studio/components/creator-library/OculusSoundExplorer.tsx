"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CREATOR_LIBRARY_PATH, type OculusSoundEntry } from "@/lib/creator-library";

type Props = {
  sounds: readonly OculusSoundEntry[];
  heading: string;
  showGroupLinks?: boolean;
};

/**
 * Interactive searchable tracklist for Oculus Audio Pack 01 (up to all 508 sounds).
 * Renders paginated results (25 at a time) so the DOM stays snappy on mobile and desktop.
 */
export function OculusSoundExplorer({ sounds, heading, showGroupLinks = false }: Props) {
  const [query, setQuery] = useState("");
  const [onlyPreviewable, setOnlyPreviewable] = useState(false);
  const [limit, setLimit] = useState(24);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sounds.filter((s) => {
      if (onlyPreviewable && !s.previewSrc) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.file.toLowerCase().includes(q) ||
        s.groupLabel.toLowerCase().includes(q) ||
        s.originalPath.toLowerCase().includes(q)
      );
    });
  }, [sounds, query, onlyPreviewable]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="panel clib-oculus">
      <div className="clib-oculus__head">
        <div>
          <p className="eyebrow eyebrow--plain">Oculus Audio Pack 01 · UCS Sound Explorer</p>
          <h2 className="section-title section-title--sm">{heading}</h2>
          <p className="fine-print" style={{ marginTop: "6px" }}>
            Search all {sounds.length} sounds by UCS name, sound type, or original folder path. Attribution: &ldquo;Oculus Audio Pack 01&rdquo; by
            Oculus VR, LLC, licensed under CC BY 4.0.
          </p>
        </div>
        <div className="clib-oculus__controls">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(24);
            }}
            placeholder="Filter sounds (e.g. click, footstep, rain, door, whoosh)..."
            className="clib-input"
            aria-label="Search Oculus sound effects"
          />
          <label className="clib-checkbox">
            <input
              type="checkbox"
              checked={onlyPreviewable}
              onChange={(e) => {
                setOnlyPreviewable(e.target.checked);
                setLimit(24);
              }}
            />
            <span>Show instant audio previews only</span>
          </label>
        </div>
      </div>

      <p className="fine-print" style={{ marginBottom: "12px" }}>
        Showing <strong>{visible.length}</strong> of <strong>{filtered.length}</strong> matching sound files.
      </p>

      <ul className="clib-sound-list">
        {visible.map((s) => (
          <li key={s.file} className="clib-sound-row">
            <div className="clib-sound-row__info">
              <strong className="clib-sound-row__title">{s.title}</strong>
              <span className="clib-sound-row__meta">
                <code>{s.file}</code> · {s.durationSec}s · {s.channels === 2 ? "Stereo" : "Mono"} · {Math.round(s.sampleRate / 1000)} kHz
              </span>
              {showGroupLinks ? (
                <Link href={`${CREATOR_LIBRARY_PATH}/${s.groupSlug}`} className="clib-sound-row__group">
                  Included in: {s.groupLabel} →
                </Link>
              ) : null}
            </div>
            {s.previewSrc ? (
              <audio controls preload="none" className="clib-sound-row__audio" aria-label={`Preview ${s.title}`}>
                <source src={s.previewSrc} type="audio/mpeg" />
              </audio>
            ) : (
              <span className="clib-sound-row__badge">Included in ZIP download</span>
            )}
          </li>
        ))}
      </ul>

      {filtered.length > limit ? (
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setLimit((n) => n + 40)}>
            Load more sounds ({filtered.length - limit} remaining)
          </button>
        </div>
      ) : null}
    </div>
  );
}

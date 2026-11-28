"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { CreatorLibraryItem } from "@/lib/creator-library";

type Props = {
  item: CreatorLibraryItem;
  mode?: "card" | "detail";
};

function softwareGlyph(item: CreatorLibraryItem): { code: string; label: string } {
  if (item.category === "Blender Scenes & 3D Assets") return { code: ".BLEND", label: "Blender 3D Project" };
  if (item.category === "After Effects Templates") return { code: ".AEP", label: "After Effects Template" };
  if (item.category === "Motion Graphics & Premiere Templates") return { code: ".PRPROJ", label: "Motion Template" };
  if (item.category === "Video Transitions") return { code: "FX", label: "Premiere Transition" };
  if (item.category === "Sound Effects") return { code: "SFX", label: "Oculus Audio Pack 01" };
  if (item.category === "Music Stings & Voiceover Cues") return { code: "AUDIO", label: "Audio & Voice Cue" };
  if (item.category === "Starter Packs & Directories") return { code: "PACK", label: "Creator Starter Pack" };
  return { code: "MEDIA", label: item.fileFormat };
}

/**
 * Honest visual/audio preview stage for Creator Library cards and detail pages.
 * - Renders click-to-play muted MP4 preview loops when extracted from source clips.
 * - Renders WebP thumbnails when real imagery/textures exist.
 * - Renders native lazy-loaded `<audio controls preload="none">` previews for audio packs.
 * - Renders a crisp technical format stage for raw `.blend`/`.aep`/`.xlsx` files without
 *   fabricating rendered artwork.
 */
export function ResourcePreviewMedia({ item, mode = "card" }: Props) {
  const [playingVideo, setPlayingVideo] = useState(false);
  const glyph = softwareGlyph(item);

  // 1. Video preview (lazy click-to-play over real WebP poster)
  if (item.previewVideo && item.previewImage) {
    return (
      <div className={`clib-stage ${mode === "detail" ? "clib-stage--detail" : ""}`.trim()}>
        {playingVideo ? (
          <video
            className="clib-stage__video"
            src={item.previewVideo}
            poster={item.previewImage}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={`Preview clip for ${item.title}`}
          />
        ) : (
          <button
            type="button"
            className="clib-stage__btn"
            onClick={() => setPlayingVideo(true)}
            aria-label={`Play silent preview for ${item.title}`}
          >
            <Image
              src={item.previewImage}
              alt={`Preview frame from ${item.title}`}
              fill
              sizes={mode === "detail" ? "(min-width: 1024px) 640px, 94vw" : "(min-width: 1024px) 380px, 94vw"}
              className="clib-stage__img"
            />
            <span className="clib-stage__play">
              <Icon name="play" size={16} />
              <span>Preview clip</span>
            </span>
          </button>
        )}
      </div>
    );
  }

  // 2. Real static WebP thumbnail (photos, Poly Haven PBR maps, dust textures, F003 strips)
  if (item.previewImage) {
    return (
      <div className={`clib-stage ${mode === "detail" ? "clib-stage--detail" : ""}`.trim()}>
        <Image
          src={item.previewImage}
          alt={`Preview image for ${item.title}`}
          fill
          sizes={mode === "detail" ? "(min-width: 1024px) 640px, 94vw" : "(min-width: 1024px) 380px, 94vw"}
          className="clib-stage__img"
        />
        <span className="clib-stage__chip">{glyph.code}</span>
      </div>
    );
  }

  // 3. Audio-first stage (Oculus SFX packs & ElevenLabs voiceover WAVs)
  if (item.previewAudio.length > 0) {
    const first = item.previewAudio[0];
    return (
      <div className={`clib-stage clib-stage--audio ${mode === "detail" ? "clib-stage--detail" : ""}`.trim()}>
        <div className="clib-stage__audio-head">
          <span className="clib-stage__code">{glyph.code}</span>
          <span className="clib-stage__count">
            {item.fileCount} {item.fileCount === 1 ? "file" : "files"}
          </span>
        </div>
        <p className="clib-stage__audio-label">{first.label}</p>
        <audio
          controls
          preload="none"
          className="clib-stage__audio-el"
          aria-label={`Audio preview: ${first.label}`}
        >
          <source src={first.src} type="audio/mpeg" />
        </audio>
        {item.previewAudio.length > 1 && mode === "card" ? (
          <p className="clib-stage__audio-more">
            +{item.previewAudio.length - 1} more preview{item.previewAudio.length > 2 ? "s" : ""} on detail page
          </p>
        ) : null}
      </div>
    );
  }

  // 4. Honest technical stage for native project files (.blend / .aep / .xlsx) with no extracted raster preview
  return (
    <div className={`clib-stage clib-stage--spec ${mode === "detail" ? "clib-stage--detail" : ""}`.trim()}>
      <span className="clib-stage__code">{glyph.code}</span>
      <span className="clib-stage__spec-label">{glyph.label}</span>
      <span className="clib-stage__spec-meta">
        {item.sizeLabel} · {item.fileCount} {item.fileCount === 1 ? "file" : "files"}
      </span>
    </div>
  );
}

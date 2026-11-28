# Media Assets, New Folder Audit & Studio Demonstrations Inventory

Last audited: 2026-11-28 (`feature/studio-polish-speed-demos-media`)

This document records the complete recursive audit of all local project media folders (`E:\My-own-Portfolio-2026\video editing`, `E:\My-own-Portfolio-2026\Client videos`, and `E:\My-own-Portfolio-2026\Sourcing`) together with all publicly published videos, studio-created demonstrations, and held-back items awaiting owner confirmation.

---

## 1. Newly Added Folder Audit: `E:\My-own-Portfolio-2026\video editing` (37 Files)

**Policy enforced:** Only cleared original work with confirmed publishing rights is published. Raw `.blend` source projects, licensed Adobe Stock photography, third-party starter/template `.zip` packs, unconfirmed AI voice-over snippets, incomplete `.crdownload` browser files, exact duplicates, and clips with unclear authorship are **never** exposed on the public website or as public downloads.

| Category | Count | Files Inspected | Inspection Result | Publishing Decision |
| --- | ---: | --- | --- | --- |
| Screen-recorded Blender shader session (`.mp4`) | 1 | `2020-02-24-16-16-55.mp4` (`1920×1080`, `23.98fps`, `86.0s`, `96.27 MB`) | Frame-inspected (`4` frames): Blender 2.83.4 Eevee procedural vortex shader-node graph (`Vector Rotate`, `Noise Texture`, `Separate RGB`, `RGB Curves`, `Vortex-Simple1`). File date (`2020-02-24`) sits alongside downloaded Blender splashscreens and stock packs; authorship/clearance is unconfirmed. | **Held back for owner review** — confirm whether this screen recording is Ali's own original Blender session before publishing. |
| ElevenLabs AI voice snippets (`.wav`) | 4 | `ElevenLabs_2026-11-28T08_42_30__s50_sim75_v4.wav` (`2.51s`), `ElevenLabs_2026-11-28T08_42_30__s50_sim75_v4 (1).wav` (**exact SHA-256 duplicate** `ed92cfc43743f1e9`), `ElevenLabs_2026-11-28T08_43_06__s50_sim75_v4.wav` (`2.95s`), `ElevenLabs_2026-11-28T08_44_45__s50_sim75_v4.wav` (`3.63s`) | Short mono `44.1 kHz` synthesized audio clips without confirmed project placement or release note. | **Held back** — not published (and never used to fabricate Ali's personal interview voice). One exact duplicate flagged. |
| Raw Blender scene files (`.blend`) | 6 | `blender-283.blend`, `blender-4.1-splash.blend`, `blender-5.3-splash.blend`, `still-life-splashscreen-erindale-woodford.blend`, `09-microbe-upload.blend`, `24-nebula-upload.blend` | Third-party Blender Foundation splashscreen demos (e.g., Erindale Woodford) and raw `.blend` working/downloaded project files. | **Excluded from public site & downloads** — raw `.blend` scenes and third-party demos are never claimed as Ali's portfolio work or exposed for download. |
| Licensed Adobe Stock images (`.jpeg`) | 3 | `AdobeStock_2219172559.jpeg`, `AdobeStock_2235805024.jpeg`, `AdobeStock_2235815638.jpeg` | Third-party Adobe Stock licensed images. | **Excluded** — never published as Ali's original portfolio photography or retouching showcase. |
| Stock templates, SFX & editing starter packs (`.zip`) | 18 | `14× mixkit-*.zip` Premiere/AE templates, `meta-open-sound-oculus-audio-pack-ogg.zip`, `Free_Video_Editing_Starter_Library.zip` (`586` third-party assets), `F003_PART1a_S01-S08.zip`, `F003_PART1a_S01-S08 (1).zip` (**exact SHA-256 duplicate** `d4add7948ce1adc8`), `F003_PART1b_S09-S15.zip` (practice footage `S01..S15.mp4`) | Third-party stock template/SFX/practice editing libraries. | **Excluded from public site & downloads** — stock/practice packs cannot be redistributed or claimed as portfolio work. One exact duplicate flagged. |
| Incomplete downloads (`.crdownload`) | 5 | `Unconfirmed 320584.crdownload`, `Unconfirmed 63954.crdownload`, `Unconfirmed 639934.crdownload`, `Unconfirmed 703037.crdownload`, `Unconfirmed 896487.crdownload` | Partial Chrome downloads. | **Excluded** — incomplete/unusable files. |

**Result for `video editing/`:** `0` of `37` files published publicly; `1` video (`2020-02-24-16-16-55.mp4`) flagged for Ali's authorship confirmation; `2` exact duplicates flagged; `34` stock/third-party/raw/incomplete files safely excluded.

---

## 2. Published Playable Video Portfolio (`12` Clips Live & Lazy-Loaded)

All `12` published videos live in `public/videos/demos/` + `public/videos/portfolio/` with WebP posters, WebVTT caption/summary tracks, `preload="none"` lazy loading, and preserved original credits/branding (`lib/creative-videos.ts`):

- **`8` Authorized Client & Portfolio Edits** from `E:\My-own-Portfolio-2026\Client videos` (100% of folder published, zero unattributed drops):
  1. `client-khalil-story-short` — Short-form documentary/story cut (9:16)
  2. `client-real-estate-reel` — Real estate showcase vertical edit (9:16)
  3. `client-brand-promo-vertical` — High-tempo vertical brand reel (9:16)
  4. `client-podcast-clip-vertical` — Captioned podcast highlight cut (9:16)
  5. `client-talking-head-reel` — Creator/founder vertical edit (9:16)
  6. `client-lifestyle-product-reel` — Lifestyle & product showcase reel (9:16)
  7. `client-youtube-longform-doc` — Long-form YouTube documentary edit (16:9)
  8. `client-youtube-brand-feature` — Long-form brand narrative edit (16:9)
- **`4` First-Party Studio Motion Demos** authored by Ali Arshad Personal Studio:
  1. `studio-motion-brand-opener` (16:9 Remotion brand/motion title demo)
  2. `studio-motion-ui-explainer` (16:9 UI & software workflow motion demo)
  3. `studio-motion-social-ad` (9:16 kinetic social ad demo)
  4. `studio-motion-3d-product` (16:9 3D product lighting/turntable showcase demo)

---

## 3. Studio-Created Creative Demonstrations (New in This Release)

Created in-house under **Ali Arshad Personal Studio** (`lib/creative-demos.ts`) and explicitly labeled **"Studio-Created Demonstration"** or **"Studio-Created Concept"** — never client commissions, real client brands, testimonials, or real NFT drops/sales:

| ID | Service Capability Covered | Label | Asset Path | Where Featured |
| --- | --- | --- | --- | --- |
| `photoshop-product-compositing` | Photoshop, Photo Editing, Retouching & Compositing | Studio-Created Demonstration | `/images/demos/demo-photoshop-retouching.webp` | `/services/creative-production`, `/services` |
| `illustrator-vector-identity` | Illustrator Artwork, Vector Illustration & Visual Identity | Studio-Created Demonstration | `/images/demos/demo-illustrator-vector.webp` (+ inline SVG vector geometry overlay) | `/services/creative-production`, `/services/branding`, `/services` |
| `social-brand-content-direction` | Social Media & Brand Content Systems | Studio-Created Demonstration | `/images/demos/demo-social-brand-grid.webp` | `/services/social-media-management`, `/services/branding`, `/services/creative-production`, `/services` |
| `nft-digital-collectible-concepts` | NFT & Digital Collectible Visual Concepts | Studio-Created Concept | `/images/demos/demo-nft-collectibles.webp` | `/services/creative-production`, `/services/branding`, `/services` |

---

## 4. Product Sourcing Catalogue (`E:\My-own-Portfolio-2026\Sourcing`, 24 Source Files)

- All `24` source files remain fully reconciled into **`1,436` deduplicated OEM models** (`3,163` documented SKU variants) across **`7` categories** (`public/data/sourcing-catalog.json`).
- **`1,437` branded privacy-redacted PDFs** (`1` Master Catalogue PDF + `1,436` individual product sheet PDFs) remain live under `public/downloads/` with `0` exposed supplier contacts, phone numbers, emails, or confidential pricing sheets.
- No new files were added to `E:\My-own-Portfolio-2026\Sourcing` since the baseline build.

---

## 5. Personal Interview Feature Placeholder (`Meet Ali`)

- Configured via `lib/interview-feature.ts` (`status: "placeholder"`).
- Teaser placed on Homepage (`components/sections/MeetAliTeaser.tsx`) linking to `/about#meet-ali-interview`.
- Full 90-second video card placeholder placed on `/about#meet-ali-interview` (`components/sections/MeetAliInterviewCard.tsx`).
- **Zero fabricated media, voice, quotes, or transcript.** Dropping an optimized `.mp4`, `.webp` poster, `.vtt` caption track, and transcript into `lib/interview-feature.ts` activates full native HTML5 playback immediately without layout changes.

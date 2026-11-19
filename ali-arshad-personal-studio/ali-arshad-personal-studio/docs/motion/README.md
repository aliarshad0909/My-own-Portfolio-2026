# Motion design system (Remotion)

A small, reusable motion system. Compositions are authored in React with
[Remotion](https://www.remotion.dev) under `remotion/`, rendered to optimized
MP4, and embedded through `components/ui/MotionMedia` — so the **Remotion
runtime never ships to the browser**. The client bundle stays at
next/react/react-dom; pages download a short, muted, looping video only when it
is allowed to play.

## Why pre-rendered video, not the live Player

The brief's rule, and ours: prefer a pre-rendered loop when it is lighter than
embedding a live `@remotion/player`. For decorative loops it almost always is.
`MotionMedia` then gives us, for free:

- Autoplay muted + looped where the browser allows it.
- The poster still under `prefers-reduced-motion` — the video is never requested.
- The poster still on small screens (`minWidth`), so phones download less.
- The poster still if autoplay is refused or the file fails — no layout shift,
  because the poster *is* the still.

The homepage **Capabilities** sequence is the one exception that does not use a
video at all: it is an inline, CSS-animated SVG (`components/sections/
Capabilities.tsx`), which is lighter and sharper than any video for a simple
flow diagram. A rendered `CapabilitiesPipeline.mp4` is available if you ever
want to swap it in.

## Licensing — read before shipping to a larger team

Remotion is **free** under the [Remotion License](https://remotion.dev/license)
for individuals and for-profit organizations with **up to 3 employees** (and for
non-profits). Ali Arshad — Personal Studio operates as an individual/solo studio
and qualifies for the Free License today. There is no feature difference between
Free and the paid Company License.

A **Company License** (remotion.pro/license) is required once the organization
has 4+ people, regardless of how many of them use Remotion. **Re-check
eligibility before any team growth or acquisition**, and before a third party
operates this repo commercially. Remotion is a `devDependency` here, used only
to render assets — but the license still governs that use.

## Compositions

| id | file | used on |
|---|---|---|
| `CapabilitiesPipeline` | `remotion/compositions/CapabilitiesPipeline.tsx` | optional homepage swap (SVG ships today) |
| `N8nWorkflow` | `remotion/compositions/N8nWorkflow.tsx` | `/services/n8n-automation` |
| `AiAgentFlow` | `remotion/compositions/AiAgentFlow.tsx` | `/services/ai-agents` |

All are 8-second seamless loops at 1600×900, 30fps, using the exact brand
palette and type from `remotion/brand.ts` (kept in sync with
`styles/tokens.css`).

## Workflow

```bash
# Preview and iterate in the Remotion studio
npm run remotion:studio

# Render a single composition to public/videos
npm run remotion:render:n8n
npm run remotion:render:ai-agent
npm run remotion:render:capabilities

# Poster still (mid-loop frame) — raster, so next/image can serve it
npx remotion still remotion/index.ts N8nWorkflow public/images/motion-posters/n8n-workflow.jpg --frame=150
```

Rendered assets live in `public/videos/*.mp4` and posters in
`public/images/motion-posters/*.jpg`. Keep loops short (≤ ~8s), muted, and under
a few hundred KB.

## Adding motion to another page

1. Author the composition in `remotion/compositions/`, register it in
   `remotion/Root.tsx`.
2. Render the MP4 + a poster still.
3. Add an entry to `HUB_MOTION` in `components/services/ServiceMotion.tsx`
   (or embed `MotionMedia` directly on the page).

Add motion only where it genuinely clarifies the offer. Hubs without a motion
entry render nothing — by design.

## Performance & accessibility checklist

- One loop per page, below the fold, lazy (`MotionMedia` mounts the `<video>`
  only when allowed).
- `prefers-reduced-motion`: honored (poster only).
- No autoplay audio (always muted).
- Posters prevent layout shift and carry the meaning on their own.
- Re-encode if a loop exceeds ~400 KB.

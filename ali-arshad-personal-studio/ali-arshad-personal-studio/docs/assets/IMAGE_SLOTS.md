# Image asset slots (incoming Gemini imagery)

This documents where custom website images go and which component consumes each,
so imagery produced in another session (Gemini) can be dropped in cleanly
**without touching any code**. Nothing here regenerates, renames or overwrites
existing images — it only reserves named paths.

## Rules

- **Do not overwrite** existing files in `public/images/**`. The portraits and
  project imagery already in the repo are approved assets.
- Replace a slot by saving the new image at the **exact documented path** with
  the **documented dimensions** (or a close aspect ratio). The component already
  references that path, so no code change is needed.
- Keep the studio aesthetic: obsidian background, restrained coral, no stock
  clichés. Prefer `.webp`.
- Never invent client logos, screenshots of real client work, or imagery that
  implies an engagement that did not happen.

## Slots

### Already filled (do not overwrite)
| Path | Used by | Notes |
|---|---|---|
| `public/images/portraits/portrait-hero.webp` | `components/sections/Hero.tsx` | Approved hero portrait (1024×1536) |
| `public/images/portraits/portrait-about.webp` | `components/sections/StudioStory.tsx` | About portrait (1157×1360) |
| `public/images/portraits/portrait-experience.webp`, `portrait-contact.webp` | /experience, /contact | Approved |
| `public/images/projects/**` | project & case-study pages | Demonstration artwork |
| `public/images/credentials/**` | credentials gallery | Real certificate scans |

### Open slots for incoming Gemini imagery (optional enhancements)
These are **not referenced yet**; wiring them in is a one-line change per slot,
intentionally deferred so Gemini's work lands first.

| Reserved path | Intended use | Suggested size / ratio |
|---|---|---|
| `public/images/home/capabilities-bg.webp` | Optional texture behind the homepage Capabilities band | 1600×900, dark, very low contrast |
| `public/images/home/about-studio.webp` | Alternative/secondary About image if a second portrait is produced | 1157×1360 portrait |
| `public/images/services/<hub-slug>-hero.webp` | Optional hero aside per service hub | 1200×900 |
| `public/images/og/<page>.webp` | Per-page Open Graph art (beyond the default) | 1200×630 |

When a Gemini image arrives for a reserved slot, save it at that path and open a
tiny follow-up to reference it (e.g. add it to the relevant component or
`opengraph-image`). Until then, pages render correctly without it.

## Motion poster slots

Pre-rendered motion posters live in `public/images/motion-posters/*.jpg` and are
generated from the Remotion compositions (see `docs/motion/README.md`). These are
generated assets — regenerate them with `npx remotion still …`, don't hand-edit.

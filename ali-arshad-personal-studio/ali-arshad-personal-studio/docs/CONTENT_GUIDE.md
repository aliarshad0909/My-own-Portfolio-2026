# Content replacement guide

All content lives in `lib/`. You should not need to edit any page or component to change it.

## 1. Projects — `lib/projects.ts`

One record feeds the homepage, `/work`, `/work/[slug]`, `/case-studies` and `/case-studies/[slug]`.

```ts
{
  id: "p02",
  slug: "brand-launch-film",            // URL: /work/brand-launch-film
  title: "Brand Launch Film",
  client: "Client name",                // only with written permission
  categories: ["Creative Production", "3D & Motion"],
  tags: ["Blender", "Motion", "Ad"],
  year: "2026",
  summary: "One or two sentences on what the project was.",
  projectType: "Professional Work",     // or "Original Concept" | "Open-Source Adaptation"
  status: "Verified",                   // Planned | In Development | Demo Ready | Verified | Published
  role: "Creative lead and editor",
  contribution: ["Concept and storyboard", "3D product animation", "Edit and grade"],
  technologies: ["Blender", "After Effects", "Premiere Pro"],
  featured: true,
  cover: { src: "/images/projects/brand-launch-film.webp", alt: "Describe the image", width: 1600, height: 900 },
  liveUrl: "https://…",                 // optional; the button only appears when set
  sourceUrl: "https://github.com/…",    // optional
  previewVideo: "/videos/brand-launch-film-preview.mp4",   // optional
  gallery: [
    { type: "image", src: "/images/projects/blf-01.webp", alt: "…", width: 1600, height: 900 },
    { type: "video", src: "/videos/blf-full.mp4", poster: "/images/projects/blf-poster.webp", alt: "…" },
  ],
  caseStudy: {                          // remove this key if there is no case study
    background: "…", challenge: "…", approach: "…",
    process: ["Step one", "Step two"],
    solution: "…",
    results: ["Only verified outcomes"],  // leave out if not verified
  },
}
```

### `projectType` — how the work came about

| Value | Use it when |
| --- | --- |
| `Professional Work` | Paid or employed work you genuinely contributed to. |
| `Original Concept` | You built it from scratch. The business scenario may be fictional; the software must be real. |
| `Open-Source Adaptation` | It is built on someone else's project. **An `attribution` block is required** — see below. |

### `status` — how finished it is

| Value | Meaning | Indexed by search engines |
| --- | --- | --- |
| `Planned` | Scoped, not started. Put these in `PLANNED` instead. | No |
| `In Development` | Being built. | No |
| `Demo Ready` | Builds, tested, deployable. | No |
| `Verified` | A real engagement confirmed with the client, naming permission included. | No |
| `Published` | Live, written up, approved for public listing. | Yes |

Only set `Demo Ready` once it genuinely works and has been tested, and only
`Published` once the write-up and any deployment are live. Everything except
`Published` shows a badge and a short explanatory note on the project page, so
nothing is mistaken for delivered client work.

Set `usesSampleMedia: true` on any record whose imagery is placeholder artwork
rather than real project work. The site then says so on the card.

### Attribution for open-source adaptations

Required whenever `projectType` is `"Open-Source Adaptation"`. The project page
renders it automatically, and a missing block shows an editor warning in
development.

```ts
attribution: {
  project: "Medusa",
  url: "https://github.com/medusajs/medusa",
  license: "MIT",
  licenseUrl: "https://github.com/medusajs/medusa/blob/develop/LICENSE",
  copyright: "Medusa contributors",
  originalWork: "Headless commerce backend: inventory, pricing, carts and orders.",
  modifications: ["Rebuilt the storefront UI", "Added the X integration"],
}
```

Keep the upstream LICENSE file in the demo's own directory too. Never remove an
upstream copyright notice, and never describe adapted work as built from
scratch. `docs/OPEN_SOURCE_RESEARCH.md` in the repository root records how each
foundation was assessed.

### Planned projects

Work that is scoped but not built goes in the `PLANNED` array, not `PROJECTS`.
It is listed as a pipeline on `/work` so the roadmap is visible without
inflating the project count. Move an entry into `PROJECTS` once it is built and
tested.

**Images:** export covers as WebP at 1600×900, put them in
`public/images/projects/`, and set the real `width` and `height`.
**Videos:** put MP4 files in `public/videos/`. Preview clips play muted on hover
only, never for visitors who prefer reduced motion. Keep previews under about 3 MB.

Case-study sections with no text are skipped on the live site. While running
`npm run dev`, yellow "Editor note" boxes show what is still missing; they never
appear in production.

## 2. Services — `lib/services.ts`

Edit titles, descriptions, capabilities, client types and example projects. `id` is the page anchor, so changing it changes links. `featured: true` shows the service on the homepage. `partnerDelivered: true` adds the "Delivered with partners" label. Do not add fixed prices.

## 3. Expertise and tools — `lib/expertise.ts`

Add a tool only once you are comfortable being asked about it. Tools use two-letter tiles rather than third-party logos. No percentages.

## 4. Experience — `lib/experience.ts`

Each entry accepts optional `title`, `organization` and `period`. They are hidden while empty.
Dynamic360, FBR and BB Solutions are noted at the top of the file: match each to the right entry, confirm dates and titles, and confirm you may name them.

## 5. Site settings — `lib/site.ts`

- `socials` — paste real profile URLs. Empty ones are not shown anywhere.
- `availability` — optional line on the contact page; leave empty until true.
- Contact email comes from `NEXT_PUBLIC_CONTACT_EMAIL`.
- `NAV_ITEMS` — header, mobile menu and footer links.

## 6. Page copy

Longer copy sits in the page files: `app/about/page.tsx` (strengths and principles are lists at the top), `components/sections/Hero.tsx`, `components/sections/StudioStory.tsx`.

## 7. Portraits and Open Graph image

Portraits are in `public/images/portraits/`. Replace a file with the same name, and update `width`/`height` where the image is used if the proportions change.
The social sharing image is `app/opengraph-image.jpg` (1200×630).

## 8. Design tokens

Colours, type sizes, spacing and radius are in `styles/tokens.css`.

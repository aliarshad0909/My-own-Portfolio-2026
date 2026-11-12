# Content replacement guide

All content lives in `lib/`. You should not need to edit any page or component to change it.

## 1. Projects — `lib/projects.ts`

One record feeds the homepage, `/work`, `/work/[slug]`, `/case-studies` and `/case-studies/[slug]`.

```ts
{
  slug: "brand-launch-film",            // URL: /work/brand-launch-film
  title: "Brand Launch Film",
  client: "Client name",                // only with the client's permission
  categories: ["Creative Production", "3D & Motion"],
  tags: ["Blender", "Motion", "Ad"],
  year: "2025",
  summary: "One or two sentences on what the project was.",
  role: "Creative lead and editor",
  contribution: ["Concept and storyboard", "3D product animation", "Edit and grade"],
  status: "published",                  // "published" | "draft" | "placeholder"
  featured: true,                       // first three featured show on the homepage
  cover: { src: "/images/projects/brand-launch-film.webp", alt: "Describe the image", width: 1600, height: 900 },
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

Status rules:

- `placeholder` — sample artwork. Labelled on every card and page, hidden from search engines and the sitemap.
- `draft` — a real project whose write-up is unfinished. Labelled "Draft", not indexed.
- `published` — verified and approved. Indexed and added to the sitemap.

Categories must match the filter list at the top of the file. To add a filter, add it to `PROJECT_CATEGORIES`.

Case-study sections with no text are skipped on the live site. While running `npm run dev`, yellow "Editor note" boxes show what is still missing; they never appear in production.

**Images:** export covers as WebP at 1600×900, put them in `public/images/projects/`, and set the real `width` and `height`.
**Videos:** put MP4 files in `public/videos/`. Preview clips play muted on hover only, and never for visitors who prefer reduced motion. Keep previews short (under about 3 MB).

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

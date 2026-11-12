# Ali Arshad — Personal Studio

Portfolio website for Ali Arshad, an independent creative and digital studio.
Next.js (App Router) · TypeScript · React 19 · plain CSS design tokens · no UI or icon dependencies.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # optional for local work
npm run dev                  # http://localhost:3000
```

Before every deploy:

```bash
npm run typecheck
npm run build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero, selected work, studio dashboard, studio story, contact CTA |
| `/work` | Portfolio gallery with working category filters |
| `/work/[slug]` | Project detail |
| `/services` | Six service groups with anchors (`/services#ai-automation`) |
| `/about` | Introduction, background, strengths, philosophy, collaboration model |
| `/case-studies` | Editorial case-study index |
| `/case-studies/[slug]` | Case-study detail (reusable layout) |
| `/experience` | Timeline plus skills and tools |
| `/contact` | Inquiry form |
| `/api/inquiry` | Form backend (POST) |
| `/sitemap.xml`, `/robots.txt` | Generated |

## Structure

```
app/                 Pages, routes, metadata, sitemap, robots, OG image, favicon
components/layout/   Header (with mobile menu) and footer — shared by every page
components/ui/       Buttons, icons, brand mark, badges, page hero
components/sections/ Homepage sections and the shared contact CTA
components/work/     Project card, gallery filter, detail layout, media
components/contact/  Inquiry form
lib/                 ALL editable content and configuration (see docs/CONTENT_GUIDE.md)
styles/              tokens.css → base.css → components.css → sections.css
public/images/       Optimised WebP assets
public/videos/       Add approved project videos here
```

Design tokens (colours, type scale, spacing, radius) live in `styles/tokens.css`.

## Contact form

The form validates in the browser and again on the server, using the same rules (`lib/inquiry.ts`).
It reports success **only** when a delivery channel confirms receipt.

Configure at least one channel through environment variables (see `.env.example`):

- **Webhook** — `INQUIRY_WEBHOOK_URL` (+ optional `INQUIRY_WEBHOOK_SECRET`, sent as the `x-inquiry-secret` header). Works with n8n, Make, Zapier or a CRM endpoint. Payload:
  ```json
  { "source": "ali-arshad-studio", "receivedAt": "ISO date", "inquiry": { "name": "", "email": "", "company": "", "service": "", "description": "", "budget": "", "timeline": "", "consent": true } }
  ```
- **Email via Resend** — `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL`.

If both are set, both are used; the visitor sees success when at least one delivers, and failures are logged on the server.

With no channel configured, `/contact` shows a "form isn't connected yet" notice and the API answers `503 not_configured`. Nothing is ever reported as sent.

Built-in protection: same-origin check, JSON-only, 20 KB body limit, honeypot field, minimum fill time, and a rate limit of 5 inquiries per 10 minutes per IP.

## Deploying to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project**, import the repository. The framework is detected automatically; keep the default build settings.
3. Add the environment variables from `.env.example` under **Settings → Environment Variables**.
4. Deploy. After adding or changing variables, redeploy so pages pick them up.
5. Add your domain under **Settings → Domains**, then set `NEXT_PUBLIC_SITE_URL` to it (for example `https://yourdomain.com`) and redeploy. This switches on canonical URLs and the correct sitemap host.

## Before public launch

- [ ] Run `npm install`, `npm run typecheck` and `npm run build` (see "Verification status" below).
- [ ] Replace the three placeholder projects in `lib/projects.ts` with verified work.
- [ ] Confirm dates, job titles and organisation names in `lib/experience.ts`.
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL` and add real social URLs in `lib/site.ts`.
- [ ] Configure an inquiry channel and send a real test inquiry.
- [ ] Rate limiting is in-memory, so each serverless instance counts separately. Before running ads or expecting heavy traffic, add a shared store (for example Upstash Redis) or enable Vercel's firewall / bot protection, and consider a CAPTCHA such as Cloudflare Turnstile.
- [ ] Add a privacy policy page and link it next to the consent checkbox. The form collects personal data from international visitors.
- [ ] Replace low-resolution supplied images (see "Asset notes").
- [ ] Run `npm audit` and keep `next` on the latest patch release.

## Asset notes

Several supplied images are small and will look soft on large screens:

| File | Size | Used for |
| --- | --- | --- |
| `studio/studio-workspace.webp` | 435×176 | Homepage studio panel |
| `projects/placeholder-*.webp` | about 320×170 | Placeholder project covers |
| `backgrounds/*.webp` | about 260×140 | Subtle textures only |

Recommended replacements: studio photo at 1200px wide or more; project covers at 1600×900.

The hero portrait supplied is a full-length standing pose, so the hero shows it from head to mid-thigh rather than the chest-up crop in the approved reference.

## Verification status

The build environment had no access to the npm registry, so Next.js could not be installed there.

**Verified** by rendering the real components with React 19 in headless Chromium:

- All routes render at 360, 390, 430, 768, 1024, 1440 and 1920px with no horizontal overflow, no broken images and no runtime errors.
- Navigation links, active states, mobile menu (open, close, Escape, focus trap, scroll lock, closes on navigate).
- Portfolio filters, including empty categories.
- Form validation, error focus, and every response state (not configured, network failure, malformed response, confirmed success).
- `/api/inquiry` handler: 16 scenarios including validation, spam traps, cross-origin, webhook success and failure, and rate limiting.
- Skip link, visible focus, 44px touch targets, reduced-motion behaviour.
- TypeScript check of all project code against simplified framework type stubs.

**Not verified — please run locally:**

- `npm install` and `npm run build` with the real Next.js toolchain.
- `npm run typecheck` against the real React and Next.js type definitions.
- `next/font` loading of Space Grotesk and DM Sans, `next/image` optimisation, generated metadata, sitemap and robots output.
- Resend email delivery (the webhook path was tested; the email path was not).
- Lighthouse / Core Web Vitals on the deployed site.

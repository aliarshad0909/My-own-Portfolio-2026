# Search Engine & AI Discovery Monitoring Checklist — `https://www.aliarshad.co`

**Last Updated:** 2026-11-28  
**Canonical Production Origin:** `https://www.aliarshad.co` (apex `https://aliarshad.co` 308-redirects cleanly to `www`)  
**Keyword-to-Page Map:** See [`docs/SEO-KEYWORD-TO-PAGE-MAP.md`](./SEO-KEYWORD-TO-PAGE-MAP.md)

> **Truthfulness note:** Clean technical architecture, structured data, verified author/profile links, and crawlable first-party content improve crawlability and entity understanding across Google, Bing, ChatGPT, Gemini, and Claude — they never guarantee search rankings or AI recommendations.

---

## 1. Google Search Console (`search.google.com/search-console`)

1. **Property verification:** Verify a **Domain property** (`aliarshad.co`) via DNS TXT record (covers apex, `www`, and live demo subdomains `crm.aliarshad.co` / `stock.aliarshad.co`) OR URL-prefix property `https://www.aliarshad.co/`. Optionally supply `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel Environment Variables.
2. **Submit XML Sitemap:**
   - Sitemap URL: `https://www.aliarshad.co/sitemap.xml`
   - Covers core studio pages, all `10` Studio Blog dispatches, `14` canonical `/case-studies/*` builds, `12` calculators, `15` evergreen buyer guides (`/resources/*`), published service hubs/spokes, the Searchable Product Sourcing Catalogue (`/services/product-sourcing/catalog`), and all `907` spec-documented product detail pages (including `160` newly added Custom Apparel/Sportswear styles), while keeping `529` visual-only reference plates, unbuilt work concepts, `/admin`, and unverified location previews cleanly `noindex` and out of the sitemap.
3. **Request Initial Indexing (URL Inspection tool) on Priority Pages:**
   - `https://www.aliarshad.co/`
   - `https://www.aliarshad.co/services/product-sourcing`
   - `https://www.aliarshad.co/services/product-sourcing/catalog`
   - `https://www.aliarshad.co/services/creative-production`
   - `https://www.aliarshad.co/services/gpu-compute`
   - `https://www.aliarshad.co/services/web-development`
   - `https://www.aliarshad.co/services/n8n-automation`
   - `https://www.aliarshad.co/blog`
   - `https://www.aliarshad.co/blog/product-sourcing-landed-cost-catalog-checklist`
   - `https://www.aliarshad.co/blog/single-host-gpu-compute-when-consultation-beats-cloud`
4. **Weekly / Monthly Monitoring Routine:**
   - **Performance → Queries & Pages:** Export 28-day & 90-day impressions, clicks, CTR, and average position; reconcile real queries against `docs/SEO-KEYWORD-TO-PAGE-MAP.md` to spot high-impression / low-CTR title improvements.
   - **Indexing → Pages:** Confirm `/work/<flagship-case-study>` URLs consolidate to `/case-studies/<slug>` via `308`, `noindex` visual-only product plates remain excluded intentionally, and zero unexpected `404` / `5xx` errors exist.
   - **Enhancements / Rich Results:** Verify valid `BreadcrumbList`, `FAQPage`, `BlogPosting`, `Service`, and `Product` structured data with zero schema warnings.
   - **Core Web Vitals:** Confirm green mobile & desktop LCP/CLS/INP (lazy-loaded videos, dynamic client-only R3F canvas, 2-font Google typography, and WebP thumbnails protect paint speed).

---

## 2. Bing Webmaster Tools (`bing.com/webmasters`)

*(Bing's index directly supports Microsoft Bing, Copilot, and web retrieval for ChatGPT search.)*

1. **Verify or import property:** Verify `https://www.aliarshad.co` (1-click import from Google Search Console or DNS TXT; optional `NEXT_PUBLIC_BING_SITE_VERIFICATION` env var).
2. **Submit Sitemap & RSS Feed:**
   - XML Sitemap: `https://www.aliarshad.co/sitemap.xml`
   - Blog RSS Feed: `https://www.aliarshad.co/blog/rss.xml`
3. **Submit Priority URLs via Bing URL Submission Tool / IndexNow:** Submit the priority URLs above whenever new blog posts, videos, or catalog updates ship.
4. **Run Bing Site Scan & `robots.txt` Tester:** Confirm `https://www.aliarshad.co/robots.txt` allows `/` while disallowing `/api/` and `/admin`, and links cleanly to `https://www.aliarshad.co/sitemap.xml`.

---

## 3. AI Search & Answer-Engine Readiness (ChatGPT, Gemini, Claude, Perplexity)

- **Crawlable First-Party SSR HTML:** All public routes render clean semantic HTML with single H1s, proper heading hierarchy, explicit work/demo truthfulness disclosures, and zero client-only content walls.
- **Entity Consistency (`@id` Graph + Verified `sameAs`):**
  - `Person` (`#person`), `ProfessionalService` (`#studio`), and `WebSite` (`#website`) link consistently to Ali Arshad's verified profiles:
    - LinkedIn: `https://www.linkedin.com/in/aliarshad09/`
    - Instagram: `https://www.instagram.com/aliarshad.co/`
    - Facebook: `https://www.facebook.com/profile.php?id=61589134283009`
    - Upwork: `https://www.upwork.com/freelancers/~011274422835620f07`
  - **Recommended Owner Action:** Keep reciprocal links pointing back to `https://www.aliarshad.co` across LinkedIn, Instagram, Facebook, and Upwork so search and AI entity graphs corroborate identity consistently.
- **Machine-Readable Summary (`llms.txt`):** `https://www.aliarshad.co/llms.txt` concisely summarizes services, truthful demo boundaries, the 1,436-model / 7-category Product Sourcing Catalogue, Master PDF, 12 published videos, 12 calculators, and 10 blog dispatches.
- **Downloadable Branded PDFs:** Master Catalogue (`https://www.aliarshad.co/downloads/Ali-Arshad-Product-Sourcing-Catalogue.pdf`) and all `1,436` individual product PDFs (`/downloads/products/<slug>.pdf`) include selectable text, branded PDF metadata, and clickable canonical links back to `https://www.aliarshad.co`.

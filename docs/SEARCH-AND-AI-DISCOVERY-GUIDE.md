# Search Engine & AI Discovery Submission Checklist — `https://www.aliarshad.co`

**Last Updated:** 2026-11-27  
**Canonical Production Origin:** `https://www.aliarshad.co` (apex `https://aliarshad.co` 308-redirects cleanly to `www`)

> **Truthfulness note:** Clean technical architecture, structured data, accurate author/profile links, and crawlable first-party content improve crawlability and entity understanding across Google, Bing, ChatGPT, Gemini, and Claude — they never guarantee search rankings or AI recommendations.

---

## 1. Google Search Console (`search.google.com/search-console`)

1. **Property verification:** Verify a **Domain property** (`aliarshad.co`) via DNS TXT record (recommended so apex, `www`, and subdomains like `crm.aliarshad.co` / `stock.aliarshad.co` are covered cleanly) OR verify URL-prefix property `https://www.aliarshad.co/`.
2. **Submit Sitemap:**
   - Sitemap URL: `https://www.aliarshad.co/sitemap.xml`
   - Includes core studio pages, all 10 Studio Blog dispatches, 14 flagship `/case-studies/*` builds (with `HTTP 308` redirects from `/work/*`), 12 interactive calculators, 15 evergreen buyer guides (`/resources/*`), published service hubs/spokes, the Searchable Product Sourcing Catalogue (`/services/product-sourcing/catalog`), and all `747` spec-documented product detail pages (while keeping `94` visual-only plates, unbuilt concepts, and unverified location previews cleanly `noindex` and out of the sitemap).
3. **Request Initial Indexing (URL Inspection tool) on Key Priority Pages:**
   - `https://www.aliarshad.co/`
   - `https://www.aliarshad.co/services/product-sourcing`
   - `https://www.aliarshad.co/services/product-sourcing/catalog`
   - `https://www.aliarshad.co/services/gpu-compute`
   - `https://www.aliarshad.co/services/creative-production`
   - `https://www.aliarshad.co/blog`
   - `https://www.aliarshad.co/blog/product-sourcing-landed-cost-catalog-checklist`
   - `https://www.aliarshad.co/blog/single-host-gpu-compute-when-consultation-beats-cloud`
   - `https://www.aliarshad.co/about`
4. **Monitor Weekly in GSC:**
   - **Indexing → Pages:** Confirm `/work/<flagship-case-study>` URLs consolidate cleanly to `/case-studies/<slug>` via permanent `308` redirects and zero unexpected `404` or soft-404 errors appear.
   - **Enhancements / Rich Results:** Confirm valid `BreadcrumbList`, `FAQPage`, `BlogPosting` / `Article`, and `Product` / `SoftwareApplication` structured data with zero schema syntax errors.
   - **Core Web Vitals:** Confirm mobile & desktop CLS/LCP remain green (lazy-loaded videos and WebP thumbnails keep initial payload lightweight).

---

## 2. Bing Webmaster Tools (`bing.com/webmasters`)

*(Bing's index directly powers Microsoft Bing, Copilot, and web-search retrieval used by ChatGPT / OpenAI search.)*

1. **Import or verify site:** Verify `https://www.aliarshad.co` (you can import directly from Google Search Console in one click or verify via DNS TXT).
2. **Submit Sitemap & RSS Feed:**
   - XML Sitemap: `https://www.aliarshad.co/sitemap.xml`
   - Blog RSS Feed: `https://www.aliarshad.co/blog/rss.xml`
3. **Submit Priority URLs via Bing URL Submission Tool (or IndexNow):**
   - Submit the same priority URLs listed above, plus newly added product pages if you want faster discovery.
4. **Verify `robots.txt` Tester in Bing:**
   - Confirm `https://www.aliarshad.co/robots.txt` returns `Allow: /`, `Disallow: /api/` and `/admin`, and points to `Sitemap: https://www.aliarshad.co/sitemap.xml`.

---

## 3. AI Search & Answer-Engine Readiness (ChatGPT, Gemini, Claude, Perplexity)

- **Crawlable First-Party SSR HTML:** All core pages, services, blog articles, calculators, and product catalogue detail pages render full static/SSR HTML with clean heading hierarchies and zero client-only content walls.
- **Entity Consistency (`@id` Graph + Verified `sameAs`):**
  - `Person` (`#person`), `ProfessionalService` (`#studio`), and `WebSite` (`#website`) link consistently to Ali Arshad's verified public profiles:
    - LinkedIn: `https://www.linkedin.com/in/aliarshad09/`
    - Instagram: `https://www.instagram.com/aliarshad.co/`
    - Facebook: `https://www.facebook.com/profile.php?id=61589134283009`
    - Upwork: `https://www.upwork.com/freelancers/~011274422835620f07`
  - **Recommended Owner Action:** Ensure each of those external profiles links back to `https://www.aliarshad.co` using consistent name and positioning (`Ali Arshad — Personal Studio`) so search and AI entity graphs corroborate identity reciprocally.
- **Machine-Readable Summary (`llms.txt`):** `https://www.aliarshad.co/llms.txt` summarizes services, truthful demo boundaries, the searchable Product Sourcing Catalogue, Master PDF, calculators, and dispatches cleanly for LLM agents.
- **Downloadable Branded PDFs:** Master Catalogue (`https://www.aliarshad.co/downloads/Ali-Arshad-Product-Sourcing-Catalogue.pdf`) and all 841 individual product PDFs (`/downloads/products/<slug>.pdf`) include selectable text, clean PDF title/author metadata, and direct clickable links back to `https://www.aliarshad.co`.

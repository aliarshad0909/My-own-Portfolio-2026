# Off-Site Visibility, Search Console & Legitimate Backlink Plan

> **Important Note on Search Rankings:** Following Google Search Central guidance, no SEO work can guarantee specific search rankings or traffic volumes. Sustainable organic visibility comes from helpful original pages, clean technical indexing, genuine brand citations, and real software demonstrations that people link to voluntarily.
>
> **Action Guardrail:** Nothing below has been published, submitted, or sent automatically. All draft copy is provided for owner review and manual publishing only.

---

## 1. Search Engine Verification Status (Owner Action Required)

Live inspection of `https://www.aliarshad.co/` confirmed that neither search-engine verification meta tag is currently emitted:
- `google-site-verification`: **Not configured** (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` unset in Vercel)
- `msvalidate.01` (Bing Webmaster Tools): **Not configured** (`NEXT_PUBLIC_BING_SITE_VERIFICATION` unset in Vercel)

### Exact Steps to Verify Google Search Console & Bing Webmaster Tools
1. **Google Search Console (https://search.google.com/search-console):**
   - Add a **Domain property** (`aliarshad.co`) via GoDaddy TXT record (recommended — covers `www`, `crm`, and `stock`) **and/or** URL-prefix property `https://www.aliarshad.co/` using the HTML meta tag token in Vercel env var `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
   - Submit sitemap: `https://www.aliarshad.co/sitemap.xml`.
   - Request indexing for key pages after production deployment: `/`, `/services`, `/case-studies/pipelineos-crm`, `/case-studies/stockflow-inventory`, `/studio-network`, `/tools`.
2. **Bing Webmaster Tools (https://www.bing.com/webmasters):**
   - Import directly from verified Google Search Console (1 click) or set `NEXT_PUBLIC_BING_SITE_VERIFICATION` in Vercel.
   - Submit `https://www.aliarshad.co/sitemap.xml`.
3. **Vercel Canonical Host Env Variable:**
   - Set `NEXT_PUBLIC_SITE_URL=https://www.aliarshad.co` in Vercel Production (matching the live `308` redirect target from `https://aliarshad.co/` → `https://www.aliarshad.co/`).

---

## 2. Legitimate, Spam-Free Off-Site Link & Citation Opportunities

Zero paid links, zero link farms, zero automated comments. Focus strictly on high-trust, owned or merit-earned placements:

1. **GitHub Profile & Repository READMEs (Owned, High Trust)**
   - Pin `My-own-Portfolio-2026` on your GitHub profile (`github.com/aliarshad0909`) with Website set to `https://www.aliarshad.co`.
   - In the root `README.md`, `apps/pipelineos/README.md`, `apps/stockflow/README.md`, and `apps/stockflow-mobile/README.md`, link clearly to the live demos (`https://crm.aliarshad.co`, `https://stock.aliarshad.co`, `https://stockflow-mobile-web.onrender.com`) and corresponding case studies on `https://www.aliarshad.co/case-studies/...`.
   - Set `NEXT_PUBLIC_GITHUB_URL=https://github.com/aliarshad0909` in Vercel so your `Person` JSON-LD `sameAs` connects GitHub ↔ Portfolio cleanly.
2. **Professional Freelance & Social Profiles (Owned)**
   - **Upwork Profile:** Link `https://www.aliarshad.co` and include PipelineOS & StockFlow as verifiable portfolio items with live sandbox URLs.
   - **LinkedIn Profile & Featured Section:** Add featured links to `https://www.aliarshad.co`, `https://www.aliarshad.co/case-studies/pipelineos-crm`, and `https://www.aliarshad.co/case-studies/stockflow-inventory`.
   - **Behance / Dribbble / YouTube (if active):** Publish real case-study breakdowns and the 60s product walkthrough videos linking back to the matching case-study page.
3. **Relevant Technical & Founder Directories (Manual Review Submissions)**
   - **Clutch / DesignRush / GoodFirms** (independent studio listing — only with truthful solo-studio framing and zero fabricated employee counts or fake reviews).
   - **Next.js / Drizzle / Expo / n8n Community Showcases:** Submit PipelineOS or StockFlow as open-source architectural showcases in official community Discord/GitHub Discussions where "Show & Tell" threads exist.
   - **Product Hunt / Hacker News "Show HN" (Optional, Earned):** Only when ready to answer technical questions live about building MIT-clean Next.js + PostgreSQL + Expo SaaS demos.
4. **Original Technical Articles (Syndication with Canonical)**
   - Publish 2–3 genuinely useful engineering write-ups on `/resources/...` first, then cross-post to **Dev.to** or **Hashnode** with `canonical_url` pointing back to `https://www.aliarshad.co/resources/...`:
     - *"Preventing Negative Inventory Across Web & Mobile with Atomic PostgreSQL Transactions (Drizzle ORM)"*
     - *"Why We Audited Open-Source CRM Licenses Before Building PipelineOS in Next.js 16"*
     - *"Designing Practical n8n + AI Agent Workflows with Human Escalation Gates"*

---

## 3. Draft Profile & Directory Copy (For Owner Review Only — Not Sent)

### Short Studio Bio (160–220 characters — LinkedIn / GitHub / Directories)
> Independent designer, full-stack developer, and automation builder helping US and international businesses ship Next.js web apps, n8n/AI workflows, and brand visuals. Test live SaaS demos at aliarshad.co.

### Medium Directory Description (~85 words — Clutch / Upwork / Showcase Submissions)
> Ali Arshad Personal Studio is an independent creative and technical studio working remotely with US and international businesses. Instead of splitting a build across separate design, engineering, and automation vendors, clients work directly with one accountable builder across custom Next.js and PostgreSQL web applications, practical AI agents and n8n workflow automation, and brand or video production. Prospective clients can test live full-stack demonstrations — including PipelineOS CRM (crm.aliarshad.co) and StockFlow multi-warehouse inventory with a mobile companion (stock.aliarshad.co) — directly at www.aliarshad.co.

### Community "Show & Tell" Draft (Next.js / Drizzle / Expo Showcase — Optional)
> **Title:** Built two MIT-clean full-stack SaaS demos (CRM + Multi-Warehouse Inventory + Expo Mobile) with Next.js 16, Drizzle ORM & PostgreSQL
>
> **Body:** I built two live sandbox applications for my personal studio portfolio so prospective clients can test real database-backed software instead of static slides:
> - **PipelineOS CRM** (`https://crm.aliarshad.co`): 8-table PostgreSQL schema, atomic Lead → Contact + Deal conversion, 6-stage Kanban pipeline, and live analytics.
> - **StockFlow Inventory** (`https://stock.aliarshad.co`) + **Mobile Preview** (`https://stockflow-mobile-web.onrender.com`): 11-table atomic inventory ledger preventing negative stock, shared `/api/v1` cookie + Bearer auth API, and an 11-screen React Native + Expo SDK 52 companion app.
>
> Both use fictional sandbox data with a 1-click Reset Demo button. Architecture write-ups and source links: `https://www.aliarshad.co/case-studies/pipelineos-crm` and `https://www.aliarshad.co/case-studies/stockflow-inventory`. Feedback on schema design or UX welcome!

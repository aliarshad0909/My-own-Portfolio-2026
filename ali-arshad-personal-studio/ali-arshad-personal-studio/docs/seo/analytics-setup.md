# Search Console, Bing and analytics setup

Everything code-side is already wired; each step below is an account action
only Ali can perform. No tokens, IDs or credentials belong in the
repository — they all go in Vercel environment variables.

## 1. Google Search Console

1. Open <https://search.google.com/search-console> → Add property →
   **URL prefix** → `https://my-own-portfolio-2026.vercel.app/`.
2. Choose the **HTML tag** method. Copy only the `content="…"` value.
3. In Vercel → Project → Settings → Environment Variables, add
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = that value (Production).
4. Redeploy, then press **Verify**. The meta tag is emitted by
   `app/layout.tsx` only when the variable exists.
5. After verifying: Sitemaps → submit `sitemap.xml`.

If a custom domain is added later, set `NEXT_PUBLIC_SITE_URL` to it, add the
domain as a new property, and re-submit the sitemap; canonicals follow
automatically.

## 2. Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → Add site. The fastest route is
   **Import from Google Search Console** (no extra tag needed).
2. For standalone verification, use the meta-tag option and set
   `NEXT_PUBLIC_BING_SITE_VERIFICATION` to the `msvalidate.01` content
   value, then redeploy.

## 3. Visitor analytics (privacy-conscious)

Two reasonable options; neither is installed yet because both need either a
dependency or an account:

- **Vercel Web Analytics** (cookieless): enable in Vercel → Project →
  Analytics, then `npm install @vercel/analytics` and render `<Analytics />`
  in `app/layout.tsx`. One dependency, no cookie banner needed.
- **Plausible / Umami** (self-hosted or paid): a single `<script>` tag in
  the layout; also cookieless.

Pick one — running two trackers doubles the weight for no insight.

## 4. Core Web Vitals monitoring

- Vercel **Speed Insights** (Project → Speed Insights) reports field LCP,
  INP and CLS per route after `npm install @vercel/speed-insights` and
  adding `<SpeedInsights />` to the layout.
- Search Console → Core Web Vitals shows the CrUX field data Google
  actually ranks with once traffic exists.

## 5. Contact conversion tracking

`/api/inquiry` is the single conversion point. Once analytics is chosen,
count a conversion on the form's success state (the `sent` branch in
`components/contact/InquiryForm.tsx`) rather than on page views of
`/contact`. No personal data from the form should ever be sent to
analytics — count the event, not the content.

## What is NOT set up, deliberately

- No analytics figures exist yet; nothing in the repo claims any.
- No Google Business Profile: requires a decision about publishing a real
  business location.

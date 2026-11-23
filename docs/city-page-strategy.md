# City Page Strategy & 51-Metro Priority Roadmap

## 1. Core Policy: Never Publish 51 Swapped-Name Doorway Pages

Google Search Central explicitly classifies mass-generated "developer in [city]" pages as doorway spam. This studio operates **remotely** with zero physical US branch offices and zero fabricated local client claims.

Every city page must therefore:
1. Serve a **distinct local business audience** matched to that metro's verified economic profile.
2. Answer **practical local questions** relevant to businesses in that market (industry bottlenecks, automation/software/creative opportunities, remote time-zone overlap, practical working context).
3. Record **authoritative primary sources** (`sourceName`, `sourceUrl`, `checkedDate`, `reviewBy`) for every factual local claim, using official government/economic/university sources (U.S. Bureau of Labor Statistics, U.S. Census Bureau, Federal Reserve regional banks, municipal economic development agencies).
4. Remain **`PublicNoIndex`** (navigable for owner review, excluded from search index and `sitemap.xml`) or **`NeedsEvidence`** until editorial review and a verified local signal are confirmed by the owner.

---

## 2. Three-Tier 51-City Priority Roadmap

### Tier 1 — Active Reviewable Pilot (3 Cities, Built in Stage E as `PublicNoIndex`)
Chosen for maximum **industry differentiation** across three distinct US time zones and three distinct studio service pillars:

| # | City, State | Time Zone | Primary Target Audience | Primary Service Angle | Local Differentiation Focus |
| --- | --- | --- | --- | --- | --- |
| 1 | **Austin, TX** | Central (CT) | Venture-backed B2B SaaS, semiconductor/hardware & fast-scaling startups | Web & Software Development, AI Products & Agents | Rapid MVP/Next.js builds, CRM/sales pipeline software (PipelineOS), launch visuals & motion |
| 2 | **Chicago, IL** | Central (CT) | Logistics/TDL operators, advanced manufacturers, mid-market B2B & finance | Data & Business Analytics, Operations Software & Inventory | Multi-warehouse inventory (StockFlow), executive dashboards (Northwind), supply-chain workflow automation |
| 3 | **Seattle, WA** | Pacific (PT) | Cloud/AI product teams, e-commerce/retail operators, maritime & trade firms | AI Automation & Workflows (n8n), E-Commerce & Supply Chain | Support & lead-routing AI agents, n8n integrations, storefront & trade operations tooling |

### Tier 2 — Next Expansion Wave (12 Cities — Held as `NeedsEvidence` Until Pilot Approval)
New York City (NY), San Francisco (CA), Los Angeles (CA), Dallas (TX), Miami (FL), Boston (MA), Denver (CO), Atlanta (GA), Phoenix (AZ), San Diego (CA), Nashville (TN), Raleigh (NC).

### Tier 3 — Long-Tail Metro Pipeline (36 Cities — Planned Capacity Up to 51 Total)
Houston (TX), San Antonio (TX), Orlando (FL), Tampa (FL), Charlotte (NC), Philadelphia (PA), Washington (DC), Minneapolis (MN), Detroit (MI), Columbus (OH), Cincinnati (OH), Cleveland (OH), Indianapolis (IN), Kansas City (MO), St. Louis (MO), Salt Lake City (UT), Portland (OR), Las Vegas (NV), Sacramento (CA), San Jose (CA), Pittsburgh (PA), Baltimore (MD), Richmond (VA), Virginia Beach (VA), Jacksonville (FL), Memphis (TN), Louisville (KY), Milwaukee (WI), Oklahoma City (OK), Tulsa (OK), Omaha (NE), Albuquerque (NM), Tucson (AZ), Boise (ID), Des Moines (IA), Providence (RI).

---

## 3. Mandatory Fact-Verification & Freshness Schema

Every published or pilot city record in `lib/geo/city-pilots.ts` enforces:
- `audience`: Who in this metro actually needs remote creative/technical work.
- `relevantServices`: 2–3 specific service hub links tailored to the local economy.
- `localInsights`: Structured practical blocks (business landscape, operational/automation opportunities, local context & time-zone overlap) — never generic filler.
- `sources`: Array of `{ label, publisher, url, checkedDate, reviewBy }` — any time-sensitive economic figure carries an explicit `reviewBy` date (6-month review cadence).
- `remoteDisclosure`: Explicit statement confirming zero local physical office and zero implied local clients.
- **Disqualification rule:** If a city lacks enough verified, differentiated content to be genuinely useful to a buyer in that city, it stays `NeedsEvidence` (not rendered in production, not indexed).

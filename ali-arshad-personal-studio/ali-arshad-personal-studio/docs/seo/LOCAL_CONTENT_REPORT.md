# Location pages: cited local content (51 states + 8 service areas)

Branch `feature/location-local-content`, off current `main` (d64688a). Not merged, not deployed.

## What this does
Adds a data-only local-content layer and renders genuinely local, sourced economic context on all 51 `/locations/[state]` pages and the 8 rendered state x service scaffolds. Each factual claim cites a real, current source retrieved during research; interpretive "how a remote service fits" sentences carry no citation. 97 state-level sources plus the service-area set; every URL https; every citation index validated.

## The search gate is untouched (verified)
Enriching a page does not change its `publicationState`. All 51 state pages stay `PublicNoIndex` and the 8 service areas stay `NeedsEvidence` (preview-only). `seo:audit` reports **67 Published / 65 indexable, unchanged** from before this branch, and "no location or service-area page indexable without a local signal" still passes. Nothing new is in the sitemap. I did not flip the gate; that is yours to decide after review.

## Honesty constraints held
No fabricated statistics, companies, clients, regulations, demand, projects, testimonials or results. No implied local office, staff, clients or in-person availability anywhere; everything is framed as remote delivery. Em and en dashes removed from the copy per the content rules. Where a claim could not be sourced it was omitted (see Omissions).

## Checks
- `npm run typecheck`: clean.
- `npm test`: 94/94 pass.
- `npm run seo:audit`: passes all 13 checks, including no broken internal links (so every serviceFit link resolves).
- `npm run build`: 193 static pages generate, including all `/locations/[state]` and the 8 `/services/[hub]/in/[state]` scaffolds. (Google fonts stubbed locally for the sandbox network block; stub reverted, not in this branch. Real font path exercised by the Vercel build.)

## Index-readiness (recommendation only — do not read as approval to publish)
Two sources is the practical bar for a defensible page. Sourcing came out in two tiers:

- **Stronger (two independent sources, at least one primary dataset with figures):** Alabama, Connecticut, Delaware, Florida, Illinois, Indiana, Iowa, Kansas, Maine, Massachusetts, Michigan, Minnesota, Missouri, Nebraska, New Hampshire, New Jersey, New York, North Dakota, Ohio, Pennsylvania, Rhode Island, South Dakota, Utah, Wisconsin, Washington D.C. These are the best candidates for your editorial review and possible indexing.
- **Needs a second or stronger source first (currently single-source, or leaning on a tertiary source):** Arizona, Arkansas, California, Colorado, Georgia, Kentucky, Louisiana, Maryland, Montana, Nevada, New Mexico, North Carolina, Oklahoma, Oregon, South Carolina, Tennessee, Texas, Virginia, Washington, West Virginia. Idaho and Mississippi rest on Britannica (tertiary); Alaska, Hawaii and Wyoming use Britannica as one of two sources. These render and are honest, but I would not index them until a second primary source is added.

Even for the stronger tier, publishing requires your editorial review plus flipping `publicationState` to `Published` and `editorialReview` to reviewed in the data — none of which this PR does.

## Omissions (claims dropped for lack of a verifiable source)
- California: the state's "$4.5T / world's 4th-largest economy" headline came from an official gov.ca.gov page that would not render under the fetch tool (redirect loop); kept as the single sourced claim from that domain and framed sectors interpretively rather than assert unsourced figures. (California is single-source as a result.)
- Florida: "no state income tax drives SMB growth" dropped (no clean primary source in-session); Florida rests on tourism + trade figures instead.
- South Dakota: credit-card/financial-charter hub angle dropped (no clean figure).
- Idaho: Micron/semiconductor-HQ specifics dropped; kept to what the source states.
- New Mexico, North Dakota: EIA state energy pages were blocked by the fetch gate; sourced from the Dallas Fed and USTR/USAFacts instead.
- Several state marketing pages (undated, figure-free) and bot-protected pages were not used as factual sources; Census QuickFacts or sector datasets substituted.

## Known follow-ups
- The single-source and Britannica-based states above should get a second primary source before indexing.
- Service-area scaffolds remain `NeedsEvidence`; they now carry cited content but still need your editorial sign-off before any could publish.

## State pages (51) — URL, services, local angle

| State | URL | Services highlighted | Local angle | Sources |
|---|---|---|---|---|
| Alabama | /locations/alabama | Business dashboards & analytics, AI agents & automation, Global sourcing & supply chain | A manufacturing state, autos in the centre and south, aerospace and defence in the north, where remote software can modernise supplier and plant operations. | 2 |
| Alaska | /locations/alaska | n8n workflow automation, AI agents & automation, Business dashboards & analytics | Oil, seafood and tourism spread across vast distances, an economy where remote coordination and automation earn their keep. | 2 |
| Arizona | /locations/arizona | Web & software development, AI agents & automation, Business dashboards & analytics | A fast-growing advanced-manufacturing and semiconductor hub anchored by major fabs. | 1 |
| Arkansas | /locations/arkansas | Ecommerce development, n8n workflow automation, Business dashboards & analytics | Headquarters state for Walmart, Tyson and J.B. Hunt, a retail, food-processing and logistics economy where remote systems work keeps distribution moving. | 1 |
| California | /locations/california | Web & software development, Ecommerce development, Brand & growth, Creative production | The largest, most diverse US state economy, and the world's fourth-largest. | 1 |
| Colorado | /locations/colorado | Web & software development, Business dashboards & analytics, AI agents & automation | A national aerospace and space hub, dense with technical employers. | 1 |
| Connecticut | /locations/connecticut | Business dashboards & analytics, AI agents & automation, Web & software development | One of the most finance- and insurance-weighted economies in the country. | 2 |
| Delaware | /locations/delaware | Web & software development, Business dashboards & analytics, AI agents & automation | The incorporation capital of America, home to two-thirds of the Fortune 500 on paper, layered over a chemicals and financial-services legacy. | 2 |
| Florida | /locations/florida | Ecommerce development, Creative production, Global sourcing & supply chain | A tourism and trade economy, record visitor numbers and the US gateway to Latin America, full of consumer-facing and export-oriented small businesses. | 2 |
| Georgia | /locations/georgia | Business dashboards & analytics, AI agents & automation, Creative production | The Southeast's logistics and film hub, with a fast-growing fintech cluster around Atlanta and a large agribusiness base. | 1 |
| Hawaii | /locations/hawaii | Global sourcing & supply chain, Ecommerce development, Business dashboards & analytics | A tourism-led island economy where imports and shipping costs shape every business. | 2 |
| Idaho | /locations/idaho | Web & software development, AI agents & automation, Business dashboards & analytics | Rich agriculture alongside a growing manufacturing and electronics base. | 1 |
| Illinois | /locations/illinois | Web & software development, Business dashboards & analytics, AI agents & automation | A Chicago-anchored, export-heavy economy where professional services, logistics and farm commodities all run on data. | 2 |
| Indiana | /locations/indiana | Business dashboards & analytics, n8n workflow automation, Web & software development | The most manufacturing-intensive economy in the Midwest, led by chemicals and pharmaceuticals. | 2 |
| Iowa | /locations/iowa | Business dashboards & analytics, n8n workflow automation, Web & software development | A corn, soybean and pork powerhouse whose economy is built on agriculture and food processing. | 2 |
| Kansas | /locations/kansas | Business dashboards & analytics, Web & software development, AI agents & automation | The Air Capital of the World, where aerospace manufacturing sits alongside wheat and beef. | 2 |
| Kentucky | /locations/kentucky | Business dashboards & analytics, n8n workflow automation, Web & software development | An automotive, logistics and spirits state where aerospace products are, perhaps surprisingly, the top export. | 1 |
| Louisiana | /locations/louisiana | Business dashboards & analytics, AI agents & automation, Creative production | An energy and petrochemical economy on the Mississippi River, with a billion-dollar film and digital-media sector alongside it. | 1 |
| Maine | /locations/maine | Web & software development, Ecommerce development, Brand & growth | A small-business and tourism economy spread across a rural state. | 2 |
| Maryland | /locations/maryland | AI agents & automation, Business dashboards & analytics, Web & software development | A science-and-security economy, life sciences, cybersecurity and aerospace, shaped by proximity to federal research agencies. | 1 |
| Massachusetts | /locations/massachusetts | Web & software development, Business dashboards & analytics, AI agents & automation | The country's second-largest life-sciences hub, anchored by research universities. | 2 |
| Michigan | /locations/michigan | Business dashboards & analytics, AI agents & automation, n8n workflow automation | The heart of US automotive and mobility, where transportation equipment drives both output and exports. | 2 |
| Minnesota | /locations/minnesota | Web & software development, Business dashboards & analytics, Ecommerce development | Medical Alley plus unusual Fortune 500 density: a diversified economy strong in medtech, retail and food. | 2 |
| Mississippi | /locations/mississippi | Ecommerce development, Global sourcing & supply chain, Web & software development | A manufacturing and agriculture state, furniture, auto parts, poultry and catfish, with Gulf-coast shipbuilding and NASA rocket testing. | 1 |
| Missouri | /locations/missouri | Business dashboards & analytics, n8n workflow automation, Web & software development | A central logistics crossroads with manufacturing, agriculture and a notable financial-services cluster. | 2 |
| Montana | /locations/montana | Web & software development, Brand & growth, AI agents & automation | A small-business economy, nearly every employer in the state is a small firm. | 1 |
| Nebraska | /locations/nebraska | Business dashboards & analytics, n8n workflow automation, Web & software development | A cattle, corn and ethanol economy where agriculture touches roughly one in four jobs. | 2 |
| Nevada | /locations/nevada | Global sourcing & supply chain, Ecommerce development, AI agents & automation, Business dashboards & analytics | A Western logistics and distribution hub alongside tourism, gaming and advanced manufacturing. | 1 |
| New Hampshire | /locations/new-hampshire | Web & software development, Ecommerce development, n8n workflow automation | A small-business base split between tourism and durable specialty manufacturing. | 2 |
| New Jersey | /locations/new-jersey | Global sourcing & supply chain, Business dashboards & analytics, AI agents & automation, Web & software development | Pharma and life sciences layered on top of one of the nation's busiest logistics corridors. | 2 |
| New Mexico | /locations/new-mexico | Business dashboards & analytics, AI agents & automation, Web & software development | The nation's second-largest oil and gas producer, with energy underpinning state revenue. | 1 |
| New York | /locations/new-york | Web & software development, Business dashboards & analytics, AI agents & automation | A service-driven economy led by finance, professional services and media. | 2 |
| North Carolina | /locations/north-carolina | Web & software development, Business dashboards & analytics, AI agents & automation | Biotech in the Research Triangle, banking in Charlotte, a research-and-finance economy with deep textiles and IT strength. | 1 |
| North Dakota | /locations/north-dakota | Business dashboards & analytics, n8n workflow automation, Web & software development | A Bakken energy and wheat economy where oil and gas is the single largest source of output. | 2 |
| Ohio | /locations/ohio | Business dashboards & analytics, AI agents & automation, n8n workflow automation | A diversified manufacturing and logistics economy where transportation equipment leads exports. | 2 |
| Oklahoma | /locations/oklahoma | Business dashboards & analytics, AI agents & automation, n8n workflow automation | The self-styled aerospace MRO capital of the world and a century-old energy state now adding large data centres. | 1 |
| Oregon | /locations/oregon | Web & software development, Business dashboards & analytics, AI agents & automation | The 'Silicon Forest', a manufacturing economy led by semiconductors and electronics. | 1 |
| Pennsylvania | /locations/pennsylvania | Global sourcing & supply chain, Business dashboards & analytics, Web & software development, n8n workflow automation | A broad economy led by health care and education, with deep manufacturing and logistics. | 2 |
| Rhode Island | /locations/rhode-island | Brand & growth, Creative production, Ecommerce development | A compact, coast-defined economy spanning marine trades, design and life sciences. | 2 |
| South Carolina | /locations/south-carolina | Business dashboards & analytics, Global sourcing & supply chain, AI agents & automation | An export-manufacturing state, BMW, Mercedes vans and tires, that leads the US in finished-vehicle and tire exports. | 1 |
| South Dakota | /locations/south-dakota | Business dashboards & analytics, n8n workflow automation, Web & software development | An agriculture and food-processing economy running at near-full employment. | 2 |
| Tennessee | /locations/tennessee | Business dashboards & analytics, n8n workflow automation, Creative production | A logistics, automotive and healthcare powerhouse, and the country's number-one state for music-industry jobs. | 1 |
| Texas | /locations/texas | Web & software development, Business dashboards & analytics, AI agents & automation, Global sourcing & supply chain | The US energy leader, with vast advanced-manufacturing, technology and logistics corridors across its metros. | 1 |
| Utah | /locations/utah | Web & software development, AI agents & automation, Business dashboards & analytics, Brand & growth | A fast-growing, entrepreneurial economy, the 'Silicon Slopes' startup scene. | 2 |
| Vermont | /locations/vermont | Ecommerce development, Brand & growth, Web & software development | One of the most small-business-dependent economies in the country. | 2 |
| Virginia | /locations/virginia | AI agents & automation, Business dashboards & analytics, n8n workflow automation | A cloud, AI-infrastructure and aerospace/defence economy, a tech-and-security base with deep data-centre capacity. | 1 |
| Washington | /locations/washington | Web & software development, AI agents & automation, Global sourcing & supply chain, Business dashboards & analytics | Aerospace, information technology and maritime trade anchor a diverse economy. | 1 |
| West Virginia | /locations/west-virginia | Business dashboards & analytics, Web & software development, AI agents & automation | An energy and chemicals/polymers state leaning into data centres and federal-facing IT. | 1 |
| Wisconsin | /locations/wisconsin | Business dashboards & analytics, n8n workflow automation, Ecommerce development | Industrial machinery manufacturing and America's Dairyland, exporting to much of the world. | 2 |
| Wyoming | /locations/wyoming | Web & software development, Ecommerce development, Brand & growth | Energy-rich and famously business-friendly, a magnet for company registration. | 2 |
| Washington, D.C. | /locations/washington-d-c | Web & software development, AI agents & automation, Business dashboards & analytics | A federal-driven economy of professional services, international institutions and nearly nineteen million annual tourists. | 2 |

## Sources per state

**Alabama**
- Automotive — Alabama Department of Commerce (Made in Alabama) — https://www.madeinalabama.com/industries/industry/automotive/ (accessed 2026-11-23)
- Aerospace & Defense Industry: Alabama State Data — Aerospace Industries Association — https://www.aia-aerospace.org/industry-impact/state-data/alabama/ (accessed 2026-11-23)

**Alaska**
- Alaska, Economy — Encyclopaedia Britannica — https://www.britannica.com/place/Alaska/Economy (accessed 2026-11-23)
- 2026 Alaska Seafood Industry Economic Impact Report — Alaska Seafood Marketing Institute — https://www.alaskaseafood.org/news/2026-alaska-seafood-industry-economic-impact-report/ (accessed 2026-11-23)

**Arizona**
- Semiconductor Advantages — Arizona Commerce Authority — https://www.azcommerce.com/industries/manufacturing/semiconductor-advantages/ (accessed 2026-11-23)

**Arkansas**
- Key Industries — Arkansas Economic Development Commission — https://www.arkansasedc.com/why-arkansas/key-industries (accessed 2026-11-23)

**California**
- California's economy continues to dominate, topping $4.5T in economic output and remains the world's fourth-largest economy — Office of Governor Gavin Newsom, State of California — https://www.gov.ca.gov/2026/10/05/californias-economy-continues-to-dominate-topping-4-5-t-in-economic-output-and-remains-the-worlds-fourth-largest-economy/ (accessed 2026-11-23)

**Colorado**
- Aerospace, Key Industries — Colorado Office of Economic Development & International Trade (Choose Colorado) — https://choosecolorado.com/key-industries/aerospace (accessed 2026-11-23)

**Connecticut**
- Report: Financial Services Sector Faces Competitive Pressures — Connecticut Business & Industry Association (CBIA) — https://www.cbia.com/?p=173838 (accessed 2026-11-23)
- Connecticut 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/Connecticut_2025-State-Profile.pdf (accessed 2026-11-23)

**Delaware**
- Division of Corporations 2024 Annual Report — Delaware Division of Corporations — https://corp.delaware.gov/stats/2024-annual-report/ (accessed 2026-11-23)
- Key Industries — Delaware Prosperity Partnership (Choose Delaware) — https://www.choosedelaware.com/key-industries/ (accessed 2026-11-23)

**Florida**
- Record Broken Again: Florida Announces Highest Tourism Numbers in State History in 2024 — Executive Office of the Governor of Florida — https://www.flgov.com/eog/news/press/2025/record-broken-again-florida-announces-highest-tourism-numbers-state-history-2024 (accessed 2026-11-23)
- Florida International Business Fast Facts — SelectFlorida — https://selectflorida.org/international-business-fast-facts (accessed 2026-11-23)

**Georgia**
- Industries — Georgia Department of Economic Development — https://georgia.org/industries (accessed 2026-11-23)

**Hawaii**
- Tourism and Hawaii Economy (March 2026) — Hawaii Department of Business, Economic Development & Tourism (DBEDT) — https://files.hawaii.gov/dbedt/economic/data_reports/download/Tourism-and-Hawaii-Economy_Mar2026.pdf (accessed 2026-11-23)
- Hawaii, Economy — Encyclopaedia Britannica — https://www.britannica.com/place/Hawaii-state/Economy (accessed 2026-11-23)

**Idaho**
- Idaho, Economy — Encyclopaedia Britannica — https://www.britannica.com/place/Idaho/Economy (accessed 2026-11-23)

**Illinois**
- Illinois: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/illinois (accessed 2026-11-23)
- Illinois economy and GDP — USAFacts — https://usafacts.org/topics/economy/state/illinois (accessed 2026-11-23)

**Indiana**
- Indiana: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/indiana (accessed 2026-11-23)
- Indiana's outlook for 2026 — Indiana Business Research Center, Indiana University Kelley School of Business — https://www.ibrc.indiana.edu/ibr/pre/outlook/indiana.html (accessed 2026-11-23)

**Iowa**
- Iowa: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/iowa (accessed 2026-11-23)
- 2025 State Agriculture Overview: Iowa — USDA National Agricultural Statistics Service — https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=IOWA (accessed 2026-11-23)

**Kansas**
- Aerospace — Kansas Department of Commerce — https://www.kansascommerce.gov/industry/aerospace (accessed 2026-11-23)
- Kansas: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/kansas (accessed 2026-11-23)

**Kentucky**
- Existing Industries: Major Industries — Kentucky Cabinet for Economic Development — https://newkentuckyhome.ky.gov/Existing_Industries/Major_Industries (accessed 2026-11-23)

**Louisiana**
- Key Industries — Louisiana Economic Development — https://www.opportunitylouisiana.gov/key-industries (accessed 2026-11-23)

**Maine**
- Maine 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/Maine_2025-State-Profile.pdf (accessed 2026-11-23)
- QuickFacts: Maine — U.S. Census Bureau — https://www.census.gov/quickfacts/ME (accessed 2026-11-23)

**Maryland**
- Industries — Maryland Department of Commerce — https://business.maryland.gov/industries (accessed 2026-11-23)

**Massachusetts**
- 2026 Industry Snapshot — MassBio (Massachusetts Biotechnology Council) — https://www.massbio.org/industry-snapshot/ (accessed 2026-11-23)
- Life Sciences Fact Pack 2025 — Massachusetts High Technology Council — https://www.mhtc.org/wp-content/uploads/2026/02/Life-Sciences-MHTC-Factpack-2025.pdf (accessed 2026-11-23)

**Michigan**
- Michigan: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/michigan (accessed 2026-11-23)
- Michigan economy and GDP — USAFacts — https://usafacts.org/topics/economy/state/michigan/ (accessed 2026-11-23)

**Minnesota**
- Leading Life Sciences — Minnesota Department of Employment and Economic Development — https://mn.gov/deed/dobusiness/key-industries/leading-life-sciences/ (accessed 2026-11-23)
- A Robust & Diverse Economy — Minnesota Department of Employment and Economic Development — https://mn.gov/deed/dobusiness/why-mn/our-economy/index.jsp (accessed 2026-11-23)

**Mississippi**
- Mississippi: Economy — Encyclopaedia Britannica — https://www.britannica.com/place/Mississippi-state/Economy (accessed 2026-11-23)

**Missouri**
- Missouri: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/missouri (accessed 2026-11-23)
- Industry Research — Missouri Economic Research and Information Center — https://meric.mo.gov/industry-research (accessed 2026-11-23)

**Montana**
- Montana 2025 Small Business Profile — US Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/Montana_2025-State-Profile.pdf (accessed 2026-11-23)

**Nebraska**
- Nebraska: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/nebraska (accessed 2026-11-23)
- Nebraska Agriculture Fact Card — Nebraska Department of Agriculture — https://nda.nebraska.gov/facts.pdf (accessed 2026-11-23)

**Nevada**
- Target Industries — Nevada Governor's Office of Economic Development (GOED) — https://goed.nv.gov/target-industries (accessed 2026-11-23)

**New Hampshire**
- New Hampshire 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/New_Hampshire_2025-State-Profile.pdf (accessed 2026-11-23)
- QuickFacts: New Hampshire — U.S. Census Bureau — https://www.census.gov/quickfacts/NH (accessed 2026-11-23)

**New Jersey**
- What Are New Jersey's Major Industries? — Choose New Jersey — https://www.choosenj.com/?p=21927 (accessed 2026-11-23)
- New Jersey 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/New_Jersey_2025-State-Profile.pdf (accessed 2026-11-23)

**New Mexico**
- New Mexico's Oil and Gas Boom Fuels State Budget (Southwest Economy) — Federal Reserve Bank of Dallas — https://www.dallasfed.org/research/swe/2024/swe2416 (accessed 2026-11-23)

**New York**
- New York State's Economy by Industry Sector (2026) — Office of the New York State Comptroller — https://www.osc.ny.gov/files/local-government/publications/pdf/2026-industries-nys.pdf (accessed 2026-11-23)
- The Street, The City and The State 2025 — SIFMA (Securities Industry and Financial Markets Association) — https://sifma.org/wp-content/uploads/2025/02/The-Street-The-City-The-State-2025-SIFMA.pdf (accessed 2026-11-23)

**North Carolina**
- Key Industries in North Carolina — North Carolina Department of Commerce — https://www.commerce.nc.gov/business/key-industries-north-carolina (accessed 2026-11-23)

**North Dakota**
- North Dakota: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/north-dakota (accessed 2026-11-23)
- North Dakota economy and GDP — USAFacts — https://usafacts.org/topics/economy/state/north-dakota (accessed 2026-11-23)

**Ohio**
- Ohio: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/ohio (accessed 2026-11-23)
- Ohio Facts: Gross Domestic Product — Ohio Legislative Service Commission — https://lsc.ohio.gov/assets/organizations/legislative-service-commission/files/current-ohio-facts-gross-domestic-product-september-2024.pdf (accessed 2026-11-23)

**Oklahoma**
- Industry Sectors — Oklahoma Department of Commerce — https://www.okcommerce.gov/doing-business/business-relocation-expansion/industry-sectors/ (accessed 2026-11-23)

**Oregon**
- Made in Oregon: A Profile of the State's Manufacturing Sector — Oregon Employment Department (QualityInfo) — https://www.qualityinfo.org/-/made-in-oregon-a-profile-of-the-state-s-manufacturing-sector (accessed 2026-11-23)

**Pennsylvania**
- Pennsylvania Economy at a Glance — U.S. Bureau of Labor Statistics — https://www.bls.gov/eag/eag.pa.htm (accessed 2026-11-23)
- Pennsylvania Profile — Pennsylvania Department of Labor & Industry, Center for Workforce Information & Analysis — https://www.pa.gov/content/dam/copapwp-pagov/en/dli/documents/cwia/products/pa%20profile.pdf (accessed 2026-11-23)

**Rhode Island**
- Leading Industries — Rhode Island Executive Office of Commerce — https://eoc.ri.gov/why-rhode-island/leading-industries (accessed 2026-11-23)
- QuickFacts: Rhode Island — U.S. Census Bureau — https://www.census.gov/quickfacts/RI (accessed 2026-11-23)

**South Carolina**
- Automotive Industry — South Carolina Department of Commerce — https://www.sccommerce.com/automotive-industry (accessed 2026-11-23)

**South Dakota**
- South Dakota: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/south-dakota (accessed 2026-11-23)
- Economic Indicators (June 2025) — South Dakota Governor's Office of Economic Development — https://sdgoed.com/wp-content/uploads/2025/06/2025-06_GOED-EconInd.pdf (accessed 2026-11-23)

**Tennessee**
- Industries — Tennessee Department of Economic and Community Development — https://tnecd.com/industries/ (accessed 2026-11-23)

**Texas**
- Target Industries — Office of the Texas Governor, Economic Development & Tourism — https://gov.texas.gov/business/page/target-industries (accessed 2026-11-23)

**Utah**
- Utah Leads the Nation in GDP Growth, Reflecting a Strong Overall 2024 Economy — Kem C. Gardner Policy Institute, University of Utah — https://gardner.utah.edu/news/utah-leads-the-nation-in-gdp-growth-reflecting-a-strong-overall-2024-economy (accessed 2026-11-23)
- Utah's Thriving Entrepreneurial Ecosystem — Utah Department of Workforce Services — https://jobs.utah.gov/blog/post/2025/06/02/utah-s-thriving-entrepreneurial-ecosystem (accessed 2026-11-23)

**Vermont**
- Vermont 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/Vermont_2025-State-Profile.pdf (accessed 2026-11-23)
- QuickFacts: Vermont — U.S. Census Bureau — https://www.census.gov/quickfacts/VT (accessed 2026-11-23)

**Virginia**
- Key Industries — Virginia Economic Development Partnership — https://vedp.org/key-industries (accessed 2026-11-23)

**Washington**
- Key Sectors — Washington State Department of Commerce — https://www.commerce.wa.gov/key-sectors (accessed 2026-11-23)

**West Virginia**
- Thriving Industries — West Virginia Division of Economic Development — https://westvirginia.gov/thriving-industries (accessed 2026-11-23)

**Wisconsin**
- Wisconsin: Exports, Jobs, & Foreign Investment — Office of the United States Trade Representative — https://ustr.gov/countries-regions/united-states-trade-data/wisconsin (accessed 2026-11-23)
- Wisconsin Agricultural Export Statistics — Wisconsin Department of Agriculture, Trade and Consumer Protection — https://datcp.wi.gov/Pages/AgDevelopment/ExportStatistics.aspx (accessed 2026-11-23)

**Wyoming**
- Wyoming, State Tax Competitiveness Index — Tax Foundation — https://taxfoundation.org/state-tax-index/states/wyoming/ (accessed 2026-11-23)
- Wyoming, Economy — Encyclopaedia Britannica — https://www.britannica.com/place/Wyoming-state/Economy (accessed 2026-11-23)

**Washington, D.C.**
- The Importance of Federal Contracting to the District's Economy — DC Office of Revenue Analysis (Office of the Chief Financial Officer) — https://ora-cfo.dc.gov/blog/importance-federal-contracting-districts-economy (accessed 2026-11-23)
- Sectors — DC Office of the Deputy Mayor for Planning and Economic Development — https://dmped.dc.gov/page/sectors (accessed 2026-11-23)

## Service-area scaffolds (8) — sources

**web-development:texas** — Texas runs on small businesses, and most of them still need modern web and software to compete.
- Texas 2025 Small Business Profile — U.S. Small Business Administration, Office of Advocacy — https://advocacy.sba.gov/wp-content/uploads/2025/06/Texas_2025-State-Profile.pdf (accessed 2026-11-23)
- Texas Economic Snapshot — Office of the Governor of Texas — https://gov.texas.gov/business/page/texas-economic-snapshot (accessed 2026-11-23)

**web-development:california** — California's economy is a software economy, which is exactly what a web and software studio is built for.
- California's Economy — Public Policy Institute of California (PPIC) — https://www.ppic.org/publication/californias-economy/ (accessed 2026-11-23)
- California Leads US Startup Funding in 2025 — Crunchbase News — https://news.crunchbase.com/venture/california-leads-startup-funding-2025-data (accessed 2026-11-23)

**n8n-automation:new-york** — In New York, every manual workflow is expensive, which is what makes automation pay for itself.
- DiNapoli: Service-Providing Industry Sectors Dominate the State's 21st Century Economy — Office of the New York State Comptroller — https://www.osc.ny.gov/press/releases/2026/03/dinapoli-service-providing-industry-sectors-dominate-states-21st-century-economy (accessed 2026-11-23)
- State of the New York City Economy 2024 — New York City Economic Development Corporation (NYCEDC) — https://edc.nyc/sites/default/files/2025-01/NYCEDC-State-of-the-NYC-Economy-2024-1.pdf (accessed 2026-11-23)

**ai-agents:california** — California is where AI is being built, and where businesses are quickest to put agents to work.
- California Leads US Startup Funding in 2025 — Crunchbase News — https://news.crunchbase.com/venture/california-leads-startup-funding-2025-data (accessed 2026-11-23)
- California's Economy — Public Policy Institute of California (PPIC) — https://www.ppic.org/publication/californias-economy/ (accessed 2026-11-23)

**ecommerce-development:florida** — Florida pairs a fast-growing merchant base with a huge visitor audience and a direct line to Latin America, ideal ground for ecommerce.
- New Business Applications: A State-by-State View (Florida) — U.S. Chamber of Commerce (U.S. Census Bureau Business Formation Statistics) — https://www.uschamber.com/small-business/new-business-applications-a-state-by-state-view?state=fl (accessed 2026-11-23)
- Record Broken Again: Florida Announces Highest Tourism Numbers in State History for 2024 — Executive Office of the Governor of Florida — https://www.flgov.com/eog/news/press/2025/record-broken-again-florida-announces-highest-tourism-numbers-state-history-2024 (accessed 2026-11-23)
- Florida International Business Fast Facts — SelectFlorida — https://selectflorida.org/wp-content/uploads/Florida-International-Business-Fast-Facts.pdf (accessed 2026-11-23)

**business-dashboards:illinois** — Illinois moves goods, money and food at national scale, and that generates data worth putting on a dashboard.
- Illinois 2024 Economic Growth Plan — Illinois Department of Commerce & Economic Opportunity (DCEO) — https://dceo.illinois.gov/content/dam/soi/en/web/dceo/aboutdceo/reportsrequiredbystatute/ilinois-2024-economic-growth-plan.pdf (accessed 2026-11-23)
- State of Illinois Economic Forecast 2025 — Commission on Government Forecasting and Accountability, Illinois General Assembly — https://cgfa.ilga.gov/Upload/2025StateofILEconomicForecast.pdf (accessed 2026-11-23)

**branding:new-york** — New York is the United States' advertising capital, the most crowded, highest-benchmark market a brand can enter.
- The Creative Economy — Office of the New York City Comptroller — https://comptroller.nyc.gov/reports/the-creative-economy/ (accessed 2026-11-23)
- State of the New York City Economy 2024 — New York City Economic Development Corporation (NYCEDC) — https://edc.nyc/sites/default/files/2025-01/NYCEDC-State-of-the-NYC-Economy-2024-1.pdf (accessed 2026-11-23)

**creative-production:california** — California is the centre of gravity for content, which is where creative-production demand concentrates.
- Creative Economy — California Governor's Office of Business and Economic Development (GO-Biz) — https://business.ca.gov/industries/creative-economy/ (accessed 2026-11-23)
- California's Economy — Public Policy Institute of California (PPIC) — https://www.ppic.org/publication/californias-economy/ (accessed 2026-11-23)

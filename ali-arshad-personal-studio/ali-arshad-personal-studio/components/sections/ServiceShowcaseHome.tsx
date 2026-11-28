import Link from "next/link";
import { ScrollStoryRail, type ScrollStoryStep } from "@/components/motion/ScrollStoryRail";
import { Icon } from "@/components/ui/Icon";
import { SERVICES } from "@/lib/services";
import { BUSINESS_PILLARS } from "@/lib/seo/service-areas";
import { SOURCING_CATALOG_STATS } from "@/lib/sourcing-catalog";

const STUDIO_ARC_STEPS: ScrollStoryStep[] = [
  {
    step: "01",
    label: "Create & Position",
    title: "Brand clarity, video editing & 3D visuals",
    detail:
      "Tight messaging, short-form and long-form video edits, motion graphics, and Blender 3D product visuals built so prospects grasp value immediately.",
    href: "/services/creative-production",
    linkLabel: "Explore 12 playable videos",
  },
  {
    step: "02",
    label: "Engineer & Ship",
    title: "Custom Next.js web apps & interactive tools",
    detail:
      "Fast, type-safe Next.js/React applications, internal dashboards, and client-owned repositories with live sandboxes you can test before kickoff.",
    href: "/services/web-development",
    linkLabel: "Inspect web engineering",
  },
  {
    step: "03",
    label: "Automate & Coordinate",
    title: "n8n workflows, AI agents & product sourcing",
    detail:
      "Self-hostable automation pipelines, grounded AI workflows, quote-led GPU compute, and catalog-backed OEM product sourcing coordination.",
    href: "/services/product-sourcing/catalog",
    linkLabel: `Browse ${SOURCING_CATALOG_STATS.totalUniqueProducts.toLocaleString()} catalog models`,
  },
];

/**
 * Deep-link each pillar to its most detailed destination: the dedicated service
 * hub page when one exists, the Studio Network for partner-delivered work, and
 * the services overview anchor as a final fallback. One source of truth, so the
 * card and the destination never drift.
 */
function serviceHref(id: string): string {
  const pillar = BUSINESS_PILLARS.find((p) => p.pillarId === id);
  if (pillar?.hubSlugs[0]) return `/services/${pillar.hubSlugs[0]}`;
  if (id === "specialist-collaboration") return "/studio-network";
  return `/services#${id}`;
}

/**
 * The six services as an editorial card grid.
 *
 * Each card carries the benefit line rather than the capability list; the
 * full detail lives on /services, which each card links into by anchor.
 * Partner-delivered services keep their label here, as everywhere else.
 */
export function ServiceShowcaseHome() {
  return (
    <section className="section" aria-labelledby="home-services-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Studio approach &amp; services</p>
            <h2 className="section-title" id="home-services-title">
              Agency polish, independent execution
            </h2>
          </div>
          <p className="section-sub section-sub--inline">
            Six ways to work together, with one direct point of contact across creative, technical and commercial work. I shape and deliver the core work myself, bringing in independent specialists only when a project needs extra depth or capacity.
          </p>
        </div>

        <ScrollStoryRail
          id="studio-delivery-arc"
          eyebrow="How the disciplines connect"
          heading="One continuous studio arc — zero agency hand-offs"
          lead="Scroll through the three stages that connect creative presentation, production software, and operational execution."
          steps={STUDIO_ARC_STEPS}
        />

        <ul className="svc-grid" style={{ marginTop: "28px" }}>
          {SERVICES.map((s, i) => (
            <li key={s.id} className="svc-card reveal">
              <Link href={serviceHref(s.id)} className="svc-card__link">
                <span className="svc-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={s.icon} size={26} className="svc-card__icon" />
                <span className="svc-card__title">{s.shortTitle}</span>
                <span className="svc-card__text">{s.positioning}</span>
                {s.partnerDelivered ? <span className="svc-card__flag">With partners</span> : null}
                <span className="svc-card__go" aria-hidden="true">
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="panel home-directory-strip reveal" aria-label="Explore studio sections">
          <div>
            <p className="eyebrow eyebrow--plain">Navigate the studio</p>
            <p className="section-sub" style={{ marginTop: "4px" }}>
              Jump straight to service comparisons, interactive product demos, free calculators, technical guides, or remote US coverage.
            </p>
          </div>
          <div className="location-pill-list">
            <Link href="/services/product-sourcing/catalog" className="location-pill location-pill--all">
              Product Catalogue ({SOURCING_CATALOG_STATS.totalUniqueProducts.toLocaleString()} Models) →
            </Link>
            <Link href="/services/creative-production#motion-examples" className="location-pill location-pill--all">
              Video Portfolio (12 Clips) →
            </Link>
            <Link href="/services/creative-production#creative-demonstrations" className="location-pill location-pill--all">
              Photoshop, Illustrator &amp; NFT Demos →
            </Link>
            <Link href="/services/gpu-compute" className="location-pill">
              GPU &amp; Compute Hub
            </Link>
            <Link href="/services/product-sourcing" className="location-pill location-pill--all">
              Product Sourcing Hub →
            </Link>
            <Link href="/services/social-media-management" className="location-pill location-pill--all">
              Social Media Setup →
            </Link>
            <Link href="/services/linkedin-outreach" className="location-pill location-pill--all">
              LinkedIn Outreach →
            </Link>
            <Link href="/services#compare-services" className="location-pill">
              Compare All Services
            </Link>
            <Link href="/tools" className="location-pill">
              12 Free Calculators &amp; Live FX
            </Link>
            <Link href="/work" className="location-pill">
              Work &amp; Case Studies
            </Link>
            <Link href="/products" className="location-pill">
              Live SaaS Product Demos
            </Link>
            <Link href="/studio-network" className="location-pill">
              Studio Network
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

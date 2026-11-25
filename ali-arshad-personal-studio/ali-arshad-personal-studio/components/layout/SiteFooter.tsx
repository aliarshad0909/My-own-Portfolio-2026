import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { FREELANCE, SITE, activeSocials } from "@/lib/site";

const STUDIO_LINKS = [
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
  { label: "Case Studies", href: "/case-studies" },
];

const SERVICE_LINKS = [
  { label: "Creative Production", href: "/services/creative-production" },
  { label: "Video Editing & Motion Graphics", href: "/services/creative-production/video-editing" },
  { label: "Web Development", href: "/services/web-development" },
  { label: "AI Agents", href: "/services/ai-agents" },
  { label: "n8n Automation", href: "/services/n8n-automation" },
  { label: "RTX GPU Compute", href: "/services/gpu-compute" },
  { label: "Branding & Growth", href: "/services/branding" },
  { label: "Sourcing & Supply Chain", href: "/services/global-sourcing" },
];

export function SiteFooter() {
  const socials = activeSocials();
  const fiverrUrl = FREELANCE.fiverr.url;

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand-col">
          <Link href="/" className="brand brand--footer" aria-label={`${SITE.name}, ${SITE.descriptor}, home`}>
            <BrandMark size={32} />
            <span className="brand__stack">
              <span className="brand__name brand__name--caps">{SITE.brandMarkText}</span>
              <span className="brand__descriptor">{SITE.descriptor}</span>
            </span>
          </Link>
          <p className="site-footer__summary">
            Creative production, software development, AI automation and business strategy — all in one personal studio.
          </p>
        </div>

        <nav className="site-footer__col" aria-label="The Studio">
          <h2 className="site-footer__heading">The Studio</h2>
          <ul className="site-footer__links">
            {STUDIO_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__col" aria-label="Services">
          <h2 className="site-footer__heading">Services</h2>
          <ul className="site-footer__links">
            {SERVICE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__col" aria-label="Explore">
          <h2 className="site-footer__heading">Explore</h2>
          <ul className="site-footer__links">
            <li>
              <Link href="/work">Portfolio / Work</Link>
            </li>
            <li>
              <Link href="/project-planner">Visual Project Planner</Link>
            </li>
            <li>
              <Link href="/products">Product Directory</Link>
            </li>
            <li>
              <Link href="/games">Games &amp; Experiments</Link>
            </li>
            <li>
              <Link href="/blog">Studio Blog</Link>
            </li>
            <li>
              <Link href="/tools">Calculator Centre</Link>
            </li>
            <li>
              <Link href="/resources">Resources</Link>
            </li>
            <li>
              <a
                href={FREELANCE.upwork.url}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer__ext"
                aria-label="Upwork profile (opens in a new tab)"
              >
                <span>Upwork</span>
                <Icon name="arrow-up-right" size={14} />
              </a>
            </li>
            {fiverrUrl ? (
              <li>
                <a
                  href={fiverrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__ext"
                  aria-label="Fiverr profile (opens in a new tab)"
                >
                  <span>Fiverr</span>
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>

      <div className="container site-footer__bar">
        <div className="site-footer__socials">
          <span className="site-footer__social-label">Connect</span>
          {socials.length > 0 ? (
            <ul className="social-list" aria-label="Social profiles">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
                    <Icon name={s.icon} size={20} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Link href="/contact" className="btn btn--primary btn--sm site-footer__cta">
          <span>Start a Project</span>
          <Icon name="arrow-up-right" size={16} className="btn__icon" />
        </Link>
      </div>

      <div className="container site-footer__explore" aria-label="Additional studio directories">
        <span className="site-footer__explore-label">Directory</span>
        <Link href="/services/ecommerce-development">Ecommerce</Link>
        <Link href="/services/business-dashboards">Dashboards</Link>
        <Link href="/industries">Industries</Link>
        <Link href="/locations">US Coverage</Link>
        <Link href="/studio-network">Studio Network</Link>
        <Link href="/privacy">Privacy</Link>
      </div>

      <div className="container site-footer__base">
        <p>© 2026 Ali Arshad — Personal Studio.</p>
        <p>{SITE.tagline}</p>
      </div>
    </footer>
  );
}

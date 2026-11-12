import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, SITE, activeSocials } from "@/lib/site";

export function SiteFooter() {
  const socials = activeSocials();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Link href="/" className="brand brand--footer" aria-label={`${SITE.name} — ${SITE.descriptor}, home`}>
          <BrandMark size={34} />
          <span className="brand__stack">
            <span className="brand__name">{SITE.name}</span>
            <span className="brand__descriptor">{SITE.descriptor}</span>
          </span>
        </Link>

        <nav aria-label="Footer">
          <ul className="site-footer__nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

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
        ) : (
          <Link href="/contact" className="arrow-link">
            <span>Start a project</span>
            <Icon name="arrow-right" size={18} />
          </Link>
        )}
      </div>
      <div className="container site-footer__base">
        <p>
          © {year} {SITE.name}. {SITE.positioning}.
        </p>
        <p>{SITE.tagline}</p>
      </div>
    </footer>
  );
}

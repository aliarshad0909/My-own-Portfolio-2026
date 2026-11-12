import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EXPERTISE, TOOLS } from "@/lib/expertise";
import { SERVICES } from "@/lib/services";

export function ToolGrid() {
  return (
    <ul className="tool-grid">
      {TOOLS.map((t) => (
        <li key={t.name} className={`tool tool--${t.group.toLowerCase()}`}>
          <span className="tool__mark" aria-hidden="true">
            {t.mark}
          </span>
          <span className="tool__name">{t.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExpertiseList() {
  return (
    <ul className="expertise-list">
      {EXPERTISE.map((e) => (
        <li key={e.discipline} className="expertise">
          <h3 className="expertise__title">{e.discipline}</h3>
          <p className="expertise__text">{e.description}</p>
          <ul className="expertise__tools" aria-label={`${e.discipline} tools and focus areas`}>
            {e.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function StudioDashboard() {
  const services = SERVICES.filter((s) => s.featured);
  return (
    <section className="section section--tight" aria-label="Studio overview">
      <div className="container dashboard">
        <div className="panel reveal">
          <h2 className="section-title section-title--sm">Services</h2>
          <p className="section-sub">Connected creative and technical solutions for modern businesses.</p>
          <ul className="service-list">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/services#${s.id}`} className="service-row">
                  <Icon name={s.icon} size={22} className="service-row__icon" />
                  <span className="service-row__text">
                    <strong>{s.shortTitle}</strong>
                    <small>{s.summary}</small>
                  </span>
                  <Icon name="arrow-right" size={18} className="service-row__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel reveal">
          <h2 className="section-title section-title--sm">Expertise</h2>
          <p className="section-sub">Skills developed through creative, business, and technical work.</p>
          <ExpertiseList />
        </div>

        <div className="panel reveal">
          <h2 className="section-title section-title--sm">Tools &amp; Technologies</h2>
          <p className="section-sub">What I use to design, build and ship.</p>
          <ToolGrid />
        </div>
      </div>
    </section>
  );
}

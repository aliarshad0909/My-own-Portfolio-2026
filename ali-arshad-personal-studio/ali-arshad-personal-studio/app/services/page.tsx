import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Creative production, web and software development, AI agents and automation, brand management, global sourcing and specialist technical collaboration from Ali Arshad's independent studio.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            Agency-level services, <span className="accent">delivered personally</span>
          </>
        }
        lead="Six connected service areas. Take one on its own, or combine them into a single project with one person responsible from start to finish."
      >
        <nav aria-label="Service areas" className="jump-nav">
          <ul>
            {SERVICES.map((s) => (
              <li key={s.id}>
                <Link href={`#${s.id}`} className="filter-chip">
                  {s.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <section className="section section--flush-top" aria-label="Service areas">
        <div className="container service-stack">
          {SERVICES.map((s, i) => (
            <article key={s.id} id={s.id} className="panel panel--lg service reveal" aria-labelledby={`${s.id}-title`}>
              <header className="service__head">
                <span className="service__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={s.icon} size={28} className="service__icon" />
                <div>
                  <h2 className="section-title section-title--sm" id={`${s.id}-title`}>
                    {s.title}
                  </h2>
                  {s.partnerDelivered ? <span className="badge badge--partner">Delivered with partners</span> : null}
                </div>
              </header>

              <div className="service__body">
                <div className="service__main">
                  <p className="service__desc">{s.description}</p>
                  {s.note ? (
                    <p className="notice">
                      <Icon name="alert" size={18} />
                      <span>{s.note}</span>
                    </p>
                  ) : null}
                  <ButtonLink href={`/contact?service=${encodeURIComponent(s.title)}`} variant="secondary">
                    Discuss a project
                  </ButtonLink>
                </div>

                <div className="service__col">
                  <h3 className="label">Capabilities</h3>
                  <ul className="check-list">
                    {s.capabilities.map((c) => (
                      <li key={c}>
                        <Icon name="check" size={16} />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="service__col">
                  <h3 className="label">A good fit for</h3>
                  <ul className="plain-list">
                    {s.clients.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <h3 className="label label--spaced">Example projects</h3>
                  <ul className="plain-list">
                    {s.examples.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
          <p className="fine-print">
            Example projects describe typical scopes, not past client work. Every project is quoted individually after a conversation about goals, scope and timeline.
          </p>
        </div>
      </section>

      <ContactCTA standalone title="Not sure which service you need?" text="Describe the outcome you're after and I'll suggest the simplest way to get there — even if that means a smaller project than you expected." button="Start a conversation" />
    </>
  );
}

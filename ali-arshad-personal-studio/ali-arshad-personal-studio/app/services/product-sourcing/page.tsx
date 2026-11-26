import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { InteractiveTiltCard } from "@/components/ui/InteractiveTiltCard";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import {
  INCOTERMS_TABLE,
  PRODUCT_SOURCING_CONTACT_SERVICE,
  PRODUCT_SOURCING_PATH,
  SOURCING_CATEGORIES,
  SOURCING_OVERVIEW_FAQS,
  SOURCING_SUBPAGES,
  SOURCING_TOOLS,
  SOURCING_WORKFLOW,
} from "@/lib/sourcing";
import { singleServiceSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Product Sourcing & Supply Chain Coordination — Ali Arshad Personal Studio",
  description:
    "Practical product sourcing coordination across luggage, toys, LED lighting, electronics, appliances, and household goods: supplier shortlisting, samples, quality checks, packing prep, and Incoterms modeling.",
  path: PRODUCT_SOURCING_PATH,
});

export default function ProductSourcingPage() {
  const contactHref = `/contact?service=${encodeURIComponent(PRODUCT_SOURCING_CONTACT_SERVICE)}`;

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: "Product Sourcing & Supply Chain Coordination",
          description:
            "End-to-end sourcing coordination grounded in supply chain management: requirements, supplier quotations, sample evaluation, quality checks, packing prep, and freight/Incoterms clarity.",
          path: PRODUCT_SOURCING_PATH,
          serviceType: "Product Sourcing & Procurement Coordination",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Product Sourcing", path: PRODUCT_SOURCING_PATH },
        ]}
      />

      <PageHero
        eyebrow="Product Sourcing · Supply Chain Coordination"
        title={
          <>
            Product sourcing &amp; supplier coordination, <span className="accent">grounded in real numbers</span>
          </>
        }
        lead="From initial product brief and like-for-like supplier quotations to sample inspection, quality checks, export packing, and honest Incoterms modeling — coordinated directly with one accountable point of contact."
        aside={
          <EditorialMedia
            src="/images/services/sourcing-sample-inspection.jpg"
            alt="Quality specialist inspecting a matte dark hard-shell polycarbonate suitcase sample on an industrial workbench with calipers and checklist"
            badge="Illustrative editorial photo"
            caption="Structured physical evaluation and clear supplier comparison before bulk order approval."
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Request a sourcing quote</ButtonLink>
          <ButtonLink href="/tools/landed-cost-calculator" variant="secondary" icon={null}>
            Open Landed Cost Calculator
          </ButtonLink>
          <ButtonLink href={`${PRODUCT_SOURCING_PATH}/categories`} variant="secondary" icon={null}>
            Explore categories
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Sourcing honesty notice">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Transparent coordination scope:</strong> Ali Arshad Personal Studio coordinates supplier research, quotations, samples, QC
            checkpoints, and freight comparisons. We do not claim factory ownership, guaranteed lowest prices, or universal DDP — exact MOQs,
            compliance certificates, duties, and freight options depend on your product, destination country, and licensed forwarders/brokers.
          </span>
        </p>
      </section>

      {/* Selective 3D Interactive 7-Stage Sourcing Workflow */}
      <section className="section section--tight" aria-labelledby="sourcing-workflow-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Seven-stage sourcing workflow</p>
            <h2 className="section-title" id="sourcing-workflow-title">
              Every stage clearly gated by quotes and customer approval
            </h2>
            <p className="section-sub">
              Nothing moves into paid samples, bulk manufacturing, or freight booking without your written sign-off on verified terms.
            </p>
          </div>

          <InteractiveTiltCard label="Seven-stage sourcing coordination flow">
            <ol className="sourcing-flow-grid">
              {SOURCING_WORKFLOW.map((stage) => (
                <li key={stage.step} className="sourcing-flow-step">
                  <div className="sourcing-flow-step__top">
                    <span className="hub-process__num">{stage.step}</span>
                    <span className="badge badge--demo">{stage.gate}</span>
                  </div>
                  <h3 className="sourcing-flow-step__title">{stage.label}</h3>
                  <p className="sourcing-flow-step__detail">{stage.detail}</p>
                </li>
              ))}
            </ol>
          </InteractiveTiltCard>
        </div>
      </section>

      {/* Supported Non-Jewelry Categories */}
      <section className="section section--surface" aria-labelledby="sourcing-cats-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Target non-jewelry product categories</p>
            <h2 className="section-title" id="sourcing-cats-title">
              Categories with practical sourcing paths
            </h2>
            <p className="section-sub">
              Distinguishing categories backed by existing reference specification checklists from categories scoped through fresh custom supplier
              research.
            </p>
          </div>

          <div className="card-grid card-grid--3">
            {SOURCING_CATEGORIES.map((cat) => (
              <article key={cat.id} className="panel feature-card">
                <span className={`badge ${cat.pathType === "Reference catalog experience" ? "badge--verified" : "badge--demo"}`}>
                  {cat.pathType}
                </span>
                <h3 className="card-title">{cat.name}</h3>
                <p>{cat.summary}</p>
                <ul className="check-list" style={{ marginTop: "6px" }}>
                  {cat.typicalChecks.map((chk) => (
                    <li key={chk}>
                      <Icon name="check" size={15} />
                      <span>{chk}</span>
                    </li>
                  ))}
                </ul>
                <p className="fine-print" style={{ marginTop: "auto", paddingTop: "8px" }}>
                  {cat.caveat}
                </p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: "22px" }}>
            <Link href={`${PRODUCT_SOURCING_PATH}/categories`} className="arrow-link">
              <span>Inspect full category discovery details</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 8 Focused Sourcing Subpages */}
      <section className="section" aria-labelledby="sourcing-guides-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Deep-dive sourcing pages</p>
            <h2 className="section-title" id="sourcing-guides-title">
              Explore every stage of sourcing, QC, packing, and shipping
            </h2>
          </div>

          <ul className="hub-card-grid">
            {SOURCING_SUBPAGES.map((sub, i) => (
              <li key={sub.slug}>
                <Link href={`${PRODUCT_SOURCING_PATH}/${sub.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">{String(i + 1).padStart(2, "0")} · Sourcing Guide</span>
                  <span className="hub-link-card__title">
                    <span>{sub.navLabel}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{sub.lead}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Documentary Visual Gallery: Lighting/Electronics + Warehouse Packing + Freight */}
      <section className="section section--surface section--tight" aria-labelledby="sourcing-visuals-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">From workbench to port handoff</p>
            <h2 className="section-title section-title--sm" id="sourcing-visuals-title">
              Evaluation, export carton prep, and international freight clarity
            </h2>
          </div>

          <div className="card-grid card-grid--3">
            <EditorialMedia
              src="/images/services/sourcing-lighting-electronics.jpg"
              alt="Architectural LED downlights, track fixtures, and consumer electronics components arranged on an inspection workbench"
              badge="Illustrative editorial photo"
              caption="Technical and physical sample review across lighting, luggage, toys, and consumer hardware."
            />
            <EditorialMedia
              src="/images/services/sourcing-warehouse-packing.jpg"
              alt="Clean export fulfillment warehouse with neatly stacked master cartons on wooden pallets and shipping label station"
              badge="Illustrative editorial photo"
              caption="Export carton packing specs, shipping marks, and verified CBM dimensions prior to dispatch."
            />
            <EditorialMedia
              src="/images/services/sourcing-freight-logistics.jpg"
              alt="Twilight documentary photograph of intermodal shipping containers and air-freight cargo pallets at a modern port terminal"
              badge="Illustrative editorial photo"
              caption="Clear Incoterms (EXW, FOB, CIF, DAP, DDP where feasible) coordinated with licensed forwarders."
            />
          </div>
        </div>
      </section>

      {/* Quick Incoterms Preview + Planning Calculators */}
      <section className="section" aria-labelledby="sourcing-tools-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Interactive sourcing calculators &amp; live FX</p>
            <h2 className="section-title" id="sourcing-tools-title">
              Model your landed cost, MOQ, carton CBM, and USD/CNY rates
            </h2>
            <p className="section-sub">
              All tools run transparently in your browser with unit-tested formulas and clearly labeled planning caveats — zero email gates.
            </p>
          </div>

          <ul className="hub-card-grid">
            {SOURCING_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="hub-link-card">
                  <span className="hub-link-card__kind">Planning Calculator</span>
                  <span className="hub-link-card__title">
                    <span>{tool.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="panel" style={{ marginTop: "28px" }}>
            <div className="panel__head">
              <div>
                <p className="eyebrow eyebrow--plain">Incoterms snapshot</p>
                <h3 className="card-title">Understanding EXW, FOB, CIF, DAP &amp; DDP before comparing quotes</h3>
              </div>
              <Link href={`${PRODUCT_SOURCING_PATH}/freight-incoterms`} className="arrow-link">
                <span>Full Freight &amp; Incoterms Guide</span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
            <div className="decision-table-wrap">
              <table className="decision-table">
                <thead>
                  <tr>
                    <th scope="col">Term</th>
                    <th scope="col">Seller handles</th>
                    <th scope="col">Buyer handles</th>
                    <th scope="col">Practical caveat</th>
                  </tr>
                </thead>
                <tbody>
                  {INCOTERMS_TABLE.map((row) => (
                    <tr key={row.term}>
                      <th scope="row">
                        {row.term} <small className="muted" style={{ display: "block", fontWeight: 400 }}>{row.fullName}</small>
                      </th>
                      <td>{row.sellerHandles}</td>
                      <td>{row.buyerHandles}</td>
                      <td>{row.practicalNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Faq
        id="faq-product-sourcing"
        eyebrow="Common questions"
        title="Product sourcing: practical questions"
        items={SOURCING_OVERVIEW_FAQS}
        surface
      />

      <ContactCTA
        standalone
        eyebrow="Start a sourcing inquiry"
        title="Need fresh supplier quotes, sample checks, or landed-cost clarity?"
        text="Share your product requirements, destination market, and rough target quantity. We will confirm feasibility honestly and outline clear next steps."
        button="Request a sourcing quote"
        href={contactHref}
        secondaryHref="/tools/landed-cost-calculator"
        secondaryLabel="Estimate Landed Cost First"
      />
    </>
  );
}

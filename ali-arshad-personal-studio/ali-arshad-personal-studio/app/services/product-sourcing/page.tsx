import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { SourcingCatalogShowcase } from "@/components/sourcing/SourcingCatalogShowcase";
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
  SOURCING_RESPONSIBILITY_SPLIT,
  SOURCING_SUBPAGES,
  SOURCING_TOOLS,
  SOURCING_WORKFLOW,
} from "@/lib/sourcing";
import { MASTER_CATALOG_PDF_PATH, SOURCING_CATALOG_PATH, SOURCING_CATALOG_STATS } from "@/lib/sourcing-catalog";
import { singleServiceSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Product Sourcing & Supply Chain Coordination",
  description:
    "Catalog-backed product sourcing across kitchen appliances, hard-shell luggage, mobile accessories, LED lighting, and toys — backed by a BBA in Supply Chain Management and 10+ years of sourcing experience.",
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
            "End-to-end sourcing coordination grounded in a BBA in Supply Chain Management and 10+ years of sourcing experience: supplier research, comparable quotes, sample evaluation, quality checkpoints, packing prep, and Incoterms clarity.",
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
        eyebrow="Product Sourcing · BBA in Supply Chain · 10+ Years Experience"
        title={
          <>
            Product sourcing &amp; supplier coordination, <span className="accent">grounded in real numbers</span>
          </>
        }
        lead="From initial product brief and comparable supplier quotations to sample evaluation, agreed quality checks, export packing, and honest Incoterms modeling — led directly by Ali Arshad."
        aside={
          <EditorialMedia
            src="/images/sourcing-catalog/luggage-collection.webp"
            alt="Multi-color hard-shell PP and polycarbonate spinner suitcases from curated OEM sourcing reference catalog"
            badge="Catalog reference · OEM product"
            caption="Curated non-confidential examples across appliances, luggage, mobile accessories, LED lighting, and toys — zero supplier contacts or raw quotes published."
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Request a sourcing quote</ButtonLink>
          <ButtonLink href={SOURCING_CATALOG_PATH} variant="secondary" icon={null}>
            Search {SOURCING_CATALOG_STATS.totalUniqueProducts} catalog products
          </ButtonLink>
          <a
            href={MASTER_CATALOG_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            download="Ali-Arshad-Product-Sourcing-Catalogue.pdf"
            className="btn btn--secondary btn--md"
          >
            <span>Master Catalogue (PDF)</span>
            <Icon name="arrow-up-right" size={16} className="btn__icon" />
          </a>
        </div>
      </PageHero>

      <section className="container" aria-label="Sourcing scope and role disclosure">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Clear coordination boundary:</strong> Ali Arshad Personal Studio coordinates supplier research, competitive quote comparison,
            sample evaluation, agreed quality checkpoints, and delivery-option analysis. We are <strong>not</strong> a factory owner, licensed customs
            broker, or freight forwarder — manufacturing, accredited lab certification, customs clearance, and route-dependent DDP delivery rely on
            qualified suppliers and licensed third-party providers.
          </span>
        </p>
      </section>

      {/* Catalog-Backed Product Examples Showcase */}
      <section className="section section--tight" aria-labelledby="sourcing-catalog-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Catalog-backed visual showcase</p>
            <h2 className="section-title" id="sourcing-catalog-title">
              Representative product lines from reviewed sourcing catalogs
            </h2>
            <p className="section-sub">
              Each showcase card highlights real product specifications, packaging formats, and compliance checkpoints — omitting private supplier
              names, phone numbers, and outdated wholesale prices.
            </p>
          </div>

          <SourcingCatalogShowcase compact />
        </div>
      </section>

      {/* Selective 3D Interactive 7-Stage Sourcing Workflow */}
      <section className="section section--surface" aria-labelledby="sourcing-workflow-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Seven-stage customer journey</p>
            <h2 className="section-title" id="sourcing-workflow-title">
              Brief to delivery handoff — gated by written customer approval
            </h2>
            <p className="section-sub">
              Nothing moves into paid samples, bulk manufacturing, or freight booking without your written sign-off on verified commercial terms.
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

          <div className="split-cards" style={{ marginTop: "24px" }}>
            <div className="panel">
              <p className="eyebrow eyebrow--plain">What Ali coordinates directly</p>
              <h3 className="card-title" style={{ marginBottom: "12px" }}>
                Direct studio coordination
              </h3>
              <ul className="check-list check-list--spaced">
                {SOURCING_RESPONSIBILITY_SPLIT.directCoordination.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <p className="eyebrow eyebrow--plain">Licensed &amp; specialized third parties</p>
              <h3 className="card-title" style={{ marginBottom: "12px" }}>
                Handled by suppliers, labs &amp; licensed providers
              </h3>
              <ul className="check-list check-list--spaced">
                {SOURCING_RESPONSIBILITY_SPLIT.externalSpecialists.map((item) => (
                  <li key={item}>
                    <Icon name="shield" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Categories Summary */}
      <section className="section" aria-labelledby="sourcing-cats-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Product categories &amp; specification checklists</p>
            <h2 className="section-title" id="sourcing-cats-title">
              Categories backed by reference catalogs &amp; custom research
            </h2>
            <p className="section-sub">
              Clearly distinguishing categories backed by reference manufacturer catalogs from categories scoped via fresh custom supplier research.
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

          <div style={{ marginTop: "22px", display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "center" }}>
            <Link href={SOURCING_CATALOG_PATH} className="arrow-link">
              <span>Search all {SOURCING_CATALOG_STATS.totalUniqueProducts} catalog products &amp; download individual PDFs</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link href="/blog/product-sourcing-landed-cost-catalog-checklist" className="arrow-link">
              <span>Read: Why factory unit price misleads buyers</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 9 Focused Sourcing Subpages */}
      <section className="section section--surface" aria-labelledby="sourcing-guides-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Deep-dive sourcing pages</p>
            <h2 className="section-title" id="sourcing-guides-title">
              Explore every stage of sourcing, quote comparison, QC, and shipping
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

      {/* Editorial Process Visuals */}
      <section className="section section--tight" aria-labelledby="sourcing-visuals-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Process context (illustrative scenes)</p>
            <h2 className="section-title section-title--sm" id="sourcing-visuals-title">
              Evaluation, export carton prep, and international freight handoff
            </h2>
          </div>

          <div className="card-grid card-grid--3">
            <EditorialMedia
              src="/images/services/sourcing-sample-inspection.jpg"
              alt="Quality specialist measuring a matte dark hard-shell suitcase sample on a workbench with calipers and checklist"
              badge="Illustrative editorial photo"
              caption="Illustrative scene showing physical sample measurement and finish verification prior to bulk production."
            />
            <EditorialMedia
              src="/images/services/sourcing-warehouse-packing.jpg"
              alt="Export fulfillment warehouse with neatly stacked master cartons on wooden pallets and shipping label station"
              badge="Illustrative editorial photo"
              caption="Illustrative export packing scene — carton marks, barcodes, and verified CBM dimensions before dispatch."
            />
            <EditorialMedia
              src="/images/services/sourcing-freight-logistics.jpg"
              alt="Twilight documentary photograph of intermodal shipping containers and air-freight cargo pallets at a port terminal"
              badge="Illustrative editorial photo"
              caption="Illustrative logistics scene — EXW, FOB, CIF, DAP, and route-dependent DDP coordinated with licensed providers."
            />
          </div>
        </div>
      </section>

      {/* Calculators & Incoterms Preview */}
      <section className="section section--surface" aria-labelledby="sourcing-tools-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Interactive sourcing calculators &amp; live FX</p>
            <h2 className="section-title" id="sourcing-tools-title">
              Model landed cost, supplier offers, MOQ, carton CBM, and USD/CNY rates
            </h2>
            <p className="section-sub">
              Every calculator runs transparently in your browser with visible formulas and honest planning caveats — zero email gates.
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
      />

      <ContactCTA
        standalone
        eyebrow="Start a sourcing inquiry"
        title="Need fresh supplier quotes, sample checks, or landed-cost clarity?"
        text="Share your product specifications, destination market, and rough target quantity. You will receive an honest feasibility read and clear next steps."
        button="Request a sourcing quote"
        href={contactHref}
        secondaryHref="/tools/landed-cost-calculator"
        secondaryLabel="Estimate Landed Cost First"
      />
    </>
  );
}

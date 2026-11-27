import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { singleServiceSchema, type FaqItem } from "@/lib/structured-data";

export const LINKEDIN_OUTREACH_PATH = "/services/linkedin-outreach";
export const LINKEDIN_OUTREACH_CONTACT_SERVICE = "LinkedIn Outreach & Sales Development";

export const metadata: Metadata = pageMetadata({
  title: "LinkedIn Outreach & B2B Sales Development",
  description:
    "Human-reviewed B2B LinkedIn outreach: ICP definition, Sales Navigator workflows, manual list QA, personalized messaging, CRM handoff, and client-approved Dripify setup.",
  path: LINKEDIN_OUTREACH_PATH,
});

const CAPABILITIES = [
  {
    title: "Target audience & ICP definition",
    detail:
      "Clarify exact buyer titles, company sizes, industries, geographies, and disqualifiers so outreach only reaches people your offer genuinely helps.",
  },
  {
    title: "Sales Navigator setup & saved searches",
    detail:
      "Where you hold an active LinkedIn Sales Navigator subscription, structure clean boolean/filter searches, account lists, and exclusion rules before exporting or reviewing.",
  },
  {
    title: "Prospect research & list quality checks",
    detail:
      "Human verification of prospect lists to remove mismatched titles, inactive accounts, competitors, existing customers, and obvious bad fits before any message is queued.",
  },
  {
    title: "Personalized connection & message sequences",
    detail:
      "Plain-spoken, relevance-first connection notes and thoughtful follow-up copy written in your real voice — avoiding gimmicky templates or aggressive sales pitches.",
  },
  {
    title: "Follow-up workflow & CRM handoff",
    detail:
      "Structured reply triage, opt-out logging, and clean CRM handoff (HubSpot, Pipedrive, Twenty CRM, or n8n workflows) so interested conversations move straight to a human call.",
  },
  {
    title: "Dripify campaign setup (client-approved workflow)",
    detail:
      "Strictly where approved by you under your own Dripify subscription, configure conservative sequence pacing, safety limits, stop-on-reply triggers, and mandatory pre-launch review.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "ICP & offer alignment",
    detail: "Document target roles, pain points, conversation goal, exclusion list, and profile readiness before building lists.",
  },
  {
    step: "02",
    label: "Research & list QA",
    detail: "Build targeted prospect lists (via Sales Navigator where licensed) and run manual relevance/exclusion checks.",
  },
  {
    step: "03",
    label: "Mandatory copy & targeting approval",
    detail: "You inspect and approve the exact prospect criteria, every connection note, every follow-up message, and campaign pacing.",
  },
  {
    step: "04",
    label: "Launch, reply handoff & opt-out hygiene",
    detail: "Run approved outreach safely, halt sequences immediately upon any reply or opt-out, and log warm replies in your CRM.",
  },
];

const ETHICS_RULES = [
  "Client must review and approve targeting criteria, message copy, and launch settings in writing before anything runs",
  "Human review on prospect lists and live replies — conversations are handed straight to a real person once someone responds",
  "Immediate opt-out respect: anyone declining or unsubscribing is tagged on a permanent do-not-contact list",
  "Platform-rule awareness: conservative daily pacing and no reckless volume spikes that jeopardize your LinkedIn account",
];

const NOT_OFFERED = [
  "No mass cold-spam blasts, scraped email dumps, or deceptive bait-and-switch connection requests",
  "No fake engagement pods, synthetic LinkedIn profiles, or unauthorized third-party scraping",
  "No guaranteed reply rates, booked meeting counts, or closed-revenue promises",
  "Third-party tools (LinkedIn Sales Navigator, Dripify, CRM seats) remain licensed directly under the client's own accounts",
];

const FAQS: FaqItem[] = [
  {
    q: "Do you guarantee a specific number of leads or booked calls per month?",
    a: "No. Reply and meeting rates depend on your market, offer strength, pricing, profile credibility, and timing. We focus on tight targeting, respectful personalized messaging, clean list hygiene, and reliable CRM follow-up.",
  },
  {
    q: "How does Dripify fit into this service?",
    a: "Dripify is strictly an optional, client-approved campaign workflow tool when you choose to license it under your own account. We never run automated sequences without your written sign-off on audience filters, message copy, conservative daily limits, and stop-on-reply rules.",
  },
  {
    q: "Do I need LinkedIn Sales Navigator?",
    a: "Sales Navigator is strongly recommended for precise B2B filtering, saved lead lists, and cleaner targeting, though exact tool requirements are confirmed during kickoff before you subscribe.",
  },
  {
    q: "Can warm LinkedIn replies sync automatically into our CRM?",
    a: "Yes — because n8n workflow automation and CRM engineering live inside Ali Arshad Personal Studio, approved positive replies and opt-out lists can feed cleanly into your CRM with human review.",
  },
];

export default function LinkedInOutreachPage() {
  const contactHref = `/contact?service=${encodeURIComponent(LINKEDIN_OUTREACH_CONTACT_SERVICE)}`;

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: "LinkedIn Outreach & Sales Development",
          description:
            "Targeted, human-reviewed LinkedIn B2B outreach: ICP definition, Sales Navigator workflows, manual list QA, personalized messaging, CRM handoff, and client-approved Dripify setup.",
          path: LINKEDIN_OUTREACH_PATH,
          serviceType: "LinkedIn Outreach & B2B Sales Development",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "LinkedIn Outreach & Sales Development", path: LINKEDIN_OUTREACH_PATH },
        ]}
      />

      <PageHero
        eyebrow="B2B Outbound Systems · Human-Reviewed Outreach"
        title={
          <>
            LinkedIn outreach &amp; sales development, <span className="accent">built on relevance and review</span>
          </>
        }
        lead="Structured B2B prospecting for founders and sales teams: sharp ICP definition, Sales Navigator workflows, manual list quality checks, natural personalized messaging, and clean CRM handoff — zero mass spamming or inflated lead guarantees."
        aside={
          <EditorialMedia
            src="/images/services/linkedin-outreach-workspace.jpg"
            alt="B2B strategist working on a dark laptop and reviewing handwritten outreach research notes on a minimalist oak desk"
            badge="Illustrative editorial photo"
            caption="Manual prospect research, natural copywriting, and strict client approval before any campaign goes live."
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Discuss your outreach workflow</ButtonLink>
          <ButtonLink href="/services/n8n-automation" variant="secondary" icon={null}>
            Pair with CRM &amp; n8n Automation →
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Approval and compliance notice">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Client-approval &amp; platform-rules policy:</strong> You review and approve every target filter, message template, tool
            setting (including optional Dripify configuration), and launch schedule before outreach begins. We never promise fixed lead volume
            or run bulk spam automation.
          </span>
        </p>
      </section>

      <section className="section section--tight" aria-labelledby="li-cap-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Core service scope</p>
            <h2 className="section-title" id="li-cap-title">
              Six practical building blocks for credible LinkedIn outbound
            </h2>
          </div>

          <div className="card-grid card-grid--3">
            {CAPABILITIES.map((c) => (
              <article key={c.title} className="panel feature-card">
                <h3 className="card-title">{c.title}</h3>
                <p>{c.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="li-flow-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Controlled launch sequence</p>
            <h2 className="section-title" id="li-flow-title">
              From ICP research to human-handled conversations
            </h2>
          </div>

          <ol className="hub-process">
            {WORKFLOW_STEPS.map((s) => (
              <li key={s.step} className="hub-process__step">
                <div className="hub-process__top">
                  <span className="hub-process__num">{s.step}</span>
                  <span className="hub-process__cadence">Stage</span>
                </div>
                <h3 className="hub-process__label">{s.label}</h3>
                <p className="hub-process__detail">{s.detail}</p>
              </li>
            ))}
          </ol>

          <div className="network-split" style={{ marginTop: "28px" }}>
            <article className="panel">
              <p className="eyebrow eyebrow--plain">Non-negotiable standards</p>
              <h3 className="card-title">Human oversight, opt-outs &amp; account safety</h3>
              <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                {ETHICS_RULES.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="panel">
              <p className="eyebrow eyebrow--plain">What we never do</p>
              <h3 className="card-title">Explicitly excluded tactics</h3>
              <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                {NOT_OFFERED.map((item) => (
                  <li key={item}>
                    <Icon name="alert" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="li-related-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Connected studio services</p>
            <h2 className="section-title section-title--sm" id="li-related-title">
              Strengthen your profile, landing page, and CRM pipeline together
            </h2>
          </div>
          <ul className="hub-card-grid">
            <li>
              <Link href="/services/social-media-management" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>Social Media Setup &amp; Management</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Keep Instagram positioning, grids, and visual storytelling cohesive alongside outbound.</span>
              </Link>
            </li>
            <li>
              <Link href="/services/n8n-automation" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>n8n Workflow &amp; CRM Automation</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Route approved warm leads, follow-up reminders, and opt-outs cleanly into your CRM.</span>
              </Link>
            </li>
            <li>
              <Link href="/products/pipelineos-crm" className="hub-link-card">
                <span className="hub-link-card__kind">Live Studio Demo</span>
                <span className="hub-link-card__title">
                  <span>PipelineOS CRM Sandbox</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Inspect how we structure contacts, deal stages, and B2B pipeline tracking cleanly.</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <Faq id="faq-linkedin-outreach" eyebrow="Common questions" title="LinkedIn outreach & sales development FAQ" items={FAQS} surface />

      <ContactCTA
        standalone
        eyebrow="Scope your outreach"
        title="Want a disciplined, human-reviewed LinkedIn outreach workflow?"
        text="Share your target audience, offer, and current CRM/tools. I will reply with an honest assessment of targeting fit and setup scope."
        button="Discuss LinkedIn outreach"
        href={contactHref}
        secondaryHref="/services/social-media-management"
        secondaryLabel="See Social Media Setup"
      />
    </>
  );
}


import type { Metadata } from "next";
import Image from "next/image";
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

export const SOCIAL_MEDIA_PATH = "/services/social-media-management";
export const SOCIAL_MEDIA_CONTACT_SERVICE = "Social Media Setup & Management";

export const metadata: Metadata = pageMetadata({
  title: "Social Media Setup & Management (Instagram Launch, Grids & Content Systems)",
  description:
    "Structured Instagram profile setup, positioning, launch-grid planning, Story Highlights, content calendars, and approval-gated publishing workflows — backed by active HubSpot Social Media Certification.",
  path: SOCIAL_MEDIA_PATH,
});

const CORE_DELIVERABLES = [
  {
    title: "Instagram profile setup & optimization",
    detail:
      "Clean handle/name discoverability, clear value-proposition bio, business/creator account setup, contact button wiring, and profile visual alignment with your website.",
  },
  {
    title: "Account positioning & link architecture",
    detail:
      "Define who the profile speaks to, core content pillars, brand tone rules, and a clean single destination link structure instead of cluttered third-party link walls.",
  },
  {
    title: "Launch-grid planning & foundational posts",
    detail:
      "Plan and produce a cohesive initial grid (typically 9–12 foundational posts across carousels, static brand visuals, and short-form video cuts) so visitors immediately understand your offer.",
  },
  {
    title: "Story Highlights structure & branded covers",
    detail:
      "Organize permanent Story Highlights (e.g., About, Offers, Process, Work/Samples, FAQ, Contact) with clean, legible cover graphics aligned to your brand palette.",
  },
  {
    title: "Content calendar & approval-gated workflow",
    detail:
      "Batch-planned monthly or bi-weekly calendar covering captions, visual templates, hashtags/keywords, and explicit client review before anything goes live.",
  },
  {
    title: "Optional ongoing management & plain-English reporting",
    detail:
      "Where scoped and confirmed, ongoing scheduled publishing, basic profile hygiene, and honest monthly summaries covering what shipped and what audience feedback showed.",
  },
];

const APPROVAL_FLOW = [
  {
    step: "01",
    label: "Audit & positioning brief",
    detail: "Review existing profile (or fresh account requirements), brand assets, target audience, and conversion destination.",
  },
  {
    step: "02",
    label: "Profile, links & Highlights setup",
    detail: "Draft optimized bio copy, link flow, Story Highlight categories, and reusable brand visual templates for your review.",
  },
  {
    step: "03",
    label: "Launch-grid & calendar sign-off",
    detail: "Review every caption, visual frame, and scheduled date in a single structured batch — nothing publishes without approval.",
  },
  {
    step: "04",
    label: "Publishing & optional monthly review",
    detail: "Roll out approved posts cleanly and, when ongoing management is confirmed, review performance trends honestly each month.",
  },
];

const CLIENT_INPUTS = [
  "Account admin access (via Meta Business Portfolio / agreed role — never sharing personal passwords insecurely)",
  "Brand guidelines, logo files, product photos, raw footage, or product samples (or scoped creative production)",
  "Factual product/service claims, pricing rules, and timely sign-off on batched content calendars",
  "Handling direct customer-support DMs, sales negotiations, or urgent account disputes unless separately agreed",
];

const OUTSIDE_SCOPE = [
  "No guaranteed follower counts, viral reach promises, or fixed sales/ROAS commitments",
  "No fake followers, engagement pods, automated follow/unfollow bots, or policy-violating growth hacks",
  "No unapproved publishing — every post, bio change, and campaign message requires client review",
  "Paid ad media spend is billed directly to your own Meta Ads account (never bundled opaquely)",
];

const FAQS: FaqItem[] = [
  {
    q: "Do you guarantee follower growth, reach, or sales from Instagram?",
    a: "No. Honest social media work never promises algorithm outcomes, guaranteed follower numbers, or fixed revenue. What you get is disciplined positioning, clean visual execution, structured Story Highlights, and reliable publishing.",
  },
  {
    q: "Can you set up the profile and launch grid as a one-time project without a monthly retainer?",
    a: "Yes. Many founders start with a one-time Instagram Setup & Launch Grid package (profile optimization, bio/links, Story Highlights, foundational grid posts, and reusable templates) and decide afterward whether they want ongoing monthly support.",
  },
  {
    q: "What credentials or experience back this service?",
    a: "Hands-on brand and marketing coordination experience for US-based brands, alongside active HubSpot Academy Social Media Certification (valid through December 2028) and in-house video/3D/brand design skills.",
  },
  {
    q: "Can you also produce short-form Reels edits, 3D visuals, or landing pages?",
    a: "Yes — because Creative Production, Brand Systems, and Web Development live inside the same studio, your Instagram grid, Reels edits, and landing page stay visually cohesive.",
  },
];

export default function SocialMediaManagementPage() {
  const contactHref = `/contact?service=${encodeURIComponent(SOCIAL_MEDIA_CONTACT_SERVICE)}`;

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: "Social Media Setup & Management",
          description:
            "Instagram profile setup and optimization, account positioning, launch-grid planning, Story Highlights, content calendars, and approval-gated publishing workflows.",
          path: SOCIAL_MEDIA_PATH,
          serviceType: "Social Media Setup & Management",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Social Media Setup & Management", path: SOCIAL_MEDIA_PATH },
        ]}
      />

      <PageHero
        eyebrow="Brand & Social Operations · Instagram-Focused"
        title={
          <>
            Social media setup &amp; management, <span className="accent">built for brand clarity</span>
          </>
        }
        lead="Turn an inconsistent or empty Instagram presence into a cohesive, conversion-ready storefront: profile optimization, positioning, launch-grid planning, Story Highlights, and structured publishing — with zero hype or fake growth promises."
        aside={
          <EditorialMedia
            src="/images/services/social-media-studio.jpg"
            alt="Dark studio tabletop creative shoot with a camera on a compact tripod, minimalist lifestyle objects, and warm amber lighting"
            badge="Illustrative editorial photo"
            caption="Consistent visual direction across profile setup, launch grids, Story Highlights, and short-form content."
            priority
          />
        }
      >
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Discuss your social setup</ButtonLink>
          <ButtonLink href="/services/linkedin-outreach" variant="secondary" icon={null}>
            See LinkedIn Outreach →
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--tight" aria-labelledby="sm-deliverables-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">What is included</p>
            <h2 className="section-title" id="sm-deliverables-title">
              Structured setup deliverables and optional ongoing workflow
            </h2>
            <p className="section-sub">
              Available either as a clean one-time Instagram launch foundation or paired with confirmed ongoing content publishing.
            </p>
          </div>

          <div className="card-grid card-grid--3">
            {CORE_DELIVERABLES.map((item) => (
              <article key={item.title} className="panel feature-card">
                <h3 className="card-title">{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="sm-flow-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Approval-gated workflow</p>
            <h2 className="section-title" id="sm-flow-title">
              How setup, review, and publishing run
            </h2>
          </div>

          <ol className="hub-process">
            {APPROVAL_FLOW.map((s) => (
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
              <p className="eyebrow eyebrow--plain">Client inputs required</p>
              <h3 className="card-title">What we need from your side</h3>
              <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                {CLIENT_INPUTS.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="panel">
              <p className="eyebrow eyebrow--plain">Explicitly outside scope</p>
              <h3 className="card-title">Honest guardrails &amp; boundaries</h3>
              <ul className="check-list check-list--spaced" style={{ marginTop: "12px" }}>
                {OUTSIDE_SCOPE.map((item) => (
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

      {/* Verified Credential Proof */}
      <section className="section section--tight" aria-labelledby="sm-cred-title">
        <div className="container">
          <div className="panel panel--lg credential-callout">
            <div className="credential-callout__copy">
              <p className="eyebrow eyebrow--plain">Verified training &amp; studio alignment</p>
              <h2 className="section-title section-title--sm" id="sm-cred-title">
                Backed by HubSpot Social Media Certification &amp; in-house visual design
              </h2>
              <p className="section-sub">
                Rather than handing strategy to one freelancer and design to another, your bio structure, brand colors, grid templates, Reels
                edits, and landing page stay aligned under Ali Arshad Personal Studio.
              </p>
              <div className="hero__actions" style={{ marginTop: "18px" }}>
                <Link href="/services/branding" className="arrow-link">
                  <span>Brand Identity Systems</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link href="/services/creative-production" className="arrow-link">
                  <span>Video Editing &amp; Creative Production</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link href="/services/linkedin-outreach" className="arrow-link">
                  <span>LinkedIn Outreach &amp; Sales Dev</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </div>
            <div className="credential-callout__img">
              <Image
                src="/images/credentials/hubspot-social-media-certified.webp"
                alt="HubSpot Academy Social Media Certification awarded to Ali Arshad"
                width={1140}
                height={880}
                sizes="(min-width: 1024px) 360px, 90vw"
              />
            </div>
          </div>
        </div>
      </section>

      <Faq id="faq-social-media" eyebrow="Common questions" title="Social media setup & management FAQ" items={FAQS} surface />

      <ContactCTA
        standalone
        eyebrow="Start your social setup"
        title="Need a sharper Instagram foundation or structured publishing rhythm?"
        text="Share your current handle (or launch goals) and target audience. I will reply with a practical one-time setup or ongoing scope — never inflated growth promises."
        button="Discuss your social scope"
        href={contactHref}
        secondaryHref="/services/branding"
        secondaryLabel="Explore Brand Systems"
      />
    </>
  );
}


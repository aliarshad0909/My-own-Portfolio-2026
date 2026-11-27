import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SITE, activeSocials } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Notice: How Form & Website Data Is Handled",
  description:
    "Plain-English disclosure describing what information the contact and studio collaborator forms on aliarshad.co collect, how submissions are delivered, and how browser tools and games operate.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const linkedin = activeSocials().find((s) => s.icon === "linkedin");

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ]}
      />

      <PageHero
        eyebrow="Studio Disclosure · Last Updated November 2026"
        title={
          <>
            Privacy &amp; <span className="accent">data handling</span>
          </>
        }
        lead="A plain-English summary of what this website collects when you submit an inquiry or collaborator form, how those messages are delivered, and what stays strictly inside your browser."
      />

      <section className="container" aria-label="Plain-English notice">
        <p className="notice notice--wide">
          <Icon name="shield" size={18} />
          <span>
            <strong>Scope of this disclosure:</strong> This page accurately describes the data-handling behavior implemented in this website&rsquo;s
            codebase. It is an honest operational disclosure written by Ali Arshad Personal Studio and has not been formally reviewed by legal
            counsel.
          </span>
        </p>
      </section>

      <section className="section" aria-labelledby="privacy-details-title">
        <div className="container">
          <h2 className="visually-hidden" id="privacy-details-title">
            Data handling details
          </h2>
          <div className="privacy-grid">

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">01 · Project Inquiry Form (/contact)</p>
            <h3 className="card-title">What the contact form collects</h3>
            <p>
              When you choose to submit the <Link href="/contact">project inquiry form</Link> (<code>POST /api/inquiry</code>), the form sends only
              the fields you enter:
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Required fields:</strong> your name, email address, selected service area, project description, and explicit consent
                  confirmation.
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Optional fields:</strong> company or brand name, approximate budget range, and expected timeline.
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Anti-spam checks:</strong> an invisible honeypot field and a client-side form-fill duration check (at least 2.5 seconds)
                  used only to reject automated spam before delivery; these checks are not stored.
                </span>
              </li>
            </ul>
          </article>

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">02 · Studio Network Form (/studio-network)</p>
            <h3 className="card-title">What collaborator registrations collect</h3>
            <p>
              Independent specialists who register interest on <Link href="/studio-network">/studio-network</Link> (
              <code>POST /api/studio-network</code>) submit:
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                <span>Full name, email address, location and time zone, selected primary skills, portfolio or work-samples URL, availability, short introduction, and consent confirmation.</span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>Nothing submitted through this form is published publicly without your explicit written permission.</span>
              </li>
            </ul>
          </article>

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">03 · Delivery, Storage &amp; Unconfigured State</p>
            <h3 className="card-title">How form messages are processed</h3>
            <p>
              This portfolio website does <strong>not</strong> publish contact or collaborator submissions publicly, nor does it sell, rent, or add
              inquiry submitters to marketing mailing lists without explicit opt-in consent.
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Configured delivery channels:</strong> When enabled in the deployment environment, validated submissions are delivered
                  server-side to Ali Arshad via the <strong>Resend</strong> transactional email API (and, where configured for the private
                  owner-only admin console, persisted privately in an encrypted-in-transit database for follow-up tracking).
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>When delivery is not configured:</strong> If email/webhook credentials are absent in an environment, the form shows a clear
                  notice and the API responds with HTTP <code>503</code> without delivering or storing your message.
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Retention &amp; purpose:</strong> Delivered messages are used solely to review your inquiry, discuss project fit, or
                  coordinate potential collaboration.
                </span>
              </li>
            </ul>
          </article>

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">04 · Abuse Protection &amp; Server Logs</p>
            <h3 className="card-title">Rate limiting &amp; hosting infrastructure</h3>
            <p>
              To protect form endpoints from automated abuse, the server validates request origin headers and applies a lightweight in-memory
              rate limiter (up to 5 requests per 10-minute sliding window per client IP address derived from standard proxy headers such as{" "}
              <code>x-forwarded-for</code> or <code>x-real-ip</code>). Rate-limit counters live temporarily in server memory only and are not written
              to persistent storage.
            </p>
            <p>
              Like standard web deployments, the underlying hosting provider (Vercel) processes normal HTTP request metadata (such as IP address,
              requested path, and user agent) to serve pages and protect network reliability.
            </p>
          </article>

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">05 · Cookies, Calculators &amp; Browser Games</p>
            <h3 className="card-title">No advertising trackers or hidden data capture</h3>
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Zero ad trackers:</strong> This site loads no third-party advertising pixels, remarketing tags, or cross-site tracking
                  cookies.
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Respect for Do Not Track:</strong> The lightweight client conversion helper checks{" "}
                  <code>navigator.doNotTrack === &quot;1&quot;</code> and suppresses event dispatch when enabled.
                </span>
              </li>
              <li>
                <Icon name="check" size={15} />
                <span>
                  <strong>Local-only tools &amp; games:</strong> Every calculator under <Link href="/tools">/tools</Link> and every playable mini-game
                  under <Link href="/games">/games</Link> executes purely inside your browser tab; numbers you calculate and moves you play are never
                  sent to any server.
                </span>
              </li>
            </ul>
          </article>

          <article className="panel privacy-card">
            <p className="eyebrow eyebrow--plain">06 · External Links &amp; Deletion Requests</p>
            <h3 className="card-title">Third-party sites &amp; managing your records</h3>
            <p>
              This website links to standalone demonstration sandboxes (such as <code>crm.aliarshad.co</code> and <code>stock.aliarshad.co</code>,
              which use fictional seeded demo data — please do not enter real personal or confidential business information into public demos) and
              external profiles (LinkedIn, Upwork, Instagram, Facebook), which operate under their own privacy policies.
            </p>
            <p>
              If you have submitted an inquiry and would like your email thread or collaborator note deleted from Ali&rsquo;s inbox, reply to the
              conversation directly
              {SITE.email ? (
                <>
                  {" "}
                  at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </>
              ) : null}
              {linkedin ? (
                <>
                  {" "}
                  or reach out via{" "}
                  <a href={linkedin.url} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </>
              ) : null}
              .
            </p>
          </article>
          </div>
        </div>
      </section>
    </>
  );
}

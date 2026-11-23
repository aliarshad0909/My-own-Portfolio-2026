import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Plain-English privacy policy for Ali Arshad Personal Studio: what information forms collect, zero third-party ad cookies, analytics behavior, and how to request data deletion.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]}
      />
      <PageHero
        eyebrow="Privacy & Data Handling"
        title="Privacy policy"
        lead="Plain-language summary of what this website collects, why it is collected, and how your details are handled."
      />

      <section className="section section--tight">
        <div className="container prose" style={{ maxWidth: "74ch" }}>
          <p className="fine-print">Last reviewed: November 23, 2026</p>

          <h2>1. Who operates this website</h2>
          <p>
            This website (<code>www.aliarshad.co</code>) is operated by Ali Arshad as an independent personal studio. There are no data brokers,
            third-party ad networks, or resold mailing lists associated with this site.
          </p>

          <h2>2. Information you choose to submit</h2>
          <p>This website only receives personal information when you actively fill out and submit a form:</p>
          <ul>
            <li>
              <strong>Project Inquiry form (<code>/contact</code>):</strong> Name, email address, optional company/brand name, requested service,
              project summary, optional budget range and timeline, and your consent confirmation. Used solely to evaluate your project and reply to
              you.
            </li>
            <li>
              <strong>Studio Network form (<code>/studio-network</code>):</strong> Name, email address, location/time zone, primary skills,
              portfolio/work sample link, availability, short introduction, and consent confirmation. Used solely to evaluate independent project
              collaboration. Nothing submitted is published publicly without explicit written permission.
            </li>
            <li>
              <strong>Optional Studio Updates signup (<code>/insights</code>):</strong> Email address, optional topic focus, and explicit opt-in
              consent. Used solely to send occasional build notes and practical AI/engineering guides when mailing delivery is enabled.
            </li>
          </ul>
          <p>
            When a form&rsquo;s backend inbox or webhook is not yet configured on the server, submissions are rejected with an honest notice and are
            not stored or silently discarded as &ldquo;sent.&rdquo;
          </p>

          <h2>3. How form messages are delivered</h2>
          <p>
            When configured in production, form submissions are transmitted over HTTPS directly to Ali Arshad&rsquo;s configured email provider
            (Resend) and/or a private studio webhook endpoint solely for reviewing and responding to your message. Basic anti-spam checks (origin
            check, rate limiting by IP address in temporary memory, honeypot field, and minimum fill time) protect forms from automated abuse.
          </p>

          <h2>4. Cookies, analytics &amp; Do Not Track</h2>
          <ul>
            <li>This portfolio website sets no advertising or cross-site tracking cookies.</li>
            <li>
              Interactive conversion events (such as clicking a live demo launch button or submitting a form) respect your browser&rsquo;s{" "}
              <code>Do Not Track</code> preference and use zero third-party tracking cookies.
            </li>
            <li>
              Live demonstration sandboxes hosted on separate subdomains (<code>crm.aliarshad.co</code> and <code>stock.aliarshad.co</code>) use
              strictly necessary HTTP-only session cookies solely to keep you logged into the fictional sandbox workspace. Do not enter real
              sensitive customer data into public sandbox demos.
            </li>
          </ul>

          <h2>5. Data retention &amp; deletion requests</h2>
          <p>
            Project inquiries and collaborator submissions are kept only as long as needed to communicate about potential or active work. You may
            request access to, correction of, or deletion of any details you submitted at any time via{" "}
            {SITE.email ? (
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            ) : (
              <Link href="/contact">the contact page</Link>
            )}
            .
          </p>
        </div>
      </section>
    </>
  );
}

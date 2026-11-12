import type { Metadata } from "next";
import Image from "next/image";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { Icon } from "@/components/ui/Icon";
import { isDeliveryConfigured } from "@/lib/inquiry-server";
import { pageMetadata } from "@/lib/seo";
import { SITE, activeSocials } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Start a project with Ali Arshad. Share what you're working on and get a considered reply about scope, approach and next steps.",
  path: "/contact",
});

export default function ContactPage() {
  const socials = activeSocials();
  // Read on the server so no configuration details reach the browser.
  const configured = isDeliveryConfigured();

  return (
    <section className="page-hero contact" aria-labelledby="contact-title">
      <div className="container contact__inner">
        <div className="contact__intro enter">
          <p className="eyebrow">Contact</p>
          <h1 className="page-title" id="contact-title">
            Let&rsquo;s talk about <span className="accent">your project</span>
          </h1>
          <p className="lead">
            Tell me what you&rsquo;re building, what&rsquo;s in the way, and when you need it. I read every inquiry myself and reply with honest thoughts on fit, scope and next steps.
          </p>

          <ul className="contact__details">
            {SITE.email ? (
              <li>
                <Icon name="mail" size={20} />
                <span>
                  <small>Email</small>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </span>
              </li>
            ) : null}
            {SITE.availability ? (
              <li>
                <Icon name="clock" size={20} />
                <span>
                  <small>Availability</small>
                  {SITE.availability}
                </span>
              </li>
            ) : null}
            <li>
              <Icon name="globe" size={20} />
              <span>
                <small>Working with</small>
                Clients internationally, remotely
              </span>
            </li>
          </ul>

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

          <div className="portrait-frame portrait-frame--contact">
            <Image
              src="/images/portraits/portrait-contact.webp"
              alt="Portrait of Ali Arshad wearing a dark blazer"
              width={1173}
              height={1341}
              sizes="(min-width: 1024px) 380px, 70vw"
            />
          </div>
        </div>

        <div className="panel panel--lg contact__form enter">
          <h2 className="section-title section-title--sm">Project inquiry</h2>
          <p className="section-sub">Fields marked with * are required.</p>
          <InquiryForm configured={configured} fallbackEmail={SITE.email} />
        </div>
      </div>
    </section>
  );
}

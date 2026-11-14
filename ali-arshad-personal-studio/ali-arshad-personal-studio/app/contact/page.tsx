import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { Icon, type IconName } from "@/components/ui/Icon";
import { isDeliveryConfigured } from "@/lib/inquiry-server";
import { pageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import { SITE, activeSocials } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Start a project with Ali Arshad. Share what you're building, the budget and timeline if you know them, and get a considered reply on fit, scope and next steps.",
  path: "/contact",
});

/** What a sender can expect after pressing send. No turnaround promise is made that cannot be kept. */
const NEXT_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "mail", title: "I read it myself", text: "Every inquiry lands with me, not a form queue. A sentence or two on what you are trying to achieve is more useful than a long brief." },
  { icon: "users", title: "A short call if it fits", text: "If the project looks like a match, I will suggest a call to understand the goal, constraints and what success looks like." },
  { icon: "briefcase", title: "A written scope", text: "You get a plain-language proposal: what will be built, in what order, what it costs and what it depends on from your side." },
];

export default function ContactPage() {
  const socials = activeSocials();
  // Read on the server so no configuration detail reaches the browser.
  const configured = isDeliveryConfigured();

  return (
    <>
      <section className="page-hero contact" aria-labelledby="contact-title">
        <div className="container contact__inner">
          <div className="contact__intro enter">
            <p className="eyebrow">Contact</p>
            <h1 className="page-title" id="contact-title">
              Let&rsquo;s talk about <span className="accent">your project</span>
            </h1>
            <p className="lead">
              Tell me what you&rsquo;re building, what&rsquo;s in the way, and when you need it. I reply with honest thoughts on fit, scope and next steps
              — including when the right answer is a smaller project than you had in mind.
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
              <li>
                <Icon name="layers" size={20} />
                <span>
                  <small>Services</small>
                  <Link href="/services">{SERVICES.length} areas, from creative production to automation</Link>
                </span>
              </li>
            </ul>

            {socials.length > 0 ? (
              <ul className="social-list" aria-label="Professional profiles">
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
            <p className="section-sub">Fields marked with * are required. Budget and timeline are optional, and a rough idea is fine.</p>
            <InquiryForm configured={configured} fallbackEmail={SITE.email} />
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="next-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">After you send</p>
            <h2 className="section-title" id="next-title">
              What happens next
            </h2>
          </div>
          <ol className="next-steps">
            {NEXT_STEPS.map((s, i) => (
              <li key={s.title} className="next-step reveal">
                <span className="next-step__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={s.icon} size={22} className="next-step__icon" />
                <h3 className="next-step__title">{s.title}</h3>
                <p className="next-step__text">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="fine-print contact__fine">
            Not sure which service you need? Choose &ldquo;Not sure yet&rdquo; and describe the problem — working out the right approach is part of the job. For
            specialist areas such as blockchain or security, I coordinate with qualified partners and say so upfront.
          </p>
        </div>
      </section>
    </>
  );
}

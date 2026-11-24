import type { Metadata } from "next";
import { Faq } from "@/components/ui/Faq";
import type { FaqItem } from "@/lib/structured-data";
import Image from "next/image";
import Link from "next/link";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";
import { isDeliveryConfigured } from "@/lib/inquiry-server";
import { pageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import { GPU_COMPUTE_PATH } from "@/lib/gpu-compute";
import { FREELANCE, SITE, activeSocials } from "@/lib/site";

// Evaluate delivery env vars per request so Vercel env updates take effect immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Contact: Start a Project",
  description:
    "Start a project with Ali Arshad. Reach out directly via Upwork or LinkedIn, shape an exploratory brief with the Visual Project Planner, or use the project inquiry form once connected.",
  path: "/contact",
});

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What should the first message include?",
    a: "A sentence or two on what you are trying to achieve is more useful than a long brief. Budget and timeline help if you know them, but neither is required to start the conversation — or you can generate a structured starting brief in the Visual Project Planner.",
  },
  {
    q: "Which service should I choose if the problem spans several?",
    a: "Pick the closest one, or choose \u201cNot sure yet\u201d and describe the problem: working out the right approach is part of the job. For specialist areas such as blockchain or security, qualified partners are brought in and that is said upfront.",
  },
];

/** What a sender can expect after reaching out. No turnaround promise is made that cannot be kept. */
const NEXT_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "mail", title: "I read it myself", text: "Every message lands with me personally, not an account manager or support queue." },
  { icon: "users", title: "A short call if it fits", text: "If the project looks like a match, I will suggest a call to understand the goal, constraints and what success looks like." },
  { icon: "briefcase", title: "A written scope", text: "You get a plain-language proposal: what will be built, in what order, what it costs and what it depends on from your side." },
];

export default function ContactPage() {
  const socials = activeSocials();
  // Read on the server so no configuration detail reaches the browser.
  const configured = isDeliveryConfigured();
  const linkedinUrl = socials.find((s) => s.icon === "linkedin")?.url ?? "";

  return (
    <>
      <section className="page-hero contact" aria-labelledby="contact-title">
        <div className="container contact__inner">
          <div className="contact__intro">
            <div className="contact__copy">
              <p className="eyebrow">Contact · Direct Independent Studio</p>
              <h1 className="page-title" id="contact-title">
                Let&rsquo;s talk about <span className="accent">your project</span>
              </h1>
              <p className="lead">
                Tell me what you&rsquo;re building, what&rsquo;s in the way, and when you need it. I reply personally with
                honest thoughts on fit, scope, and next steps — including when a smaller phase-1 build is the smarter move.
              </p>

              {/* Clear direct channels available immediately */}
              <div className="contact__channels panel" aria-label="Direct ways to connect right now">
                <p className="eyebrow eyebrow--plain">Direct channels available now</p>
                <div className="contact__channel-actions">
                  <a
                    href={FREELANCE.upwork.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary btn--sm"
                  >
                    <span>{FREELANCE.upwork.ctaLabel}</span>
                    <Icon name="arrow-up-right" size={15} />
                  </a>
                  {linkedinUrl ? (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--secondary btn--sm"
                    >
                      <Icon name="linkedin" size={16} />
                      <span>Message on LinkedIn</span>
                    </a>
                  ) : null}
                  <Link href="/project-planner" className="btn btn--secondary btn--sm">
                    <span>Open Visual Project Planner</span>
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </div>

                {socials.length > 0 ? (
                  <ul className="contact__social-pills" aria-label="Verified professional profiles">
                    {socials.map((s) => (
                      <li key={s.label}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="location-pill"
                          aria-label={`${s.label} (opens in a new tab)`}
                        >
                          <Icon name={s.icon} size={15} />
                          <span style={{ marginLeft: "6px" }}>{s.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

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
                    <small>Delivery model</small>
                    100% remote studio working across US &amp; international time zones
                  </span>
                </li>
                <li>
                  <Icon name="layers" size={20} />
                  <span>
                    <small>Capabilities</small>
                    <em className="contact__inline-links" style={{ fontStyle: "normal" }}>
                      <Link href="/services">{SERVICES.length} studio areas</Link> +{" "}
                      <Link href={GPU_COMPUTE_PATH}>RTX GPU compute consultation</Link>
                    </em>
                  </span>
                </li>
              </ul>
            </div>

            {/* Portrait + unboxed 3D "A" sitting cleanly in open visual space */}
            <div className="contact__brand-pair">
              <div className="portrait-frame portrait-frame--contact">
                <Image
                  src="/images/portraits/portrait-contact.webp"
                  alt="Portrait of Ali Arshad wearing a dark blazer"
                  width={1173}
                  height={1341}
                  sizes="(min-width: 1024px) 240px, 56vw"
                />
              </div>
              <div className="contact__mark-space">
                <SignatureMark3D variant="contact" />
                <p className="fine-print">Ali Arshad Personal Studio · Independent remote delivery</p>
              </div>
            </div>
          </div>

          <div className="panel panel--lg contact__form">
            <h2 className="section-title section-title--sm">Project inquiry form</h2>
            <p className="section-sub">
              Fields marked with * are required. Budget and timeline are optional, and a rough idea is completely fine.
            </p>
            <InquiryForm
              configured={configured}
              fallbackEmail={SITE.email}
              upworkUrl={FREELANCE.upwork.url}
              linkedinUrl={linkedinUrl}
            />
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="next-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">After you reach out</p>
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
            Not sure which service you need? Try the <Link href="/project-planner">Visual Project Planner</Link> or
            choose &ldquo;Not sure yet&rdquo; and describe the problem. For specialist areas such as security reviews or
            blockchain, I coordinate with vetted independent partners via the{" "}
            <Link href="/studio-network">Studio Network</Link> and disclose involvement upfront.
          </p>
        </div>
      </section>

      <Faq id="contact-faq" eyebrow="Common questions" title="Before you write" items={FAQ_ITEMS} />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { INTERVIEW_FEATURE } from "@/lib/interview-feature";

/**
 * 90-second personal interview feature on `/about#meet-ali-interview`.
 * Renders an honest, studio-lit placeholder card until Ali provides real footage,
 * captions, and transcript in `lib/interview-feature.ts` — at which point it
 * renders a native lazy-loaded HTML5 video player automatically.
 */
export function MeetAliInterviewCard() {
  const isReady = INTERVIEW_FEATURE.status === "ready" && Boolean(INTERVIEW_FEATURE.videoSrc);

  return (
    <section
      className="section section--tight"
      id={INTERVIEW_FEATURE.anchorId}
      aria-labelledby="meet-ali-interview-title"
    >
      <div className="container">
        <div className="panel panel--lg meet-ali-card">
          <div className="meet-ali-card__copy">
            <div className="meet-ali-card__meta">
              <p className="eyebrow eyebrow--plain" style={{ marginBottom: 0 }}>
                Meet Ali · {INTERVIEW_FEATURE.durationLabel}
              </p>
              <span className={`badge ${isReady ? "badge--verified" : "badge--concept"}`}>
                {isReady ? "Studio Introduction" : "Video Slot · Footage Pending"}
              </span>
            </div>

            <h2 className="section-title section-title--sm" id="meet-ali-interview-title">
              {isReady ? INTERVIEW_FEATURE.title : INTERVIEW_FEATURE.placeholderHeadline}
            </h2>

            <p className="section-sub" style={{ marginTop: "6px" }}>
              {INTERVIEW_FEATURE.placeholderDescription}
            </p>

            <div className="meet-ali-card__topics">
              <p className="label" style={{ marginBottom: "8px" }}>
                What this 90-second intro covers
              </p>
              <ul className="check-list">
                {INTERVIEW_FEATURE.plannedTopics.map((topic) => (
                  <li key={topic}>
                    <Icon name="check" size={15} />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero__actions" style={{ marginTop: "18px" }}>
              <Link href="/contact" className="btn btn--primary btn--sm">
                <span>Book a quick intro call instead</span>
                <Icon name="arrow-up-right" size={15} className="btn__icon" />
              </Link>
              <Link href="/experience" className="btn btn--secondary btn--sm">
                <span>View background &amp; credentials</span>
              </Link>
            </div>
          </div>

          <div className="meet-ali-card__stage">
            {isReady ? (
              <div className="meet-ali-card__player">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={INTERVIEW_FEATURE.posterSrc}
                  aria-label={INTERVIEW_FEATURE.title}
                >
                  <source src={INTERVIEW_FEATURE.videoSrc} type="video/mp4" />
                  {INTERVIEW_FEATURE.captionsSrc ? (
                    <track kind="captions" src={INTERVIEW_FEATURE.captionsSrc} srcLang="en" label="English" default />
                  ) : null}
                </video>
                {INTERVIEW_FEATURE.transcript ? (
                  <details className="meet-ali-card__transcript">
                    <summary>Read transcript</summary>
                    <p>{INTERVIEW_FEATURE.transcript}</p>
                  </details>
                ) : null}
              </div>
            ) : (
              <div
                className="meet-ali-card__placeholder"
                role="region"
                aria-label="90-second personal interview video placeholder"
              >
                <Image
                  src={INTERVIEW_FEATURE.posterSrc}
                  alt={INTERVIEW_FEATURE.posterAlt}
                  width={1157}
                  height={1360}
                  sizes="(min-width: 1024px) 480px, 92vw"
                  className="meet-ali-card__poster"
                />
                <div className="meet-ali-card__scrim" aria-hidden="true" />
                <div className="meet-ali-card__overlay">
                  <span className="meet-ali-card__pill">
                    <Icon name="clapperboard" size={14} />
                    <span>{INTERVIEW_FEATURE.aspectLabel} · {INTERVIEW_FEATURE.durationLabel}</span>
                  </span>
                  <div className="meet-ali-card__play-badge" aria-hidden="true">
                    <Icon name="play" size={22} />
                  </div>
                  <p className="meet-ali-card__caption">
                    Reserved for Ali&rsquo;s authentic 90-second recording — video, captions, and transcript coming soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

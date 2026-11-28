import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { INTERVIEW_FEATURE } from "@/lib/interview-feature";

/**
 * Compact homepage teaser introducing the person behind the studio and linking
 * cleanly to the 90-second personal interview section on /about#meet-ali-interview.
 */
export function MeetAliTeaser() {
  const isReady = INTERVIEW_FEATURE.status === "ready" && Boolean(INTERVIEW_FEATURE.videoSrc);

  return (
    <section className="section section--tight" aria-labelledby="meet-ali-teaser-title">
      <div className="container">
        <div className="panel meet-ali-teaser">
          <div className="meet-ali-teaser__media">
            <Image
              src={INTERVIEW_FEATURE.posterSrc}
              alt={INTERVIEW_FEATURE.posterAlt}
              width={480}
              height={564}
              sizes="(min-width: 768px) 160px, 120px"
              className="meet-ali-teaser__img"
            />
            <span className="meet-ali-teaser__play" aria-hidden="true">
              <Icon name="play" size={16} />
            </span>
          </div>

          <div className="meet-ali-teaser__copy">
            <div className="meet-ali-teaser__meta">
              <span className="eyebrow eyebrow--plain" style={{ marginBottom: 0 }}>
                Meet Ali
              </span>
              <span className={`badge ${isReady ? "badge--verified" : "badge--concept"}`}>
                {isReady ? `${INTERVIEW_FEATURE.durationLabel} · Watch Now` : `${INTERVIEW_FEATURE.durationLabel} Intro · Coming Soon`}
              </span>
            </div>
            <h2 className="card-title" id="meet-ali-teaser-title">
              Work directly with the founder building your project
            </h2>
            <p className="fine-print">{INTERVIEW_FEATURE.teaserSummary}</p>
          </div>

          <div className="meet-ali-teaser__actions">
            <Link href={`/about#${INTERVIEW_FEATURE.anchorId}`} className="btn btn--secondary btn--sm">
              <span>{isReady ? "Watch 90s interview" : "Preview interview slot"}</span>
              <Icon name="arrow-right" size={15} className="btn__icon" />
            </Link>
            <Link href="/about" className="arrow-link meet-ali-teaser__about">
              <span>About the studio</span>
              <Icon name="arrow-up-right" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

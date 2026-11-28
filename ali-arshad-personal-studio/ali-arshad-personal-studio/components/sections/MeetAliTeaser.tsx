import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { INTERVIEW_FEATURE } from "@/lib/interview-feature";

/**
 * Compact homepage teaser introducing the person behind the studio and linking
 * cleanly to the personal studio introduction video on /about#meet-ali-interview.
 */
export function MeetAliTeaser() {
  const isReady = INTERVIEW_FEATURE.status === "ready" && Boolean(INTERVIEW_FEATURE.videoSrc);
  const videoHref = `/about#${INTERVIEW_FEATURE.anchorId}`;

  return (
    <section className="section section--tight" aria-labelledby="meet-ali-teaser-title">
      <div className="container">
        <div className="panel meet-ali-teaser">
          <Link
            href={videoHref}
            className="meet-ali-teaser__media"
            aria-label={isReady ? `Watch ${INTERVIEW_FEATURE.title} (${INTERVIEW_FEATURE.durationLabel})` : "Preview Meet Ali video slot"}
          >
            <Image
              src={INTERVIEW_FEATURE.posterSrc}
              alt={INTERVIEW_FEATURE.posterAlt}
              width={1280}
              height={720}
              loading="eager"
              unoptimized
              sizes="(min-width: 768px) 168px, 148px"
              className="meet-ali-teaser__img"
            />
            <span className="meet-ali-teaser__play" aria-hidden="true">
              <Icon name="play" size={16} />
            </span>
          </Link>

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
            <Link href={videoHref} className="btn btn--primary btn--sm">
              <span>{isReady ? "Watch studio intro (2:19)" : "Preview interview slot"}</span>
              <Icon name="play" size={14} className="btn__icon" />
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

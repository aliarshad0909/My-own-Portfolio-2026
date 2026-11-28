import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  AUDIO_SHOWCASE_NOTICE,
  audioForCreativeSection,
  type AudioShowcaseSection,
} from "@/lib/creative-audio";

type Props = {
  id?: string;
  section?: AudioShowcaseSection;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  surface?: boolean;
  compact?: boolean;
};

const WAVE_BARS = [28, 52, 74, 44, 88, 62, 36, 94, 68, 48, 82, 54, 34, 72, 46, 26];

/**
 * Accessible, zero-autoplay showcase for cleared ElevenLabs AI voiceover & audio
 * production cues. Every native HTML5 `<audio>` player uses `preload="none"` so
 * zero audio bytes are downloaded until the visitor actively presses Play.
 */
export function AudioShowcasePlayer({
  id = "audio-voiceover-samples",
  section = "all",
  eyebrow = "AI Voiceover & Audio Production · ElevenLabs Samples",
  heading = "Short-form narration & dialogue cues with verbatim transcripts",
  lead = "Press play on any sample to preview loudness-normalized voiceover timing and tone — zero audio downloads until played. All three cues are also heard mixed into the “Thirty Copies” vertical narrative reel.",
  surface = false,
  compact = false,
}: Props) {
  const samples = audioForCreativeSection(section);
  if (samples.length === 0) return null;

  return (
    <section
      className={`section ${surface ? "section--surface" : ""} ${compact ? "section--tight" : ""}`.trim()}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">{eyebrow}</p>
          <h2 className={`section-title ${compact ? "section-title--sm" : ""}`.trim()} id={`${id}-title`}>
            {heading}
          </h2>
          <p className="section-sub">{lead}</p>
        </div>

        <div className="card-grid card-grid--3 audio-showcase__grid">
          {samples.map((item) => (
            <article key={item.id} className="panel audio-card">
              <div className="audio-card__top">
                <span className="badge badge--demo">{item.badge}</span>
                <span className="audio-card__dur" aria-label={`Duration ${item.durationLabel}`}>
                  {item.durationLabel}
                </span>
              </div>

              <div className="audio-card__wave" aria-hidden="true">
                {WAVE_BARS.map((height, idx) => (
                  <span key={idx} className="audio-card__bar" style={{ height: `${height}%` }} />
                ))}
              </div>

              <p className="audio-card__cat">{item.category}</p>
              <h3 className="card-title">{item.title}</h3>

              <blockquote className="audio-card__quote">{item.transcript}</blockquote>

              <div className="audio-card__player-wrap">
                <audio
                  controls
                  preload="none"
                  className="audio-card__player"
                  aria-label={`${item.title} — ${item.transcript}`}
                >
                  <source src={item.src} type="audio/mpeg" />
                  Your browser does not support embedded HTML5 audio.
                </audio>
                <p className="fine-print audio-card__meta">{item.formatMeta}</p>
              </div>

              <p className="audio-card__desc">{item.description}</p>

              <ul className="tag-list" aria-label="Use cases">
                {item.useCases.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>

              <div className="audio-card__footer">
                <Link href="/services/creative-production#motion-examples" className="arrow-link">
                  <span>Hear in “Thirty Copies” reel</span>
                  <Icon name="arrow-up-right" size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="notice notice--wide" style={{ marginTop: "18px" }}>
          <Icon name="alert" size={18} />
          <span>{AUDIO_SHOWCASE_NOTICE}</span>
        </p>
      </div>
    </section>
  );
}

import { MotionMedia } from "@/components/ui/MotionMedia";

/**
 * A pre-rendered Remotion loop for a service hub, embedded through MotionMedia:
 * autoplays muted and looped where allowed, shows the poster still under
 * prefers-reduced-motion or on small screens, never ships the Remotion runtime
 * to the client. Source compositions live in /remotion; re-render with
 * `npm run remotion:render:*`.
 *
 * Only hubs with a genuine, communicative loop are listed. Others render
 * nothing — motion is added where it clarifies, not to fill space.
 */
type Motion = {
  video: string;
  poster: string;
  alt: string;
  label: string;
  eyebrow: string;
  title: string;
  caption: string;
};

const HUB_MOTION: Record<string, Motion> = {
  "n8n-automation": {
    video: "/videos/n8n-workflow.mp4",
    poster: "/images/motion-posters/n8n-workflow.jpg",
    alt: "An n8n workflow: a trigger flows through a condition and an action to a business outcome.",
    label: "Illustrative n8n workflow showing a trigger, a condition, an action and the resulting business outcome.",
    eyebrow: "See it move",
    title: "How an automated workflow runs",
    caption: "Illustrative — a real workflow is designed around your tools and rules.",
  },
  "ai-agents": {
    video: "/videos/ai-agent-flow.mp4",
    poster: "/images/motion-posters/ai-agent-flow.jpg",
    alt: "An AI agent flow: a customer question reaches the agent, which draws on tools and knowledge, then returns a useful answer.",
    label: "Illustrative AI agent flow: customer input to agent reasoning over tools and knowledge to a grounded response.",
    eyebrow: "See it move",
    title: "How the agent answers",
    caption: "Illustrative — the agent is scoped to your knowledge and your tools.",
  },
};

export function ServiceMotion({ hubSlug }: { hubSlug: string }) {
  const motion = HUB_MOTION[hubSlug];
  if (!motion) return null;

  return (
    <section className="section section--surface" aria-labelledby={`motion-${hubSlug}`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">{motion.eyebrow}</p>
          <h2 className="section-title" id={`motion-${hubSlug}`}>
            {motion.title}
          </h2>
        </div>
        <figure className="service-motion">
          <MotionMedia
            still={{ src: motion.poster, alt: motion.alt, width: 1600, height: 900 }}
            sources={[{ src: motion.video, type: "video/mp4" }]}
            label={motion.label}
            minWidth={600}
            className="service-motion__media"
          />
          <figcaption className="fine-print service-motion__cap">{motion.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}

/** Hubs that currently have a motion loop, for sitemap/preview reasoning. */
export const HUBS_WITH_MOTION = Object.keys(HUB_MOTION);

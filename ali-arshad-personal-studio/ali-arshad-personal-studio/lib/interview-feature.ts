/**
 * Single configuration point for the "Meet Ali" personal studio introduction video.
 *
 * Source & preservation rule:
 * - Original master preserved untouched at
 *   `E:\My-own-Portfolio-2026\video editing\ALI_ARSHAD_PREMIUM_V3_MASTER.mp4` (243.1 MB).
 * - Public web version: `public/videos/meet-ali-interview.mp4` (1920×1080, 2:19,
 *   H.264 High +faststart, 23.6 MB), paired with a 1280×720 WebP poster frame and
 *   exact verbatim WebVTT captions & transcript transcribed directly from Ali's speech.
 */

export type InterviewFeatureConfig = {
  status: "placeholder" | "ready";
  anchorId: string;
  durationLabel: string;
  aspectLabel: string;
  title: string;
  description: string;
  teaserSummary: string;
  placeholderHeadline: string;
  placeholderDescription: string;
  plannedTopics: readonly string[];
  posterSrc: string;
  posterAlt: string;
  videoSrc: string;
  captionsSrc: string;
  transcript: string;
};

export const INTERVIEW_FEATURE: InterviewFeatureConfig = {
  status: "ready",
  anchorId: "meet-ali-interview",
  durationLabel: "2 min 19 sec",
  aspectLabel: "16:9 · 1080p Studio Intro",
  title: "Meet Ali Arshad — Personal Studio Introduction",
  description:
    "Watch Ali's personal studio introduction covering his business and supply chain background, Next.js and Python/FastAPI engineering stack, n8n and AI agent workflows, creative production across video and 3D, and B2B outreach support — with full verbatim captions and transcript below.",
  teaserSummary:
    "Watch Ali introduce his personal studio across business operations, Next.js & FastAPI software, AI automation, creative production, and B2B outreach.",
  placeholderHeadline: "Personal studio introduction — footage pending",
  placeholderDescription:
    "This slot is reserved for Ali's personal studio introduction with authentic footage, captions, and transcript.",
  plannedTopics: [
    "Business administration, supply chain, procurement, inventory & commercial goals",
    "Web & SaaS engineering with Next.js, Python, FastAPI, PostgreSQL, Docker, AWS & Neon",
    "AI & automation with n8n, Gemini, Ollama, OpenRouter & human-overseen voice/AI agents",
    "Creative production in Premiere Pro, After Effects, Blender, Photoshop, Illustrator & B2B outreach",
  ],
  posterSrc: "/images/videos/meet-ali-interview-poster.webp",
  posterAlt:
    "Ali Arshad smiling on camera in his personal studio introduction video with the ALI ARSHAD title graphic and opening caption",
  videoSrc: "/videos/meet-ali-interview.mp4",
  captionsSrc: "/videos/meet-ali-interview.vtt",
  transcript:
    "I'm Ali Arshad. I work across business, software, AI, and creative production, bringing multiple capabilities together through my personal studio. I help businesses turn ideas and operational challenges into practical digital solutions, combining strategy, hands-on execution, and clear communication. My business administration and supply chain background helps me understand processes, procurement, inventory, supplier coordination, and the commercial goals behind a project. For web development, I work with Next.js, Python, and FastAPI, building responsive websites and applications backed by PostgreSQL databases. I use Docker, AWS, and Neon in my development and deployment workflows, building CRM systems, inventory platforms, dashboards, and custom SaaS products. For AI and automation, I use n8n, Gemini, Ollama, and OpenRouter to connect applications, automate repetitive work, and build intelligent workflows. I also develop AI agents and voice agent workflows for lead qualification, customer support, information handling, and follow-ups, with human oversight when needed. For creative production, I use Premiere Pro and After Effects for video editing and motion graphics, alongside Blender for three-dimensional visuals. With Photoshop and Illustrator, I create and refine brand assets, product imagery, social media graphics, and professional visual content. I also handle social media management, LinkedIn prospect research, Sales Navigator, and Dripify outreach, helping businesses strengthen their digital presence and generate opportunities. My portfolio brings these disciplines together through PipelineOS CRM, StockFlow Inventory, Orexa, analytics platforms, creative campaigns, and automation projects. Need software, AI automation, creative production, or business solutions? I bring strategy and execution together. One person, multiple disciplines. Let's build something great.",
};

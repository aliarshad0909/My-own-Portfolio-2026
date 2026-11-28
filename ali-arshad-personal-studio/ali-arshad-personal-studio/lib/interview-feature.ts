/**
 * Single configuration point for the 90-second "Meet Ali" personal interview feature.
 *
 * Honesty & activation rule:
 * - While `status` is `"placeholder"`, the About page renders a clean 90-second
 *   video card placeholder without fabricating footage, Ali's voice, quotes, or
 *   a transcript.
 * - When Ali supplies his final 90-second interview recording:
 *   1. Drop the web-optimized H.264 MP4 (+faststart) into `public/videos/meet-ali-interview.mp4`.
 *   2. Drop a 16:9 WebP poster frame into `public/images/portraits/meet-ali-poster.webp`.
 *   3. Drop WebVTT captions into `public/videos/meet-ali-interview.vtt`.
 *   4. Set `status: "ready"`, populate `videoSrc`, `posterSrc`, `captionsSrc`, and
 *      `transcript` below — the About page card switches seamlessly to native
 *      lazy-loaded HTML5 playback with zero layout or component rewrites.
 */

export type InterviewFeatureConfig = {
  status: "placeholder" | "ready";
  anchorId: string;
  durationLabel: string;
  aspectLabel: string;
  title: string;
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
  status: "placeholder",
  anchorId: "meet-ali-interview",
  durationLabel: "90 seconds",
  aspectLabel: "16:9 Studio Intro",
  title: "Meet Ali — 90-second studio introduction",
  teaserSummary:
    "Curious how one studio covers software engineering, AI automation, creative production, and global sourcing? See who you work with directly.",
  placeholderHeadline: "90-second personal studio interview — footage pending",
  placeholderDescription:
    "This slot is reserved for Ali's unscripted 90-second studio introduction. Real footage, captions, and transcript will be published here once recorded — nothing is AI-voiced or fabricated in the meantime.",
  plannedTopics: [
    "Why business operations, creative production, and software live under one roof",
    "How remote discovery, written scoping, and staged reviews run with clients",
    "When Ali delivers directly vs. coordinating vetted collaborators",
  ],
  posterSrc: "/images/portraits/portrait-about.webp",
  posterAlt: "Portrait of Ali Arshad, founder of Ali Arshad Personal Studio",
  videoSrc: "",
  captionsSrc: "",
  transcript: "",
};

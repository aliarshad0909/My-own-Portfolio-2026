/**
 * Creative Production & Video Showcase data layer.
 *
 * Rights & attribution governance:
 *  - Every publicly embedded video must have clear, verified publication rights.
 *  - Entries below with `approvedForPublic: true` are Ali Arshad's own
 *    studio-authored Remotion and Blender motion assets stored in `public/videos/`,
 *    labeled explicitly as "Studio Motion Demo" and kept distinct from the
 *    technical "Motion Production: Media Pipeline" engineering case study.
 *  - External client footage supplied privately in `Client videos/` stays
 *    unpublished until written client/talent clearance is confirmed by Ali Arshad.
 *    See `docs/VIDEO-CLEARANCE-MANIFEST.md` for the full per-clip clearance tracker.
 */

export type ShowcaseVideoItem = {
  id: string;
  title: string;
  workType: "Studio Motion Demo" | "Approved Client Work";
  service: "Motion Graphics" | "Video Editing" | "Short-Form Social" | "3D Brand Motion";
  src: string;
  webmSrc?: string;
  poster: string;
  posterAlt: string;
  aspectRatio: "16/9" | "9/16" | "4/5" | "1/1";
  formatMeta: string;
  objective: string;
  workPerformed: string;
  deliverables: string[];
  transcriptSummary: string;
  approvedForPublic: boolean;
};

export const CREATIVE_SHOWCASE_VIDEOS: ShowcaseVideoItem[] = [
  {
    id: "capabilities-pipeline-reel",
    title: "Studio Capabilities Pipeline — Brand & Systems Motion Reel",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    src: "/videos/capabilities-pipeline.mp4",
    poster: "/images/videos/capabilities-pipeline-poster.webp",
    posterAlt: "Motion graphics frame displaying Creative Production, Development, and AI Automation linked as one continuous studio pipeline",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (375 KB)",
    objective: "Explain how brand visuals, Next.js software engineering, and AI automation operate as one continuous delivery sequence.",
    workPerformed: "Scripted timeline composition, obsidian-and-coral typography hierarchy, easing curves, and web-ready H.264 +faststart encoding in Remotion.",
    deliverables: ["16:9 web hero motion clip", "Exact-aspect WebP poster frame", "Reduced-motion static fallback"],
    transcriptSummary: "Visual sequence connecting Create (Brand, 3D, Video) → Build (Next.js, Commerce) → Automate (n8n, AI Agents): one continuous pipeline with zero agency hand-offs.",
    approvedForPublic: true,
  },
  {
    id: "n8n-workflow-explainer",
    title: "Automated Lead Routing — n8n Workflow Explainer Clip",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    src: "/videos/n8n-workflow.mp4",
    poster: "/images/videos/n8n-workflow-poster.webp",
    posterAlt: "Dark motion graphics sequence illustrating New Inquiry trigger, Qualified condition, Enrich and Route action, and CRM follow-up outcome",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (191 KB)",
    objective: "Clarify how a multi-step webhook-to-CRM automation works in under 10 seconds without overwhelming non-technical buyers.",
    workPerformed: "Storyboard beat layout, node-highlight sequencing, brand-locked typographic contrast, and lightweight web encode.",
    deliverables: ["UI workflow explainer clip", "WebP poster image", "Accessible text summary"],
    transcriptSummary: "Illustrative four-stage automated workflow: Trigger (New inquiry) → Condition (Qualified?) → Action (Enrich + route) → Outcome (CRM + follow-up).",
    approvedForPublic: true,
  },
  {
    id: "ai-agent-flow-explainer",
    title: "Grounded AI Agent Architecture — Product Explainer Clip",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    src: "/videos/ai-agent-flow.mp4",
    poster: "/images/videos/ai-agent-flow-poster.webp",
    posterAlt: "Dark motion graphics diagram showing Customer Input connected to Reasoning core, Knowledge Base, Tools/APIs, and Useful Answer response",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (231 KB)",
    objective: "Visualize how scoped AI agents retrieve grounded documentation and invoke defined tools before answering.",
    workPerformed: "Motion design for central agent hub, directional signal pulses, readable label pacing, and compressed web MP4 export.",
    deliverables: ["SaaS explainer loop", "WebP poster frame", "Readable architecture caption"],
    transcriptSummary: "Visualizes a scoped AI agent flow: Input (Customer asks) → Agent (Reason using Your content knowledge base and Actions/APIs tools) → Response (Useful answer).",
    approvedForPublic: true,
  },
  {
    id: "studio-3d-mark-turntable",
    title: "Signature 3D Studio Monogram — Sculpted Metallic Turntable",
    workType: "Studio Motion Demo",
    service: "3D Brand Motion",
    src: "/videos/mark-3d.mp4",
    webmSrc: "/videos/mark-3d.webm",
    poster: "/images/videos/mark-3d-poster.webp",
    posterAlt: "Sculpted 3D metallic A studio monogram lit with warm coral and copper rim highlights against dark obsidian",
    aspectRatio: "1/1",
    formatMeta: "1:1 · 720×720 · 6s · Dual H.264 (150 KB) & VP9 WebM (68 KB)",
    objective: "Demonstrate lightweight, seamless 3D brand-mark lighting and web dual-codec delivery without heavy WebGL runtime overhead.",
    workPerformed: "3D bevel shading, warm coral/copper studio rim lighting, seamless 6-second rotation loop, and dual H.264 + VP9 web compression.",
    deliverables: ["Dual H.264 MP4 + VP9 WebM loop", "WebP static poster frame", "Accessible reduced-motion fallback"],
    transcriptSummary: "Six-second studio brand motion study showcasing a dark sculpted metallic 'A' monogram rotating smoothly under warm coral edge lighting.",
    approvedForPublic: true,
  },
];

export const APPROVED_PUBLIC_VIDEOS = CREATIVE_SHOWCASE_VIDEOS.filter((v) => v.approvedForPublic);

export const VIDEO_CLEARANCE_SUMMARY = {
  approvedStudioCount: APPROVED_PUBLIC_VIDEOS.length,
  heldPendingClearanceCount: 8,
  manifestRepoPath: "docs/VIDEO-CLEARANCE-MANIFEST.md",
} as const;

export const CLIENT_VIDEO_RIGHTS_NOTICE =
  "External client video edits are reviewed privately during discovery and only published on this website after written client, brand, and talent permission is confirmed (currently 8 private clips are held pending written clearance). All playable clips above are first-party Studio Motion Demos authored directly by Ali Arshad and kept distinct from the Motion Production: Media Pipeline engineering case study.";

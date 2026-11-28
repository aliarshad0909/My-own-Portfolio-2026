/**
 * Creative Production & Video Showcase data layer.
 *
 * Publication & attribution governance:
 *  - Every publicly embedded video below is authorized for publication on
 *    aliarshad.co:
 *      (a) 5 first-party Studio Motion & Narrative Demos (Remotion, Blender 3D,
 *          and the original F003 + ElevenLabs vertical narrative teaser cut)
 *      (b) 8 authorized portfolio / client video edits confirmed by Ali Arshad on
 *          2026-11-28, web-optimized to H.264 +faststart MP4 with WebP posters,
 *          WebVTT caption/summary tracks, and original credits/watermarks preserved.
 *  - Every clip clearly discloses its work type ("Studio Motion Demo" vs.
 *    "Authorized Portfolio Edit"), original credits/branding where present, and
 *    exact editing/motion scope — never misrepresenting authorship.
 *  - See `docs/MEDIA-ASSETS-AND-DEMOS-INVENTORY.md` for the full file-by-file inventory.
 */

export type ShowcaseVideoItem = {
  id: string;
  title: string;
  workType: "Studio Motion Demo" | "Authorized Portfolio Edit";
  service: "Motion Graphics" | "Video Editing" | "Short-Form Social" | "3D Brand Motion";
  sections: ("all" | "video-editing" | "social-video" | "motion" | "case-study")[];
  src: string;
  webmSrc?: string;
  captionsSrc?: string;
  poster: string;
  posterAlt: string;
  aspectRatio: "16/9" | "9/16" | "4/5" | "1/1";
  formatMeta: string;
  objective: string;
  workPerformed: string;
  attributionNote?: string;
  deliverables: string[];
  transcriptSummary: string;
  approvedForPublic: boolean;
};

export const CREATIVE_SHOWCASE_VIDEOS: ShowcaseVideoItem[] = [
  // ── 8 Authorized Portfolio & Client Video Edits (Client videos/) ────────────
  {
    id: "llm-linkedin-explainer-reel",
    title: "LinkedIn Creator Explainer — Demystifying LLM Jargon",
    workType: "Authorized Portfolio Edit",
    service: "Short-Form Social",
    sections: ["all", "social-video", "video-editing", "motion"],
    src: "/videos/portfolio/llm-linkedin-explainer-reel.mp4",
    captionsSrc: "/videos/portfolio/llm-linkedin-explainer-reel.vtt",
    poster: "/images/videos/llm-linkedin-explainer-reel-poster.webp",
    posterAlt: "Vertical LinkedIn explainer frame showing a presenter with a lavalier mic, floating office B-roll cards, and kinetic italic captions",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 14s · H.264 Faststart MP4 (2.3 MB)",
    objective: "Hold executive attention in a fast LinkedIn feed while breaking down technical AI/LLM concepts in plain language.",
    workPerformed: "Tight jump-cut pacing, layered floating B-roll cards, custom serif-and-sans kinetic caption styling, and crisp dialogue EQ.",
    attributionNote: "Authorized portfolio edit · Original presenter footage & brand identity preserved.",
    deliverables: ["9:16 LinkedIn / Reels vertical cut", "Kinetic mixed-type captions", "Layered visual B-roll inserts"],
    transcriptSummary: "Short-form LinkedIn presenter reel breaking down everyday AI/LLM terminology from workplace meetings using floating editorial B-roll frames and timed kinetic subtitles.",
    approvedForPublic: true,
  },
  {
    id: "nathan-barry-creator-documentary-edit",
    title: "Creator-Economy Long-Form Documentary Edit — Nathan Barry / Kit",
    workType: "Authorized Portfolio Edit",
    service: "Video Editing",
    sections: ["all", "video-editing", "motion", "case-study"],
    src: "/videos/portfolio/nathan-barry-creator-documentary-edit.mp4",
    captionsSrc: "/videos/portfolio/nathan-barry-creator-documentary-edit.vtt",
    poster: "/images/videos/nathan-barry-creator-documentary-edit-poster.webp",
    posterAlt: "16:9 documentary edit frame showing a 3D-angled web showcase of the Kit creator platform on a dark studio canvas",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1280×720 · 71s · H.264 Faststart MP4 (5.5 MB)",
    objective: "Keep a 70-second YouTube documentary segment visually alive with custom 3D UI motion cards, editorial callouts, and sound design.",
    workPerformed: "Long-form narrative pacing, 3D perspective browser/card animation, archival creator slide compositing, transitions, and audio polish.",
    attributionNote: "Authorized portfolio editing showcase · Original Kit / Nathan Barry subject branding and archival creator references preserved intact.",
    deliverables: ["16:9 YouTube documentary edit", "3D angled UI & web motion graphics", "Audio mixing & rhythmic sound design"],
    transcriptSummary: "Seventy-one-second creator-economy documentary edit covering Nathan Barry and the Kit platform, combining talking-head storytelling with animated 3D web interface visuals and creator slides.",
    approvedForPublic: true,
  },
  {
    id: "dr-john-delony-longform-edit",
    title: "Podcast & Author Documentary Edit — Dr. John Delony Showcase",
    workType: "Authorized Portfolio Edit",
    service: "Video Editing",
    sections: ["all", "video-editing", "motion", "case-study"],
    src: "/videos/portfolio/dr-john-delony-longform-edit.mp4",
    captionsSrc: "/videos/portfolio/dr-john-delony-longform-edit.vtt",
    poster: "/images/videos/dr-john-delony-longform-edit-poster.webp",
    posterAlt: "16:9 documentary motion graphic frame displaying four published books and conversation cards by Dr. John Delony against dark navy",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1280×720 · 70s · H.264 Faststart MP4 (5.7 MB)",
    objective: "Elevate long-form podcast commentary into a documentary-grade intro sequence with animated book spreads, visual emphasis, and pacing.",
    workPerformed: "Editorial story assembly, animated 3D book-cover lineups, dark-navy title treatments, motion graphics callouts, and dialogue cleanup.",
    attributionNote: "Authorized portfolio editing showcase · Original show footage, author book covers, and set branding preserved intact.",
    deliverables: ["16:9 documentary / YouTube edit", "Animated book & product lineups", "Custom motion graphics transitions"],
    transcriptSummary: "Seventy-second long-form documentary edit introducing Dr. John Delony's work, pairing studio podcast commentary with animated book spreads, visual callouts, and paced sound design.",
    approvedForPublic: true,
  },
  {
    id: "brightarc-orthodontics-reel",
    title: "BrightArc Orthodontics — Clinic Promo & 3D Logo Reveal",
    workType: "Authorized Portfolio Edit",
    service: "Motion Graphics",
    sections: ["all", "social-video", "motion"],
    src: "/videos/portfolio/brightarc-orthodontics-reel.mp4",
    captionsSrc: "/videos/portfolio/brightarc-orthodontics-reel.vtt",
    poster: "/images/videos/brightarc-orthodontics-reel-poster.webp",
    posterAlt: "Vertical clinic promotional frame showing orthodontic clinicians caring for a patient with clean white caption text",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 33s · H.264 Faststart MP4 (4.0 MB)",
    objective: "Deliver a clean, trustworthy vertical clinic promo blending clinical B-roll, legible captions, and a sculpted 3D brand outro.",
    workPerformed: "Story edit pacing, clean clinical color consistency, readable on-screen captioning, sound design, and 3D BrightArc logo outro reveal.",
    attributionNote: "Authorized portfolio edit · Original BrightArc Orthodontics branding and outro preserved intact.",
    deliverables: ["9:16 local-business promo reel", "Clean captions & B-roll assembly", "3D brand logo reveal outro"],
    transcriptSummary: "Thirty-three-second orthodontic clinic promotional reel combining patient-care footage, clear accessible captions, upbeat pacing, and a custom 3D BrightArc Orthodontics logo reveal.",
    approvedForPublic: true,
  },
  {
    id: "founder-growth-motion-reel",
    title: "Founder Reflection Reel — Kinetic Dot-Grid Motion & B-Roll",
    workType: "Authorized Portfolio Edit",
    service: "Short-Form Social",
    sections: ["all", "social-video", "motion", "video-editing"],
    src: "/videos/portfolio/founder-growth-motion-reel.mp4",
    captionsSrc: "/videos/portfolio/founder-growth-motion-reel.vtt",
    poster: "/images/videos/founder-growth-motion-reel-poster.webp",
    posterAlt: "Vertical talking-head frame of a founder sharing business insights paired with kinetic motion graphics in a short-form reel",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 33s · H.264 Faststart MP4 (3.6 MB)",
    objective: "Transform raw mobile founder commentary into an energetic social reel using custom kinetic dot-grid motion graphics and rhythmic B-roll.",
    workPerformed: "Retention-focused narrative cut, custom dot-grid motion graphic sequences, company B-roll integration, and crisp voiceover leveling.",
    attributionNote: "Authorized portfolio edit · Original founder footage and company visual references preserved.",
    deliverables: ["9:16 founder personal-brand reel", "Custom kinetic dot-grid graphics", "Audio leveling & B-roll pacing"],
    transcriptSummary: "Thirty-three-second founder reflection reel alternating candid mobile commentary with custom geometric dot-grid motion graphics and contextual company B-roll.",
    approvedForPublic: true,
  },
  {
    id: "investing-in-yourself-reel",
    title: "Outdoor Creator Story — “Investing in Yourself” Kinetic Cut",
    workType: "Authorized Portfolio Edit",
    service: "Short-Form Social",
    sections: ["all", "social-video", "video-editing"],
    src: "/videos/portfolio/investing-in-yourself-reel.mp4",
    captionsSrc: "/videos/portfolio/investing-in-yourself-reel.vtt",
    poster: "/images/videos/investing-in-yourself-reel-poster.webp",
    posterAlt: "Vertical outdoor creator frame featuring a speaker walking along a sunlit path with editorial multi-font kinetic captions",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 42s · H.264 Faststart MP4 (9.9 MB)",
    objective: "Keep a 42-second outdoor walking monologue visually compelling with expressive editorial typography that reacts to speech cadence.",
    workPerformed: "Beat-synced multi-font kinetic typography, foreground/background text layering, outdoor audio cleanup, and natural color polish.",
    attributionNote: "Authorized portfolio edit · Original deliverable attribution/watermark (“sans edit”) preserved untouched.",
    deliverables: ["9:16 Reels / TikTok talking-head edit", "Expressive editorial kinetic captions", "Outdoor voice cleanup & pacing"],
    transcriptSummary: "Forty-two-second outdoor talking-head reel about investing in yourself and slowing down intentionally, driven by layered serif/sans kinetic captions and rhythmic cuts.",
    approvedForPublic: true,
  },
  {
    id: "podcast-hook-short-edit",
    title: "Podcast Hook Short — High-Contrast Monochrome & Motion Cut",
    workType: "Authorized Portfolio Edit",
    service: "Short-Form Social",
    sections: ["all", "social-video", "video-editing"],
    src: "/videos/portfolio/podcast-hook-short-edit.mp4",
    captionsSrc: "/videos/portfolio/podcast-hook-short-edit.vtt",
    poster: "/images/videos/podcast-hook-short-edit-poster.webp",
    posterAlt: "High-contrast monochrome vertical reel frame with bold pink and white accent hook typography",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 22s · H.264 Faststart MP4 (3.7 MB)",
    objective: "Stop the scroll in the first two seconds of a podcast clip using stark monochrome visual contrast and punchy accent typography.",
    workPerformed: "Hook restructuring, monochrome/color-accent visual contrast, B-roll cutaways, punchy kinetic subtitles, and sound-effect hits.",
    attributionNote: "Authorized portfolio edit · Original podcast speaker audio and visual footage preserved.",
    deliverables: ["9:16 short-form podcast hook", "High-contrast monochrome grade", "Kinetic emphasis typography & SFX"],
    transcriptSummary: "Twenty-two-second vertical podcast hook clip pairing stark monochrome visual styling and bold accent typography with rapid B-roll cuts for short-form retention.",
    approvedForPublic: true,
  },
  {
    id: "barber-craft-story-reel",
    title: "Local Craft Story Reel — Kinetic Price & Motion Typography",
    workType: "Authorized Portfolio Edit",
    service: "Short-Form Social",
    sections: ["all", "social-video", "motion"],
    src: "/videos/portfolio/barber-craft-story-reel.mp4",
    captionsSrc: "/videos/portfolio/barber-craft-story-reel.vtt",
    poster: "/images/videos/barber-craft-story-reel-poster.webp",
    posterAlt: "Vertical kinetic typography frame displaying Charging $60 a cut with animated motion elements",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 16s · H.264 Faststart MP4 (750 KB)",
    objective: "Turn a 15-second barbershop pricing story into a high-energy social reel with punchy kinetic typography and smooth speed ramps.",
    workPerformed: "Fast-paced 15-second narrative assembly, kinetic counter/price graphics, smooth motion transitions, and crisp audio hits.",
    attributionNote: "Authorized portfolio edit · Original barbershop branding and deliverable watermark (“Sans Edits”) preserved untouched.",
    deliverables: ["9:16 15-second punchy reel", "Kinetic typography & motion props", "Speed ramps & sound design"],
    transcriptSummary: "Sixteen-second barbershop storytelling reel combining bold kinetic pricing typography, animated visual callouts, and rapid transitions for short-form social feeds.",
    approvedForPublic: true,
  },

  // ── 5 First-Party Studio Narrative & Motion Demos (F003, Remotion & Blender 3D)
  {
    id: "f003-thirty-copies-narrative-reel",
    title: "Narrative Short-Film Teaser — “Thirty Copies” (AI Film & Voiceover Cut)",
    workType: "Studio Motion Demo",
    service: "Short-Form Social",
    sections: ["all", "social-video", "video-editing", "motion", "case-study"],
    src: "/videos/portfolio/f003-thirty-copies-narrative-reel.mp4",
    captionsSrc: "/videos/portfolio/f003-thirty-copies-narrative-reel.vtt",
    poster: "/images/videos/f003-thirty-copies-narrative-reel-poster.webp",
    posterAlt: "Overhead vertical frame of a quiet sunlit birthday party table set with paper hats, balloons, and a glowing cake from the Thirty Copies short-film teaser",
    aspectRatio: "9/16",
    formatMeta: "9:16 · 720×1280 · 25s · H.264 Faststart MP4 (5.3 MB)",
    objective: "Demonstrate cohesive short-form narrative assembly pairing AI-generated vertical cinema shots with timed ElevenLabs voiceover cues and atmospheric audio mixing.",
    workPerformed: "Eight-shot story assembly from cleared F003 footage, paced visual rhythm, timed placement of all three ElevenLabs voiceover lines, -16 LUFS stereo audio mix, and WebVTT captions.",
    attributionNote: "Original studio narrative edit assembled from cleared F003 scene shots and ElevenLabs AI narration cues; raw shot archives remain private.",
    deliverables: ["9:16 narrative short-film teaser", "Synchronized ElevenLabs VO mix", "Timecoded WebVTT captions & WebP poster"],
    transcriptSummary: "Twenty-five-second vertical narrative teaser tracing a quiet birthday preparation across eight shots with three spoken voiceover lines: “Thirty copies. One under every door.” / “It’s not about you. I promise.” / “Go on. Make a wish.”",
    approvedForPublic: true,
  },
  {
    id: "capabilities-pipeline-reel",
    title: "Studio Capabilities Pipeline — Brand & Systems Motion Reel",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    sections: ["all", "motion", "case-study"],
    src: "/videos/capabilities-pipeline.mp4",
    poster: "/images/videos/capabilities-pipeline-poster.webp",
    posterAlt: "Motion graphics frame displaying Creative Production, Development, and AI Automation linked as one continuous studio pipeline",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (375 KB)",
    objective: "Explain how brand visuals, Next.js software engineering, and AI automation operate as one continuous delivery sequence.",
    workPerformed: "Scripted timeline composition, obsidian-and-coral typography hierarchy, easing curves, and web-ready H.264 +faststart encoding in Remotion.",
    attributionNote: "First-party studio-authored Remotion motion asset by Ali Arshad.",
    deliverables: ["16:9 web hero motion clip", "Exact-aspect WebP poster frame", "Reduced-motion static fallback"],
    transcriptSummary: "Visual sequence connecting Create (Brand, 3D, Video) → Build (Next.js, Commerce) → Automate (n8n, AI Agents): one continuous pipeline with zero agency hand-offs.",
    approvedForPublic: true,
  },
  {
    id: "n8n-workflow-explainer",
    title: "Automated Lead Routing — n8n Workflow Explainer Clip",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    sections: ["all", "motion", "case-study"],
    src: "/videos/n8n-workflow.mp4",
    poster: "/images/videos/n8n-workflow-poster.webp",
    posterAlt: "Dark motion graphics sequence illustrating New Inquiry trigger, Qualified condition, Enrich and Route action, and CRM follow-up outcome",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (191 KB)",
    objective: "Clarify how a multi-step webhook-to-CRM automation works in under 10 seconds without overwhelming non-technical buyers.",
    workPerformed: "Storyboard beat layout, node-highlight sequencing, brand-locked typographic contrast, and lightweight web encode.",
    attributionNote: "First-party studio-authored Remotion explainer by Ali Arshad.",
    deliverables: ["UI workflow explainer clip", "WebP poster image", "Accessible text summary"],
    transcriptSummary: "Illustrative four-stage automated workflow: Trigger (New inquiry) → Condition (Qualified?) → Action (Enrich + route) → Outcome (CRM + follow-up).",
    approvedForPublic: true,
  },
  {
    id: "ai-agent-flow-explainer",
    title: "Grounded AI Agent Architecture — Product Explainer Clip",
    workType: "Studio Motion Demo",
    service: "Motion Graphics",
    sections: ["all", "motion", "case-study"],
    src: "/videos/ai-agent-flow.mp4",
    poster: "/images/videos/ai-agent-flow-poster.webp",
    posterAlt: "Dark motion graphics diagram showing Customer Input connected to Reasoning core, Knowledge Base, Tools/APIs, and Useful Answer response",
    aspectRatio: "16/9",
    formatMeta: "16:9 · 1600×900 · 8s · H.264 Faststart MP4 (231 KB)",
    objective: "Visualize how scoped AI agents retrieve grounded documentation and invoke defined tools before answering.",
    workPerformed: "Motion design for central agent hub, directional signal pulses, readable label pacing, and compressed web MP4 export.",
    attributionNote: "First-party studio-authored Remotion explainer by Ali Arshad.",
    deliverables: ["SaaS explainer loop", "WebP poster frame", "Readable architecture caption"],
    transcriptSummary: "Visualizes a scoped AI agent flow: Input (Customer asks) → Agent (Reason using Your content knowledge base and Actions/APIs tools) → Response (Useful answer).",
    approvedForPublic: true,
  },
  {
    id: "studio-3d-mark-turntable",
    title: "Signature 3D Studio Monogram — Sculpted Metallic Turntable",
    workType: "Studio Motion Demo",
    service: "3D Brand Motion",
    sections: ["all", "motion", "case-study"],
    src: "/videos/mark-3d.mp4",
    webmSrc: "/videos/mark-3d.webm",
    poster: "/images/videos/mark-3d-poster.webp",
    posterAlt: "Sculpted 3D metallic A studio monogram lit with warm coral and copper rim highlights against dark obsidian",
    aspectRatio: "1/1",
    formatMeta: "1:1 · 720×720 · 6s · Dual H.264 (150 KB) & VP9 WebM (68 KB)",
    objective: "Demonstrate lightweight, seamless 3D brand-mark lighting and web dual-codec delivery without heavy WebGL runtime overhead.",
    workPerformed: "3D bevel shading, warm coral/copper studio rim lighting, seamless 6-second rotation loop, and dual H.264 + VP9 web compression.",
    attributionNote: "First-party studio-authored Blender 3D brand motion asset by Ali Arshad.",
    deliverables: ["Dual H.264 MP4 + VP9 WebM loop", "WebP static poster frame", "Accessible reduced-motion fallback"],
    transcriptSummary: "Six-second studio brand motion study showcasing a dark sculpted metallic 'A' monogram rotating smoothly under warm coral edge lighting.",
    approvedForPublic: true,
  },
];

export const APPROVED_PUBLIC_VIDEOS = CREATIVE_SHOWCASE_VIDEOS.filter((v) => v.approvedForPublic);

export function videosForCreativeSection(
  section: "all" | "video-editing" | "social-video" | "motion" | "case-study",
): ShowcaseVideoItem[] {
  return APPROVED_PUBLIC_VIDEOS.filter((v) => v.sections.includes(section));
}

export const VIDEO_CLEARANCE_SUMMARY = {
  approvedStudioCount: APPROVED_PUBLIC_VIDEOS.filter((v) => v.workType === "Studio Motion Demo").length,
  approvedClientPortfolioCount: APPROVED_PUBLIC_VIDEOS.filter((v) => v.workType === "Authorized Portfolio Edit").length,
  totalPublishedCount: APPROVED_PUBLIC_VIDEOS.length,
  heldPendingClearanceCount: 0,
  manifestRepoPath: "docs/MEDIA-ASSETS-AND-DEMOS-INVENTORY.md",
} as const;

export const CLIENT_VIDEO_RIGHTS_NOTICE =
  "All 13 playable clips above (8 authorized portfolio & client video edits plus 5 first-party studio narrative and motion demos) are web-optimized with lazy click-to-play delivery, preserved deliverable credits/branding, and accessible captions/transcripts — kept distinct from the Motion Production: Media Pipeline engineering case study.";

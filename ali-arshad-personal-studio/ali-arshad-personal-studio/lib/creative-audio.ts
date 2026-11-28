/**
 * Cleared ElevenLabs AI Voiceover & Audio Production Samples.
 *
 * Governance & attribution:
 * - Every audio sample below was listened to directly and transcribed verbatim
 *   so its public display title accurately describes the spoken audio.
 * - Original ElevenLabs source filenames and SHA-256 hashes are preserved in
 *   `docs/MEDIA-ASSETS-AND-DEMOS-INVENTORY.md` (exact duplicate WAVs excluded).
 * - Delivered as lightweight loudness-normalized MP3s (`preload="none"`) with
 *   verbatim transcripts and WebVTT tracks so zero audio bytes load until played.
 */

export type AudioShowcaseSection = "all" | "video-editing" | "social-video" | "motion" | "ai-agents" | "case-study";

export type ShowcaseAudioItem = {
  id: string;
  title: string;
  category: "Narrative Narration" | "Dramatic Dialogue" | "Trailer & End-Card Cue";
  badge: "ElevenLabs AI Voiceover";
  src: string;
  captionsSrc: string;
  durationLabel: string;
  formatMeta: string;
  transcript: string;
  description: string;
  useCases: readonly string[];
  sections: readonly AudioShowcaseSection[];
  sourceFileRecordedInManifest: string;
  linkedVideoId?: string;
};

export const CREATIVE_AUDIO_SAMPLES: readonly ShowcaseAudioItem[] = [
  {
    id: "elevenlabs-thirty-copies-narration",
    title: "Narrative Voiceover Cue — “Thirty Copies”",
    category: "Narrative Narration",
    badge: "ElevenLabs AI Voiceover",
    src: "/audio/elevenlabs-thirty-copies-narration.mp3",
    captionsSrc: "/audio/elevenlabs-thirty-copies-narration.vtt",
    durationLabel: "3.6s",
    formatMeta: "3.6s · 128 kbps Mono MP3 (58 KB) · Loudness-Normalized (-16 LUFS)",
    transcript: "“Thirty copies. One under every door.”",
    description:
      "Low, measured suspense narration demonstrating deliberate pacing, subtle breath control, and quiet tension for narrative hooks and short-film openings.",
    useCases: ["Short-form narrative hooks", "Documentary & story teasers", "Voiceover timing prototypes"],
    sections: ["all", "video-editing", "social-video", "motion", "ai-agents", "case-study"],
    sourceFileRecordedInManifest: "ElevenLabs_2026-11-28T08_40_10__s50_sim75_v4.wav",
    linkedVideoId: "f003-thirty-copies-narrative-reel",
  },
  {
    id: "elevenlabs-not-about-you-dialogue",
    title: "Intimate Dialogue Cue — “It’s Not About You”",
    category: "Dramatic Dialogue",
    badge: "ElevenLabs AI Voiceover",
    src: "/audio/elevenlabs-not-about-you-dialogue.mp3",
    captionsSrc: "/audio/elevenlabs-not-about-you-dialogue.vtt",
    durationLabel: "3.2s",
    formatMeta: "3.2s · 128 kbps Mono MP3 (50 KB) · Loudness-Normalized (-16 LUFS)",
    transcript: "“It’s not about you. I promise.”",
    description:
      "Close-mic dramatic voiceover line showcasing natural pause cadence and restrained emotional tone for story edits, brand films, and conversational AI voice testing.",
    useCases: ["Brand storytelling & ad cuts", "Character & dialogue pacing", "Conversational AI voice tuning"],
    sections: ["all", "video-editing", "social-video", "motion", "ai-agents", "case-study"],
    sourceFileRecordedInManifest: "ElevenLabs_2026-11-28T08_42_30__s50_sim75_v4.wav",
    linkedVideoId: "f003-thirty-copies-narrative-reel",
  },
  {
    id: "elevenlabs-make-a-wish-cue",
    title: "Cinematic Closing Cue — “Make a Wish”",
    category: "Trailer & End-Card Cue",
    badge: "ElevenLabs AI Voiceover",
    src: "/audio/elevenlabs-make-a-wish-cue.mp3",
    captionsSrc: "/audio/elevenlabs-make-a-wish-cue.vtt",
    durationLabel: "2.5s",
    formatMeta: "2.5s · 128 kbps Mono MP3 (40 KB) · Loudness-Normalized (-16 LUFS)",
    transcript: "“Go on. Make a wish.”",
    description:
      "Soft, evocative closing prompt engineered to land cleanly over final visual beats, motion end-cards, or social reel cliffhangers.",
    useCases: ["Trailer tags & closing beats", "Motion graphics end-cards", "Social reel sound design"],
    sections: ["all", "video-editing", "social-video", "motion", "ai-agents", "case-study"],
    sourceFileRecordedInManifest: "ElevenLabs_2026-11-28T08_42_46__s50_sim75_v4.wav",
    linkedVideoId: "f003-thirty-copies-narrative-reel",
  },
];

export function audioForCreativeSection(section: AudioShowcaseSection): ShowcaseAudioItem[] {
  if (section === "all") return [...CREATIVE_AUDIO_SAMPLES];
  return CREATIVE_AUDIO_SAMPLES.filter((item) => item.sections.includes(section));
}

export const AUDIO_SHOWCASE_NOTICE =
  "These three voiceover cues were generated with ElevenLabs for original studio storytelling and AI-voice production testing (heard mixed into the “Thirty Copies” vertical narrative reel above). Exact verbatim transcripts are shown on every card; one bit-identical duplicate WAV was excluded from public duplication and recorded in the asset manifest.";

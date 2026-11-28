import libraryJson from "@/public/data/creator-library.json" with { type: "json" };
import oculusJson from "@/public/data/oculus-sounds.json" with { type: "json" };

export const CREATOR_LIBRARY_PATH = "/creator-library";

export type CreatorLibraryCategory =
  | "Blender Scenes & 3D Assets"
  | "After Effects Templates"
  | "Motion Graphics & Premiere Templates"
  | "Video Transitions"
  | "Sound Effects"
  | "Music Stings & Voiceover Cues"
  | "Stock Photography & Video B-Roll"
  | "Starter Packs & Directories";

export const CREATOR_LIBRARY_CATEGORIES: readonly CreatorLibraryCategory[] = [
  "Blender Scenes & 3D Assets",
  "After Effects Templates",
  "Motion Graphics & Premiere Templates",
  "Video Transitions",
  "Sound Effects",
  "Music Stings & Voiceover Cues",
  "Stock Photography & Video B-Roll",
  "Starter Packs & Directories",
];

export type AudioPreviewTrack = {
  label: string;
  file: string;
  durationSec: number;
  src: string;
};

export type CreatorLibraryItem = {
  slug: string;
  title: string;
  category: CreatorLibraryCategory;
  summary: string;
  description: string;
  downloadUrl: string;
  downloadFilename: string;
  sourceFilename: string;
  sourceLocation: string;
  fileFormat: string;
  sizeBytes: number;
  sizeLabel: string;
  sha256: string;
  compatibility: string;
  creatorCredit: string;
  licenseLabel: string;
  attributionNote: string;
  isThirdParty: boolean;
  tags: string[];
  previewImage: string | null;
  previewVideo: string | null;
  previewAudio: AudioPreviewTrack[];
  includedFiles: string[];
  fileCount: number;
  oculusGroupSlug: string | null;
  relatedServices: string[];
};

export type CreatorLibraryException = {
  filename: string;
  sizeLabel: string;
  sha256: string;
  reason: string;
};

export type OculusSoundEntry = {
  file: string;
  title: string;
  groupSlug: string;
  groupLabel: string;
  originalPath: string;
  durationSec: number;
  channels: number;
  sampleRate: number;
  previewSrc: string | null;
};

type RawLibraryPayload = {
  releaseTag: string;
  releaseBaseUrl: string;
  generatedAt: string;
  stats: {
    totalResources: number;
    totalOculusSounds: number;
    totalTopLevelSourceFiles: number;
    publishedUniqueTopLevelSources: number;
    excludedExceptions: number;
    totalDownloadSizeLabel: string;
  };
  items: CreatorLibraryItem[];
  exceptions: CreatorLibraryException[];
};

const DATA = libraryJson as RawLibraryPayload;

export const CREATOR_LIBRARY_META = {
  releaseTag: DATA.releaseTag,
  releaseBaseUrl: DATA.releaseBaseUrl,
  generatedAt: DATA.generatedAt,
} as const;

export const CREATOR_LIBRARY_STATS = DATA.stats;
export const CREATOR_LIBRARY_ITEMS: readonly CreatorLibraryItem[] = DATA.items;
export const CREATOR_LIBRARY_EXCEPTIONS: readonly CreatorLibraryException[] = DATA.exceptions;
export const OCULUS_SOUNDS: readonly OculusSoundEntry[] = oculusJson as OculusSoundEntry[];

export function getCreatorResource(slug: string): CreatorLibraryItem | undefined {
  return CREATOR_LIBRARY_ITEMS.find((item) => item.slug === slug);
}

export function oculusSoundsForGroup(groupSlug: string | null): OculusSoundEntry[] {
  if (!groupSlug) return [];
  if (groupSlug === "ALL") return [...OCULUS_SOUNDS];
  return OCULUS_SOUNDS.filter((s) => s.groupSlug === groupSlug);
}

export function relatedCreatorResources(item: CreatorLibraryItem, limit = 3): CreatorLibraryItem[] {
  const sameCategory = CREATOR_LIBRARY_ITEMS.filter((x) => x.slug !== item.slug && x.category === item.category);
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
  const rest = CREATOR_LIBRARY_ITEMS.filter(
    (x) => x.slug !== item.slug && x.category !== item.category && x.tags.some((t) => item.tags.includes(t)),
  );
  return [...sameCategory, ...rest].slice(0, limit);
}

export const SERVICE_LINK_LABELS: Record<string, string> = {
  "/services/creative-production": "Creative Production Hub",
  "/services/creative-production/video-editing": "Video Editing Services",
  "/services/creative-production/motion": "Motion Graphics Services",
  "/services/creative-production/social-video": "Short-Form Social Video",
  "/services/branding": "Brand Identity Systems",
  "/services/gpu-compute": "GPU & Render Compute",
  "/services/ai-agents": "AI Agents & Voice Workflows",
};

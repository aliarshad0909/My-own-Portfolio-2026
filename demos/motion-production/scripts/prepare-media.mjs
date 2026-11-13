#!/usr/bin/env node
/**
 * Prepares a finished video for the portfolio.
 *
 * From one master file it produces everything the site needs: a web-optimised
 * MP4, a VP9 WebM, a short muted hover preview, a poster frame, and the JSON
 * snippet to paste into lib/projects.ts.
 *
 *   node scripts/prepare-media.mjs master.mov --slug brand-launch-film --title "Brand Launch Film"
 *
 * Requires ffmpeg and ffprobe on PATH.
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const PRESETS = {
  /** Main playable file. CRF 21 is visually clean for motion work without bloating. */
  mp4: { width: 1920, crf: 21, preset: "slow", audioKbps: 128 },
  /** Smaller, better compression, served first where supported. */
  webm: { width: 1920, crf: 32, bitrate: "0", audioKbps: 96 },
  /** Muted hover preview: short, silent, small. */
  preview: { width: 960, crf: 30, seconds: 6, fps: 24 },
  poster: { width: 1920, quality: 4 },
};

export class MediaError extends Error {}

/** Probe a file for the facts the pipeline needs. */
export async function probe(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    file,
  ]);
  const data = JSON.parse(stdout);
  const video = data.streams.find((s) => s.codec_type === "video");
  const audio = data.streams.find((s) => s.codec_type === "audio");
  if (!video) throw new MediaError(`${file} has no video stream.`);
  const [n, d] = (video.r_frame_rate ?? "0/1").split("/").map(Number);
  return {
    width: video.width,
    height: video.height,
    durationSec: Number(data.format.duration ?? video.duration ?? 0),
    fps: d > 0 ? n / d : 0,
    videoCodec: video.codec_name,
    audioCodec: audio?.codec_name ?? null,
    hasAudio: Boolean(audio),
    sizeBytes: Number(data.format.size ?? 0),
  };
}

/** Even dimensions only: H.264 and VP9 both require them. */
export function scaleFilter(targetWidth) {
  return `scale=${targetWidth}:-2:flags=lanczos`;
}

/** Poster at 25% in, or 1s for a very short clip — avoids black first frames. */
export function posterTimestamp(durationSec, override) {
  if (typeof override === "number" && override >= 0) return Math.min(override, Math.max(0, durationSec - 0.1));
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return durationSec < 4 ? Math.min(1, durationSec / 2) : durationSec * 0.25;
}

export function mp4Args(input, output, info, preset = PRESETS.mp4) {
  const width = Math.min(preset.width, info.width);
  const args = [
    "-y", "-i", input,
    "-vf", scaleFilter(width),
    "-c:v", "libx264", "-crf", String(preset.crf), "-preset", preset.preset,
    "-pix_fmt", "yuv420p",
    "-profile:v", "high", "-level", "4.0",
    // Puts the index at the front so the browser can start before the whole file arrives.
    "-movflags", "+faststart",
  ];
  if (info.hasAudio) args.push("-c:a", "aac", "-b:a", `${preset.audioKbps}k`, "-ac", "2");
  else args.push("-an");
  args.push(output);
  return args;
}

export function webmArgs(input, output, info, preset = PRESETS.webm) {
  const width = Math.min(preset.width, info.width);
  const args = [
    "-y", "-i", input,
    "-vf", scaleFilter(width),
    "-c:v", "libvpx-vp9", "-crf", String(preset.crf), "-b:v", preset.bitrate,
    "-row-mt", "1", "-pix_fmt", "yuv420p",
  ];
  if (info.hasAudio) args.push("-c:a", "libopus", "-b:a", `${preset.audioKbps}k`);
  else args.push("-an");
  args.push(output);
  return args;
}

export function previewArgs(input, output, info, preset = PRESETS.preview) {
  const width = Math.min(preset.width, info.width);
  const seconds = Math.min(preset.seconds, Math.max(1, info.durationSec));
  // Start a little in, so the preview opens on content rather than a fade-up.
  const start = info.durationSec > preset.seconds + 2 ? 1 : 0;
  return [
    "-y", "-ss", String(start), "-t", String(seconds), "-i", input,
    "-vf", `${scaleFilter(width)},fps=${preset.fps}`,
    "-c:v", "libx264", "-crf", String(preset.crf), "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-an", // hover previews are always silent
    output,
  ];
}

export function posterArgs(input, output, info, preset = PRESETS.poster, atSec) {
  const width = Math.min(preset.width, info.width);
  return [
    "-y", "-ss", String(posterTimestamp(info.durationSec, atSec)), "-i", input,
    "-frames:v", "1", "-vf", scaleFilter(width),
    "-q:v", String(preset.quality),
    output,
  ];
}

/** The record to paste into lib/projects.ts. */
export function projectSnippet({ slug, title, poster, posterInfo, files }) {
  return {
    cover: {
      src: `/images/projects/${slug}/poster.webp`,
      alt: `${title} — still frame`,
      width: posterInfo.width,
      height: posterInfo.height,
    },
    previewVideo: `/videos/${slug}-preview.mp4`,
    gallery: [
      {
        type: "video",
        src: `/videos/${slug}.mp4`,
        poster: `/images/projects/${slug}/poster.webp`,
        alt: `${title} — full film`,
      },
    ],
    _files: files,
    _poster: poster,
  };
}

async function fileSize(file) {
  try {
    return (await fs.stat(file)).size;
  } catch {
    return 0;
  }
}

export async function prepare(input, { slug, title, outDir = "media", posterAt } = {}) {
  if (!slug) throw new MediaError("A --slug is required; it names every output file.");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new MediaError(`Slug "${slug}" must be lowercase letters, digits and hyphens.`);

  await fs.mkdir(outDir, { recursive: true });
  const info = await probe(input);

  const out = {
    mp4: path.join(outDir, `${slug}.mp4`),
    webm: path.join(outDir, `${slug}.webm`),
    preview: path.join(outDir, `${slug}-preview.mp4`),
    poster: path.join(outDir, `${slug}-poster.jpg`),
  };

  await run("ffmpeg", mp4Args(input, out.mp4, info), { maxBuffer: 1 << 26 });
  await run("ffmpeg", webmArgs(input, out.webm, info), { maxBuffer: 1 << 26 });
  await run("ffmpeg", previewArgs(input, out.preview, info), { maxBuffer: 1 << 26 });
  await run("ffmpeg", posterArgs(input, out.poster, info, PRESETS.poster, posterAt), { maxBuffer: 1 << 26 });

  const posterInfo = await probe(out.poster);
  const files = {};
  for (const [k, f] of Object.entries(out)) files[k] = { path: f, bytes: await fileSize(f) };

  return {
    source: { file: input, ...info },
    outputs: files,
    snippet: projectSnippet({ slug, title: title ?? slug, poster: out.poster, posterInfo, files }),
  };
}

function parseArgs(argv) {
  const [input, ...rest] = argv;
  const opts = { input };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    opts[key] = rest[i + 1];
  }
  return opts;
}

const isMain = process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.input) {
    console.error("Usage: node scripts/prepare-media.mjs <master-file> --slug my-film --title \"My Film\" [--outDir media] [--posterAt 3.5]");
    process.exit(1);
  }
  try {
    const result = await prepare(opts.input, {
      slug: opts.slug,
      title: opts.title,
      outDir: opts.outDir ?? "media",
      posterAt: opts.posterAt ? Number(opts.posterAt) : undefined,
    });
    const mb = (b) => `${(b / 1048576).toFixed(2)} MB`;
    console.log(`\nSource: ${result.source.width}×${result.source.height}, ${result.source.durationSec.toFixed(1)}s, ${result.source.fps.toFixed(2)}fps, ${mb(result.source.sizeBytes)}`);
    for (const [k, f] of Object.entries(result.outputs)) console.log(`  ${k.padEnd(8)} ${f.path}  ${mb(f.bytes)}`);
    console.log("\nPaste into lib/projects.ts:\n");
    const { _files, _poster, ...snippet } = result.snippet;
    console.log(JSON.stringify(snippet, null, 2));
  } catch (err) {
    console.error(`\nFailed: ${err.message}`);
    process.exit(1);
  }
}

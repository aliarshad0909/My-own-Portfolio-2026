#!/usr/bin/env node
/**
 * Reusable web-video optimizer for newly cleared client videos.
 *
 * Leaves original source files untouched and emits:
 *  - Web-optimized H.264 MP4 (+faststart, yuv420p, capped 1080px, AAC 128k)
 *  - Crisp WebP poster frame at 25% duration
 *
 * Usage:
 *   node scripts/optimize-video-for-web.mjs "<source.mp4>" "<output-slug>"
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [inputPath, slug] = process.argv.slice(2);
if (!inputPath || !slug) {
  console.error('Usage: node scripts/optimize-video-for-web.mjs "<input.mp4>" "<slug>"');
  process.exit(1);
}

const appRoot = process.cwd();
const remotionFfmpeg = path.join(
  appRoot,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);
const ffmpegBin = fs.existsSync(remotionFfmpeg) ? remotionFfmpeg : "ffmpeg";

const outVideoDir = path.join(appRoot, "public", "videos", "cleared");
const outPosterDir = path.join(appRoot, "public", "images", "videos");
fs.mkdirSync(outVideoDir, { recursive: true });
fs.mkdirSync(outPosterDir, { recursive: true });

const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const outMp4 = path.join(outVideoDir, `${safeSlug}.mp4`);
const outPoster = path.join(outPosterDir, `${safeSlug}-poster.webp`);

const encode = spawnSync(
  ffmpegBin,
  [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    outMp4,
  ],
  { stdio: "inherit" },
);

if (encode.status !== 0) process.exit(encode.status ?? 1);

const poster = spawnSync(
  ffmpegBin,
  ["-y", "-ss", "00:00:02", "-i", outMp4, "-frames:v", "1", "-q:v", "82", outPoster],
  { stdio: "inherit" },
);

if (poster.status !== 0) process.exit(poster.status ?? 1);

console.log(`Created web video: ${outMp4}`);
console.log(`Created poster:    ${outPoster}`);

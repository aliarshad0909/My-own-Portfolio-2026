#!/usr/bin/env node
/**
 * Builds a storyboard contact sheet from a finished edit: evenly spaced frames
 * laid out in a grid, for the "storyboard frames" section of a case study.
 *
 *   node scripts/contact-sheet.mjs film.mp4 --out sheet.jpg --frames 12 --columns 4
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { MediaError, probe } from "./prepare-media.mjs";

const run = promisify(execFile);

/** Evenly spaced timestamps, inset from both ends so slates and fades are skipped. */
export function frameTimestamps(durationSec, count) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new MediaError("Cannot sample frames from a clip of unknown length.");
  if (!Number.isInteger(count) || count < 1) throw new MediaError("Frame count must be a positive whole number.");
  const inset = Math.min(durationSec * 0.04, 1);
  const usable = Math.max(0, durationSec - inset * 2);
  if (count === 1) return [Number((inset + usable / 2).toFixed(3))];
  return Array.from({ length: count }, (_, i) => Number((inset + (usable * i) / (count - 1)).toFixed(3)));
}

/** Rows needed for a given frame count and column width. */
export const gridRows = (frames, columns) => Math.ceil(frames / Math.max(1, columns));

export function tileFilter({ frames, columns, tileWidth, durationSec }) {
  const rows = gridRows(frames, columns);
  // fps picks one frame every (duration / frames) seconds, which `tile` then lays out.
  const fps = frames / Math.max(0.001, durationSec);
  return `fps=${fps.toFixed(6)},scale=${tileWidth}:-2:flags=lanczos,tile=${columns}x${rows}:margin=12:padding=8:color=0x14161a`;
}

export async function contactSheet(input, { out = "contact-sheet.jpg", frames = 12, columns = 4, tileWidth = 480 } = {}) {
  if (!Number.isInteger(frames) || frames < 1) throw new MediaError("Frame count must be a positive whole number.");
  if (!Number.isInteger(columns) || columns < 1) throw new MediaError("Column count must be a positive whole number.");
  const info = await probe(input);
  const filter = tileFilter({ frames, columns, tileWidth, durationSec: info.durationSec });
  await run("ffmpeg", ["-y", "-i", input, "-vf", filter, "-frames:v", "1", "-q:v", "3", out], { maxBuffer: 1 << 26 });
  return {
    out,
    frames,
    columns,
    rows: gridRows(frames, columns),
    timestamps: frameTimestamps(info.durationSec, frames),
    source: info,
  };
}

const isMain = process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`;
if (isMain) {
  const [input, ...rest] = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, "")] = rest[i + 1];
  if (!input) {
    console.error("Usage: node scripts/contact-sheet.mjs <video> [--out sheet.jpg] [--frames 12] [--columns 4]");
    process.exit(1);
  }
  const result = await contactSheet(input, {
    out: opts.out ?? "contact-sheet.jpg",
    frames: opts.frames ? Number(opts.frames) : 12,
    columns: opts.columns ? Number(opts.columns) : 4,
  });
  console.log(`${result.frames} frames in a ${result.columns}×${result.rows} grid → ${result.out}`);
  console.log(`Sampled at: ${result.timestamps.map((t) => `${t}s`).join(", ")}`);
}

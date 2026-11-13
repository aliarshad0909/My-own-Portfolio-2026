import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";
import { contactSheet, frameTimestamps, gridRows, tileFilter } from "../scripts/contact-sheet.mjs";
import { MediaError, probe } from "../scripts/prepare-media.mjs";

const run = promisify(execFile);
let dir;
let film;

before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "sheet-test-"));
  film = path.join(dir, "film.mp4");
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=size=960x540:rate=25:duration=12", "-c:v", "libx264", "-pix_fmt", "yuv420p", film], { maxBuffer: 1 << 26 });
});

after(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("frame sampling", () => {
  it("spaces frames evenly and insets from both ends", () => {
    const t = frameTimestamps(100, 5);
    assert.equal(t.length, 5);
    assert.ok(t[0] > 0, "should not sample the very first frame");
    assert.ok(t[4] < 100, "should not sample the very last frame");
    const gaps = t.slice(1).map((v, i) => Number((v - t[i]).toFixed(3)));
    assert.equal(new Set(gaps).size, 1, `gaps should be equal, got ${gaps}`);
  });

  it("takes the middle frame when only one is asked for", () => {
    const [only] = frameTimestamps(10, 1);
    assert.ok(only > 4 && only < 6, String(only));
  });

  it("rejects an unknown duration or a silly frame count", () => {
    assert.throws(() => frameTimestamps(0, 4), MediaError);
    assert.throws(() => frameTimestamps(10, 0), MediaError);
    assert.throws(() => frameTimestamps(10, 2.5), MediaError);
  });
});

describe("grid", () => {
  it("computes rows from frames and columns", () => {
    assert.equal(gridRows(12, 4), 3);
    assert.equal(gridRows(10, 4), 3);
    assert.equal(gridRows(1, 4), 1);
  });

  it("builds a tile filter with matching geometry", () => {
    const f = tileFilter({ frames: 12, columns: 4, tileWidth: 480, durationSec: 12 });
    assert.match(f, /tile=4x3/);
    assert.match(f, /scale=480:-2/);
    assert.match(f, /fps=1\./, f);
  });
});

describe("contact sheet", () => {
  it("renders a real grid image from a real clip", async () => {
    const out = path.join(dir, "sheet.jpg");
    const result = await contactSheet(film, { out, frames: 9, columns: 3, tileWidth: 320 });
    const stat = await fs.stat(out);
    assert.ok(stat.size > 5000, `sheet is only ${stat.size} bytes`);
    assert.equal(result.rows, 3);
    assert.equal(result.timestamps.length, 9);

    const info = await probe(out);
    // 3 columns of 320px plus margins and padding.
    assert.ok(info.width >= 320 * 3, `width ${info.width}`);
    assert.ok(info.height >= 180 * 3, `height ${info.height}`);
    assert.equal(info.videoCodec, "mjpeg");
  });

  it("rejects nonsense options", async () => {
    await assert.rejects(() => contactSheet(film, { frames: 0 }), MediaError);
    await assert.rejects(() => contactSheet(film, { columns: 0 }), MediaError);
  });
});

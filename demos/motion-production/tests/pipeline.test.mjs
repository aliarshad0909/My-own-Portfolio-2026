/**
 * Runs the real pipeline against a generated test clip.
 *
 * ffmpeg actually encodes here and ffprobe actually inspects the results, so
 * these tests prove the pipeline works end to end. They do not prove anything
 * about Ali's footage, which does not exist in this repository.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";
import { MediaError, PRESETS, mp4Args, posterArgs, posterTimestamp, prepare, previewArgs, probe, projectSnippet, scaleFilter, webmArgs } from "../scripts/prepare-media.mjs";

const run = promisify(execFile);
let dir;
let master;

before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "motion-test-"));
  master = path.join(dir, "master.mp4");
  // 10s of 1280x720 test pattern at 30fps with a tone, standing in for a master file.
  await run("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=10",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=10",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
    "-c:a", "aac", "-shortest", master,
  ], { maxBuffer: 1 << 26 });
});

after(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("probe", () => {
  it("reads dimensions, duration, frame rate and streams", async () => {
    const info = await probe(master);
    assert.equal(info.width, 1280);
    assert.equal(info.height, 720);
    assert.ok(Math.abs(info.durationSec - 10) < 0.5, `duration ${info.durationSec}`);
    assert.ok(Math.abs(info.fps - 30) < 0.1, `fps ${info.fps}`);
    assert.equal(info.videoCodec, "h264");
    assert.equal(info.hasAudio, true);
    assert.ok(info.sizeBytes > 1000);
  });

  it("rejects a file with no video stream", async () => {
    const audioOnly = path.join(dir, "audio.m4a");
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:a", "aac", audioOnly]);
    await assert.rejects(() => probe(audioOnly), MediaError);
  });
});

describe("argument building", () => {
  const info = { width: 1280, height: 720, durationSec: 10, fps: 30, hasAudio: true };

  it("never upscales past the source width", () => {
    const args = mp4Args("in.mov", "out.mp4", { ...info, width: 640 });
    assert.ok(args.join(" ").includes("scale=640:-2"), args.join(" "));
  });

  it("keeps dimensions even, which both codecs require", () => {
    assert.match(scaleFilter(1920), /:-2:/);
  });

  it("puts the MP4 index at the front for streaming", () => {
    assert.ok(mp4Args("in.mov", "out.mp4", info).includes("+faststart"));
  });

  it("drops audio when the source has none, and keeps it when it does", () => {
    assert.ok(mp4Args("in.mov", "o.mp4", { ...info, hasAudio: false }).includes("-an"));
    assert.ok(mp4Args("in.mov", "o.mp4", info).includes("aac"));
    assert.ok(webmArgs("in.mov", "o.webm", info).includes("libopus"));
  });

  it("always silences the hover preview", () => {
    assert.ok(previewArgs("in.mov", "o.mp4", info).includes("-an"), "a preview that plays sound on hover is a bug");
  });

  it("caps the preview length and skips the opening second on a long clip", () => {
    const long = previewArgs("in.mov", "o.mp4", { ...info, durationSec: 60 });
    assert.equal(long[long.indexOf("-t") + 1], String(PRESETS.preview.seconds));
    assert.equal(long[long.indexOf("-ss") + 1], "1");
    const short = previewArgs("in.mov", "o.mp4", { ...info, durationSec: 3 });
    assert.equal(short[short.indexOf("-ss") + 1], "0", "a short clip should start at the beginning");
    assert.equal(short[short.indexOf("-t") + 1], "3");
  });
});

describe("poster timing", () => {
  it("takes the frame a quarter of the way in", () => {
    assert.equal(posterTimestamp(40), 10);
  });
  it("avoids the first frame of a very short clip", () => {
    assert.equal(posterTimestamp(2), 1);
    assert.ok(posterTimestamp(0.5) > 0);
  });
  it("honours an explicit timestamp but keeps it inside the clip", () => {
    assert.equal(posterTimestamp(40, 3.5), 3.5);
    assert.ok(posterTimestamp(5, 99) < 5);
  });
  it("copes with an unknown duration", () => {
    assert.equal(posterTimestamp(0), 0);
    assert.equal(posterTimestamp(Number.NaN), 0);
  });
});

describe("full pipeline", () => {
  let result;

  it("produces all four outputs", async () => {
    result = await prepare(master, { slug: "test-film", title: "Test Film", outDir: path.join(dir, "out") });
    for (const [name, file] of Object.entries(result.outputs)) {
      const stat = await fs.stat(file.path);
      assert.ok(stat.size > 0, `${name} is empty`);
      assert.equal(file.bytes, stat.size);
    }
  });

  it("encodes a faststart H.264 MP4 at the source resolution", async () => {
    const info = await probe(result.outputs.mp4.path);
    assert.equal(info.videoCodec, "h264");
    assert.equal(info.width, 1280, "should not upscale a 1280px source to 1920");
    assert.equal(info.hasAudio, true);
  });

  it("encodes a VP9 WebM", async () => {
    const info = await probe(result.outputs.webm.path);
    assert.equal(info.videoCodec, "vp9");
  });

  it("makes the hover preview short, silent and smaller", async () => {
    const info = await probe(result.outputs.preview.path);
    assert.ok(info.durationSec <= PRESETS.preview.seconds + 0.5, `preview is ${info.durationSec}s`);
    assert.equal(info.hasAudio, false, "the preview must be silent");
    assert.equal(info.width, 960);
    assert.ok(result.outputs.preview.bytes < result.outputs.mp4.bytes, "a preview should be lighter than the full file");
  });

  it("extracts a poster at the source aspect ratio", async () => {
    const info = await probe(result.outputs.poster.path);
    assert.equal(info.width, 1280);
    assert.equal(info.height, 720);
    assert.equal(info.videoCodec, "mjpeg");
  });

  it("returns a snippet with the right paths and real poster dimensions", () => {
    const s = result.snippet;
    assert.equal(s.cover.src, "/images/projects/test-film/poster.webp");
    assert.equal(s.cover.width, 1280);
    assert.equal(s.cover.height, 720);
    assert.equal(s.previewVideo, "/videos/test-film-preview.mp4");
    assert.equal(s.gallery[0].type, "video");
    assert.equal(s.gallery[0].src, "/videos/test-film.mp4");
    assert.ok(s.cover.alt.includes("Test Film"));
  });

  it("refuses a missing or malformed slug", async () => {
    await assert.rejects(() => prepare(master, { outDir: dir }), MediaError);
    await assert.rejects(() => prepare(master, { slug: "Not A Slug", outDir: dir }), MediaError);
    await assert.rejects(() => prepare(master, { slug: "../escape", outDir: dir }), MediaError);
  });

  it("handles a silent source without failing", async () => {
    const silent = path.join(dir, "silent.mp4");
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=24:duration=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", silent], { maxBuffer: 1 << 26 });
    const r = await prepare(silent, { slug: "silent-film", outDir: path.join(dir, "out2") });
    assert.equal((await probe(r.outputs.mp4.path)).hasAudio, false);
    assert.equal((await probe(r.outputs.mp4.path)).width, 640, "a 640px source must not be upscaled");
  });
});

describe("snippet shape", () => {
  it("builds paths from the slug alone", () => {
    const s = projectSnippet({ slug: "my-film", title: "My Film", poster: "x.jpg", posterInfo: { width: 1920, height: 1080 }, files: {} });
    assert.equal(s.gallery[0].poster, "/images/projects/my-film/poster.webp");
    assert.equal(s.previewVideo, "/videos/my-film-preview.mp4");
  });
});

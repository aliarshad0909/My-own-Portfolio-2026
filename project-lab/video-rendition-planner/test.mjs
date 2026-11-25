import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planRenditions } from "./index.mjs";

describe("video-rendition-planner", () => {
  it("keeps dimensions even for chroma subsampling and includes +faststart", () => {
    const ladder = planRenditions({ srcWidth: 1920, srcHeight: 1080, durationSec: 5 });
    for (const r of ladder) {
      assert.equal(r.width % 2, 0);
      assert.equal(r.height % 2, 0);
      assert.ok(r.ffmpegArgs.includes("+faststart"));
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BRAND, CAMPAIGN, PAIRINGS, PALETTE } from "../src/data/brand.ts";
import { checkContrast, contrastRatio, hexToRgb, readableOn, relativeLuminance, rgbToHex, shade, THRESHOLD } from "../src/lib/color.ts";
import { DEFAULT_EMAIL, buildEmail, buildPlainText } from "../src/lib/email.ts";
import { BASE_PX, RATIO, buildScale, lineHeightFor, trackingFor } from "../src/lib/type-scale.ts";

describe("colour maths", () => {
  it("parses hex in both lengths and rejects nonsense", () => {
    assert.deepEqual(hexToRgb("#FFFFFF"), { r: 255, g: 255, b: 255 });
    assert.deepEqual(hexToRgb("000"), { r: 0, g: 0, b: 0 });
    assert.deepEqual(hexToRgb("#2A1E3F"), { r: 42, g: 30, b: 63 });
    for (const bad of ["#12", "zzzzzz", ""]) assert.throws(() => hexToRgb(bad), /not a valid hex/);
  });

  it("round-trips through RGB", () => {
    for (const s of PALETTE) assert.equal(rgbToHex(hexToRgb(s.hex)), s.hex.toUpperCase());
  });

  it("matches the WCAG reference values", () => {
    // Black on white is the specification's maximum, 21:1.
    assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
    assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
    // Mid grey #767676 on white is the canonical 4.5:1 boundary case.
    assert.ok(Math.abs(contrastRatio("#767676", "#FFFFFF") - 4.54) < 0.05, String(contrastRatio("#767676", "#FFFFFF")));
    assert.equal(relativeLuminance("#000000"), 0);
    assert.equal(relativeLuminance("#FFFFFF"), 1);
  });

  it("is symmetric: order of the two colours does not matter", () => {
    for (const p of PAIRINGS) assert.equal(contrastRatio(p.fg, p.bg), contrastRatio(p.bg, p.fg));
  });

  it("grades against the AA and AAA thresholds", () => {
    assert.deepEqual(checkContrast("#000000", "#FFFFFF"), { ratio: 21, aa: true, aaa: true, grade: "AAA" });
    assert.equal(checkContrast("#767676", "#FFFFFF").grade, "AA");
    assert.equal(checkContrast("#949494", "#FFFFFF").grade, "AA Large");
    assert.equal(checkContrast("#CCCCCC", "#FFFFFF").grade, "Fail");
  });

  it("shades toward white and black", () => {
    assert.equal(shade("#000000", 1), "#FFFFFF");
    assert.equal(shade("#FFFFFF", -1), "#000000");
    assert.equal(shade("#808080", 0), "#808080");
    assert.ok(relativeLuminance(shade("#2A1E3F", 0.4)) > relativeLuminance("#2A1E3F"));
  });

  it("picks the more readable of two inks", () => {
    assert.equal(readableOn("#2A1E3F", ["#FBF7F2", "#2A1E3F"]), "#FBF7F2");
    assert.equal(readableOn("#FBF7F2", ["#FBF7F2", "#2A1E3F"]), "#2A1E3F");
  });
});

describe("brand palette", () => {
  it("has unique names, tokens and valid hex values", () => {
    assert.equal(new Set(PALETTE.map((p) => p.name)).size, PALETTE.length);
    assert.equal(new Set(PALETTE.map((p) => p.token)).size, PALETTE.length);
    for (const p of PALETTE) assert.doesNotThrow(() => hexToRgb(p.hex), p.name);
  });

  it("every documented pairing meets the threshold for its stated use", () => {
    const failures = PAIRINGS.filter((p) => contrastRatio(p.fg, p.bg) < THRESHOLD[p.use]).map(
      (p) => `${p.label} is ${contrastRatio(p.fg, p.bg)}:1, needs ${THRESHOLD[p.use]}`,
    );
    assert.deepEqual(failures, [], failures.join("; "));
  });

  it("the primary call to action is readable", () => {
    // Midnight text on the Apricot button is the most used combination in the system.
    assert.ok(contrastRatio("#2A1E3F", "#F3B98A") >= 4.5, String(contrastRatio("#2A1E3F", "#F3B98A")));
  });

  it("flags a pairing that would fail, so the check is not vacuous", () => {
    assert.ok(contrastRatio("#CFC7DE", "#FBF7F2") < 4.5, "Mist on Paper should fail, and is not in PAIRINGS");
    assert.equal(PAIRINGS.some((p) => p.fg === "#CFC7DE" && p.bg === "#FBF7F2"), false);
  });
});

describe("type scale", () => {
  const scale = buildScale();

  it("is computed from the ratio, not hand-written", () => {
    const body = scale.find((s) => s.name === "Body");
    const h3 = scale.find((s) => s.name === "H3");
    assert.equal(body?.px, BASE_PX);
    assert.ok(Math.abs((h3?.px ?? 0) - BASE_PX * RATIO) < 0.01);
  });

  it("decreases monotonically from display to micro", () => {
    for (let i = 1; i < scale.length; i++) assert.ok(scale[i].px < scale[i - 1].px, `${scale[i].name} is not smaller than ${scale[i - 1].name}`);
  });

  it("tightens line height as type grows", () => {
    assert.ok(lineHeightFor(60) < lineHeightFor(17));
    assert.equal(lineHeightFor(17), 1.6);
    for (let i = 1; i < scale.length; i++) assert.ok(scale[i].lineHeight >= scale[i - 1].lineHeight);
  });

  it("tracks large type in and small type out", () => {
    assert.ok(trackingFor(60) < 0);
    assert.ok(trackingFor(12) > 0);
    assert.equal(trackingFor(17), 0);
  });

  it("converts to rem against a 16px root", () => {
    for (const s of scale) assert.ok(Math.abs(s.rem * 16 - s.px) < 0.02, s.name);
  });

  it("respects a different base and ratio", () => {
    const big = buildScale(20, 1.333);
    assert.equal(big.find((s) => s.name === "Body")?.px, 20);
    assert.ok((big.find((s) => s.name === "Display")?.px ?? 0) > (scale.find((s) => s.name === "Display")?.px ?? 0));
  });
});

describe("email template", () => {
  const html = buildEmail();

  it("is table-based with a fixed width, which is what clients render reliably", () => {
    assert.match(html, /<table role="presentation"/);
    assert.match(html, /width="600"/);
    assert.equal(/display:\s*flex|display:\s*grid/.test(html), false, "flex and grid are unreliable in email");
  });

  it("carries a hidden preheader for the inbox preview", () => {
    assert.match(html, /display:none;max-height:0/);
    assert.ok(html.includes(DEFAULT_EMAIL.preheader));
  });

  it("includes unsubscribe and preference links", () => {
    assert.ok(html.includes("{{unsubscribe_url}}"));
    assert.ok(html.includes("{{preferences_url}}"));
    assert.match(html, />Unsubscribe</);
  });

  it("has an Outlook conditional and a charset declaration", () => {
    assert.match(html, /<!--\[if mso\]>/);
    assert.match(html, /charset=UTF-8/);
  });

  it("escapes content rather than injecting it raw", () => {
    const nasty = buildEmail({ ...DEFAULT_EMAIL, headline: '<script>alert("x")</script>' });
    assert.equal(nasty.includes("<script>"), false);
    assert.ok(nasty.includes("&lt;script&gt;"));
  });

  it("gives every image an alt attribute", () => {
    for (const tag of html.match(/<img[^>]*>/g) ?? []) assert.match(tag, /alt="/, tag);
  });

  it("uses the brand colours in the header and button", () => {
    assert.ok(html.includes("#2A1E3F"));
    assert.ok(html.includes("#A94F30"));
  });

  it("produces a plain-text alternative with the same message", () => {
    const text = buildPlainText();
    assert.ok(text.includes(DEFAULT_EMAIL.headline));
    assert.ok(text.includes(DEFAULT_EMAIL.ctaUrl));
    assert.ok(text.includes("Unsubscribe"));
    assert.equal(/<[a-z]/i.test(text), false, "the plain-text part must contain no markup");
  });
});

describe("brand content", () => {
  it("states what the voice is and is not", () => {
    assert.ok(BRAND.voice.is.length >= 3 && BRAND.voice.isNot.length >= 3);
    assert.equal(BRAND.voice.is.some((v) => BRAND.voice.isNot.includes(v)), false, "a word cannot be both");
  });

  it("uses a consistent spacing scale", () => {
    for (let i = 1; i < BRAND.spacing.length; i++) assert.ok(BRAND.spacing[i] > BRAND.spacing[i - 1]);
    assert.ok(BRAND.spacing.every((n) => n % 2 === 0));
  });

  it("the campaign lists measures but reports no results", () => {
    assert.ok(CAMPAIGN.measurement.length >= 3);
    assert.match(CAMPAIGN.notActual, /no campaign has run/i);
    const text = JSON.stringify(CAMPAIGN).toLowerCase();
    for (const claim of ["increased by", "roi of", "% uplift", "conversion rate of"]) {
      assert.equal(text.includes(claim), false, `campaign copy must not claim results: "${claim}"`);
    }
  });

  it("every channel names the asset that serves it", () => {
    for (const c of CAMPAIGN.channels) assert.ok(c.asset && c.role, c.name);
  });
});

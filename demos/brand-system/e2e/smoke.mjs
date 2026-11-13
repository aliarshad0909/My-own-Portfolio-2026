/**
 * Browser tests against the built bundle. These drive the real UI: the
 * contrast table is read from the DOM, the email preview is read from inside
 * the iframe, and the downloads are checked by intercepting the click.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:8807";
const results = [];
let failed = 0;

async function t(name, fn) {
  try {
    await fn();
    results.push(`ok   ${name}`);
  } catch (err) {
    failed++;
    results.push(`FAIL ${name}\n       ${err.message.split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const go = async (tab) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (tab) await page.getByRole("button", { name: tab, exact: true }).click();
};

await t("the app renders with the brand masthead", async () => {
  await go();
  await assert.match(await page.title(), /Halcyon/);
  assert.equal(await page.locator(".masthead__brand h1").innerText(), "Halcyon");
});

await t("every section tab opens its panel", async () => {
  await go();
  for (const [label, heading] of [
    ["Identity", "Identity"],
    ["Colour", "Colour"],
    ["Type", "Type"],
    ["Assets", "Assets"],
    ["Campaign", /^Campaign — Wind Down$/],
    ["Email", "Email template"],
    ["Landing page", "Landing page"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("heading", { level: 2, name: heading }).waitFor({ state: "visible" });
  }
});

await t("the contrast table computes a ratio for every documented pairing", async () => {
  await go("Colour");
  const rows = page.locator('[data-testid="pairings"] tbody tr');
  const count = await rows.count();
  assert.ok(count >= 10, `expected at least 10 pairings, got ${count}`);
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();
    assert.match(text, /\d+(\.\d+)?:1/, `row ${i} has no ratio: ${text}`);
  }
});

await t("every documented pairing passes — the table is not decorative", async () => {
  await go("Colour");
  const summary = await page.locator('[data-testid="pairing-summary"]').innerText();
  assert.match(summary, /All \d+ pairings meet their threshold\./, summary);
  assert.equal(await page.locator('[data-testid="pairings"] .pill[data-pass="false"]').count(), 0);
});

await t("the contrast checker recomputes live and grades correctly", async () => {
  await go("Colour");
  const fg = page.getByLabel("Foreground hex value");
  const bg = page.getByLabel("Background hex value");

  await fg.fill("#000000");
  await bg.fill("#FFFFFF");
  await assert.match(await page.locator(".tester__preview strong").innerText(), /^21:1$/);
  assert.equal(await page.locator('[data-testid="grades"] li[data-pass="true"]').count(), 3);

  await fg.fill("#CCCCCC");
  await assert.match(await page.locator(".tester__preview strong").innerText(), /^1\.6\d:1$/);
  assert.equal(await page.locator('[data-testid="grades"] li[data-pass="true"]').count(), 0);

  await fg.fill("#767676");
  const mid = await page.locator('[data-testid="grades"] li[data-pass="true"]').count();
  assert.equal(mid, 2, "mid grey on white should pass large and AA but not AAA");
});

await t("the checker refuses nonsense input instead of showing a wrong number", async () => {
  await go("Colour");
  await page.getByLabel("Foreground hex value").fill("not-a-colour");
  await page.locator(".warn").waitFor({ state: "visible" });
  assert.equal(await page.locator(".tester__preview").count(), 0);
});

await t("the type scale regenerates from the base size and ratio", async () => {
  await go("Type");
  const first = page.locator('[data-testid="scale"] .scale__row').first();
  const before = await first.locator("code").innerText();
  await page.getByLabel(/^Base size/).fill("22");
  const after = await first.locator("code").innerText();
  assert.notEqual(before, after, "changing the base size should change the display step");
  assert.match(after, /^\d+(\.\d+)?px \/ \d+(\.\d+)?rem$/);
});

await t("the type scale decreases monotonically in the rendered DOM", async () => {
  await go("Type");
  const samples = page.locator('[data-testid="scale"] .scale__sample');
  const sizes = [];
  for (let i = 0; i < (await samples.count()); i++) {
    sizes.push(parseFloat(await samples.nth(i).evaluate((el) => getComputedStyle(el).fontSize)));
  }
  for (let i = 1; i < sizes.length; i++) assert.ok(sizes[i] < sizes[i - 1], `step ${i} is not smaller: ${sizes.join(", ")}`);
});

await t("resetting restores the brand base and ratio", async () => {
  await go("Type");
  await page.getByLabel(/^Base size/).fill("14");
  await page.getByRole("button", { name: "Reset to brand values" }).click();
  await assert.match(await page.getByText(/^Base size: 17px$/).innerText(), /17px/);
});

await t("a lockup downloads as a real SVG file", async () => {
  await go("Assets");
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download SVG" }).first().click(),
  ]);
  assert.equal(dl.suggestedFilename(), "halcyon-lockup-horizontal-dark.svg");
  const stream = await dl.createReadStream();
  let body = "";
  for await (const chunk of stream) body += chunk;
  assert.match(body, /^<\?xml version="1\.0"/);
  assert.match(body, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(body.includes("Halcyon"), "the downloaded lockup should contain the wordmark");
  assert.ok(body.length > 300, `downloaded file is suspiciously small: ${body.length} bytes`);
});

await t("a social template downloads with its real dimensions", async () => {
  await go("Campaign");
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download SVG" }).first().click(),
  ]);
  assert.equal(dl.suggestedFilename(), "halcyon-square-post.svg");
  const stream = await dl.createReadStream();
  let body = "";
  for await (const chunk of stream) body += chunk;
  assert.match(body, /viewBox="0 0 600 600"/);
});

await t("the campaign section states that no campaign has run", async () => {
  await go("Campaign");
  const notice = await page.locator(".notice").innerText();
  assert.match(notice, /No campaign has run/i);
  const body = await page.locator("main").innerText();
  assert.equal(/increased by|uplift|ROI of|conversion rate of/i.test(body), false, "campaign section must not claim results");
});

await t("the email preview renders the generated HTML in an iframe", async () => {
  await go("Email");
  const frame = page.frameLocator('[data-testid="email-frame"]');
  await frame.locator("table").first().waitFor({ state: "visible" });
  assert.match(await frame.locator("h1").innerText(), /Sleep is not a project/);
  assert.ok(await frame.getByRole("link", { name: "See the range" }).isVisible());
  assert.ok(await frame.getByRole("link", { name: "Unsubscribe" }).isVisible());
});

await t("editing the email headline regenerates the preview", async () => {
  await go("Email");
  await page.getByLabel("Headline").fill("A quieter evening");
  await page.getByLabel("Button label").fill("Have a look");
  const frame = page.frameLocator('[data-testid="email-frame"]');
  await frame.getByRole("heading", { name: "A quieter evening" }).waitFor({ state: "visible" });
  assert.ok(await frame.getByRole("link", { name: "Have a look" }).isVisible());
});

await t("the email HTML downloads and is a complete document", async () => {
  await go("Email");
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download .html" }).click(),
  ]);
  const stream = await dl.createReadStream();
  let body = "";
  for await (const chunk of stream) body += chunk;
  assert.match(body, /<!DOCTYPE html/i);
  assert.ok(body.includes("{{unsubscribe_url}}"));
  assert.ok(body.includes('width="600"'));
  assert.equal(/display:\s*flex/.test(body), false);
});

await t("the landing page renders the system's own tokens", async () => {
  await go("Landing page");
  const lp = page.locator('[data-testid="landing"]');
  await lp.waitFor({ state: "visible" });
  assert.match(await lp.locator(".lp__hero h3").innerText(), /Sleep is not a project/);
  assert.equal(await lp.locator(".lp__card").count(), 3);
  const nav = await lp.locator(".lp__nav").evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(nav, "rgb(42, 30, 63)", `landing nav should use Midnight, got ${nav}`);
});

await t("the landing page is honest that its buttons are not wired up", async () => {
  await go("Landing page");
  assert.match(await page.locator(".lp__note").innerText(), /not wired to a checkout/i);
});

await t("the footer states the brand is invented", async () => {
  await go();
  assert.match(await page.locator(".foot").innerText(), /Halcyon is invented/i);
});

await t("there is a working skip link", async () => {
  await go();
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.className);
  assert.ok(String(focused).includes("skip"), `first tab stop is "${focused}"`);
});

await t("nothing scrolls horizontally at 360px", async () => {
  const narrow = await browser.newPage({ viewport: { width: 360, height: 780 } });
  const offenders = [];
  for (const tab of ["Identity", "Colour", "Type", "Assets", "Campaign", "Email", "Landing page"]) {
    await narrow.goto(BASE, { waitUntil: "networkidle" });
    await narrow.getByRole("button", { name: tab, exact: true }).click();
    const scrolled = await narrow.evaluate(() => {
      window.scrollTo(9999, 0);
      const x = window.scrollX;
      window.scrollTo(0, 0);
      return x;
    });
    if (scrolled > 0) offenders.push(`${tab} (${scrolled}px)`);
  }
  await narrow.close();
  assert.deepEqual(offenders, [], offenders.join(", "));
});

await t("the page loads with no console errors", async () => {
  await go();
  for (const tab of ["Colour", "Type", "Assets", "Campaign", "Email", "Landing page"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
  }
  assert.deepEqual(consoleErrors.filter((e) => !/favicon|fonts\.g/i.test(e)), []);
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

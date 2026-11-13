import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:8809";
const results = [];
let failed = 0;
const t = async (name, fn) => {
  try { await fn(); results.push(`ok   ${name}`); }
  catch (e) { failed++; results.push(`FAIL ${name}\n       ${e.message.split("\n")[0]}`); }
};

const readPem = (n) => fs.readFileSync(new URL(`../fixtures/${n}.pem`, import.meta.url), "utf8");

const browser = await chromium.launch();
const consoleErrors = [];

const fresh = async (viewport = { width: 1280, height: 950 }) => {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  p.on("pageerror", (e) => consoleErrors.push(String(e)));
  await p.goto(BASE, { waitUntil: "networkidle" });
  return p;
};

const tab = (p, name) => p.getByRole("button", { name, exact: true }).click();

await t("the overview opens on the labelled fixture history", async () => {
  const p = await fresh();
  await p.locator('[data-testid="latest"]').waitFor();
  assert.match(await p.locator('[data-testid="latest"]').innerText(), /invented example data/);
  assert.match(await p.locator(".chip").first().innerText(), /example-shop\.test\s*fixture/);
  await p.context().close();
});

await t("the scope notice says no scanning happens", async () => {
  const p = await fresh();
  const notice = await p.locator(".notice--scope").innerText();
  assert.match(notice, /no network reconnaissance/i);
  assert.match(notice, /no port scanning/i);
  await p.context().close();
});

await t("the trend chart draws the recorded series with a text alternative", async () => {
  const p = await fresh();
  const svg = p.locator(".trend svg");
  await svg.waitFor();
  const d = await p.locator(".trend__line").getAttribute("d");
  assert.ok(d.split("L").length >= 5, `expected 5 points, path is ${d}`);
  assert.equal(await p.locator(".trend__dot").count(), 5);
  assert.match(await p.locator(".trend figcaption").innerText(), /up 61 points/);
  assert.equal(await p.locator(".trend table.sr tbody tr").count(), 5);
  await p.context().close();
});

await t("the typical header sample is graded with findings", async () => {
  const p = await fresh();
  await tab(p, "Response headers");
  await p.locator('[data-testid="grade"]').waitFor();
  assert.match(await p.locator('[data-testid="grade"]').innerText(), /\/ 100/);
  const findings = await p.locator('[data-testid="header-findings"] li').count();
  assert.ok(findings > 10, `only ${findings} findings`);
  await p.context().close();
});

await t("switching to the hardened sample regrades to A", async () => {
  const p = await fresh();
  await tab(p, "Response headers");
  await p.getByRole("button", { name: "Hardened" }).click();
  await p.locator('.grade__letter[data-grade="A"]').waitFor();
  assert.match(await p.locator('[data-testid="grade"]').innerText(), /100 \/ 100/);
  await p.context().close();
});

await t("editing the headers regrades live", async () => {
  const p = await fresh();
  await tab(p, "Response headers");
  await p.getByRole("button", { name: "Hardened" }).click();
  await p.locator('.grade__letter[data-grade="A"]').waitFor();
  const text = await p.locator('[data-testid="headers-input"]').inputValue();
  await p.locator('[data-testid="headers-input"]').fill(text.replace(/^strict-transport-security.*$/m, ""));
  await p.getByText("No Strict-Transport-Security").waitFor();
  assert.notEqual(await p.locator(".grade__letter").getAttribute("data-grade"), "A");
  await p.context().close();
});

await t("passing checks can be hidden", async () => {
  const p = await fresh();
  await tab(p, "Response headers");
  await p.getByRole("button", { name: "Hardened" }).click();
  const all = await p.locator('[data-testid="header-findings"] li').count();
  await p.getByLabel("Hide passing checks").check();
  const some = await p.locator('[data-testid="header-findings"] li').count();
  assert.ok(some < all, `${some} is not fewer than ${all}`);
  assert.equal(await p.locator('[data-testid="header-findings"] .sev[data-severity="pass"]').count(), 0);
  await p.context().close();
});

await t("a result can be recorded to the watchlist and appears in the trend", async () => {
  const p = await fresh();
  await tab(p, "Response headers");
  await p.getByRole("button", { name: "Hardened" }).click();
  await p.locator('.grade__letter[data-grade="A"]').waitFor();
  await p.locator('.record input[type="text"]').fill("my-site.test");
  await p.getByRole("button", { name: "Add to watchlist" }).click();
  await p.getByRole("heading", { level: 2, name: "Watchlist" }).waitFor();
  await p.getByRole("button", { name: "my-site.test" }).waitFor();
  await p.getByRole("button", { name: "my-site.test" }).click();
  await p.locator('.grade__letter[data-grade="A"]').waitFor();
  await p.context().close();
});

await t("the recorded result survives a reload", async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await tab(p, "Response headers");
  await p.getByRole("button", { name: "Hardened" }).click();
  await p.locator('.record input[type="text"]').fill("persisted.test");
  await p.getByRole("button", { name: "Add to watchlist" }).click();
  await p.getByRole("button", { name: "persisted.test" }).waitFor();
  await p.reload({ waitUntil: "networkidle" });
  await p.getByRole("button", { name: "persisted.test" }).waitFor();
  await ctx.close();
});

await t("the certificate tab states what it cannot verify", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  const notice = await p.locator(".notice").first().innerText();
  assert.match(notice, /cannot verify a signature chain/i);
  assert.match(notice, /revocation/i);
  await p.context().close();
});

await t("a valid certificate parses and reports its real fields", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  await p.locator('[data-testid="cert-input"]').fill(readPem("valid"));
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  const facts = await p.locator('[data-testid="cert-facts"]').innerText();
  assert.match(facts, /CN=demo\.example\.com/);
  assert.match(facts, /RSA 2048-bit/);
  assert.match(facts, /sha256WithRSAEncryption/);
  assert.match(facts, /demo\.example\.com, www\.demo\.example\.com/);
  await p.context().close();
});

await t("an expired certificate is called critical", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  await p.locator('[data-testid="cert-input"]').fill(readPem("expired"));
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  await p.locator('[data-testid="cert-findings"] li[data-severity="critical"]').first().waitFor();
  assert.match(await p.locator('[data-testid="cert-findings"]').innerText(), /Expired/);
  await p.context().close();
});

await t("a 1024-bit key and a SHA-1 signature are both caught", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  await p.locator('[data-testid="cert-input"]').fill(readPem("weakkey"));
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  await p.getByText("RSA key is only 1024 bits").waitFor();
  await p.locator('[data-testid="cert-input"]').fill(readPem("sha1"));
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  await p.getByText(/Weak signature algorithm: sha1/).waitFor();
  await p.context().close();
});

await t("a hostname that the certificate does not cover is flagged", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  await p.locator('[data-testid="cert-input"]').fill(readPem("valid"));
  await p.locator('[data-testid="cert-host"]').fill("shop.example.org");
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  await p.getByText("Does not cover shop.example.org").waitFor();
  await p.context().close();
});

await t("garbage in the certificate box produces an explanation, not a crash", async () => {
  const p = await fresh();
  await tab(p, "Certificate");
  await p.locator('[data-testid="cert-input"]').fill("hello, this is not a certificate");
  await p.getByRole("button", { name: "Analyse certificate" }).click();
  assert.match(await p.locator('[data-testid="cert-error"]').innerText(), /No PEM certificate block/);
  await p.context().close();
});

await t("the dependency report parses and lists advisories worst first", async () => {
  const p = await fresh();
  await tab(p, "Dependencies");
  await p.getByRole("button", { name: "Load a sample report" }).click();
  await p.locator('[data-testid="audit-table"] tbody tr').first().waitFor();
  assert.equal(await p.locator('[data-testid="audit-table"] tbody tr').count(), 7);
  assert.match(await p.locator('[data-testid="audit-table"] tbody tr').first().innerText(), /Critical/);
  assert.match(await p.locator('[data-testid="audit-summary"]').innerText(), /7 advisories/);
  await p.context().close();
});

await t("transitive advisories name the direct dependency to upgrade", async () => {
  const p = await fresh();
  await tab(p, "Dependencies");
  await p.getByRole("button", { name: "Load a sample report" }).click();
  const row = p.locator('[data-testid="audit-table"] tbody tr').filter({ hasText: "minimatch" });
  assert.match(await row.innerText(), /recursive-readdir/);
  await p.context().close();
});

await t("fix availability is distinguished three ways", async () => {
  const p = await fresh();
  await tab(p, "Dependencies");
  await p.getByRole("button", { name: "Load a sample report" }).click();
  const pills = await p.locator('[data-testid="audit-table"] .pill').allInnerTexts();
  assert.ok(pills.some((x) => x.includes("npm audit fix")));
  assert.ok(pills.some((x) => x.includes("major upgrade")));
  assert.ok(pills.some((x) => x.includes("none published")));
  await p.context().close();
});

await t("bad audit JSON is explained in the interface", async () => {
  const p = await fresh();
  await tab(p, "Dependencies");
  await p.locator('[data-testid="audit-input"]').fill("{ not json");
  await p.getByRole("button", { name: "Analyse report" }).click();
  assert.match(await p.locator('[data-testid="audit-error"]').innerText(), /not valid JSON/);
  await p.locator('[data-testid="audit-input"]').fill('{"advisories":{}}');
  await p.getByRole("button", { name: "Analyse report" }).click();
  assert.match(await p.locator('[data-testid="audit-error"]').innerText(), /npm 6 audit output/);
  await p.context().close();
});

await t("the footer repeats the scope limits", async () => {
  const p = await fresh();
  const foot = await p.locator(".foot").innerText();
  assert.match(foot, /does not scan hosts/i);
  assert.match(foot, /invented sample data/i);
  await p.context().close();
});

await t("there is a working skip link", async () => {
  const p = await fresh();
  await p.keyboard.press("Tab");
  assert.ok(String(await p.evaluate(() => document.activeElement?.className)).includes("skip"));
  await p.context().close();
});

await t("nothing scrolls horizontally at 360px on any tab", async () => {
  const p = await fresh({ width: 360, height: 780 });
  const offenders = [];
  for (const name of ["Overview", "Response headers", "Certificate", "Dependencies"]) {
    await tab(p, name);
    await p.waitForTimeout(220);
    const x = await p.evaluate(() => { window.scrollTo(9999, 0); const v = window.scrollX; window.scrollTo(0, 0); return v; });
    if (x > 0) offenders.push(`${name} (${x}px)`);
  }
  await p.context().close();
  assert.deepEqual(offenders, [], offenders.join(", "));
});

await t("the page runs without console errors", async () => {
  const p = await fresh();
  for (const name of ["Response headers", "Certificate", "Dependencies", "Overview"]) await tab(p, name);
  await p.waitForTimeout(400);
  await p.context().close();
  assert.deepEqual(consoleErrors.filter((e) => !/favicon|fonts\.g|Failed to load resource/i.test(e)), []);
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

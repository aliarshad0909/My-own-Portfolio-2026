/**
 * Browser tests for Ledgerlight. These drive the real UI against the fixture
 * node, which speaks JSON-RPC, so the client, decoder and renderer are all
 * exercised together.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:8808";
const results = [];
let failed = 0;

async function t(name, fn) {
  try { await fn(); results.push(`ok   ${name}`); }
  catch (err) { failed++; results.push(`FAIL ${name}\n       ${err.message.split("\n")[0]}`); }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const go = async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator('[data-testid="block-table"] tbody tr').first().waitFor({ state: "visible" });
};

await t("the latest blocks load from the fixture node", async () => {
  await go();
  const rows = page.locator('[data-testid="block-table"] tbody tr');
  assert.equal(await rows.count(), 8);
  const first = await rows.first().innerText();
  assert.match(first, /7,412,880/);
  assert.match(first, /ago|just now/);
});

await t("the fixture banner says plainly that this is not a real chain", async () => {
  await go();
  const banner = await page.locator('[data-testid="source-banner"]').innerText();
  assert.match(banner, /Fixture node/);
  assert.match(banner, /nothing here is a real chain/i);
});

await t("gas usage is shown as a real percentage with a bar", async () => {
  await go();
  const cell = page.locator('[data-testid="block-table"] tbody tr').first().locator(".gas");
  assert.match(await cell.innerText(), /^\d+\.\d%$/);
  const width = await cell.locator(".gas__fill").evaluate((el) => el.style.width);
  assert.match(width, /^\d+(\.\d+)?%$/);
  assert.notEqual(width, "0%");
});

await t("loading more blocks issues more RPC calls and shows more rows", async () => {
  await go();
  await page.getByRole("button", { name: "Load more blocks" }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="block-table"] tbody tr').length === 14);
  assert.equal(await page.locator('[data-testid="block-table"] tbody tr').count(), 14);
});

await t("clicking a block opens it with its real facts", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await page.getByRole("heading", { level: 2, name: /^Block 7,412,880$/ }).waitFor();
  const facts = await page.locator('[data-testid="block-facts"]').innerText();
  assert.match(facts, /0x[0-9a-f]{64}/);
  assert.match(facts, /\d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC/);
  assert.match(facts, /of 30,000,000/);
});

await t("a block lists its transactions and paginates them", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  const rows = page.locator('[data-testid="tx-table"] tbody tr');
  await rows.first().waitFor();
  const before = await rows.count();
  assert.ok(before > 0 && before <= 25);
  const more = page.getByRole("button", { name: /^Show \d+ more of \d+$/ });
  if (await more.count()) {
    await more.click();
    assert.ok((await rows.count()) > before);
  }
});

await t("transaction kinds are classified, not guessed", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await page.locator('[data-testid="tx-table"] tbody tr').first().waitFor();
  const kinds = new Set(await page.locator('[data-testid="tx-table"] .tag').allInnerTexts());
  assert.ok(kinds.size >= 2, `expected several kinds, saw ${[...kinds].join(", ")}`);
  for (const k of kinds) assert.ok(["transfer", "contract call", "contract creation"].includes(k), k);
});

await t("a transaction opens with a receipt, a status and a fee", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await page.locator('[data-testid="tx-table"] tbody tr').first().getByRole("button").first().click();
  await page.getByRole("heading", { level: 2, name: "Transaction" }).waitFor();
  await page.locator('[data-testid="tx-status"]').waitFor();
  const status = await page.locator('[data-testid="tx-status"]').innerText();
  assert.ok(/Succeeded|Reverted/.test(status), status);
  const facts = await page.locator('[data-testid="tx-facts"]').innerText();
  assert.match(facts, /Gas used/);
  assert.match(facts, /Fee paid/);
});

await t("a contract call shows its selector and raw calldata", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await page.locator('[data-testid="tx-table"] tbody tr').first().waitFor();
  const callRow = page.locator('[data-testid="tx-table"] tbody tr').filter({ has: page.locator('.tag[data-kind="contract call"]') }).first();
  await callRow.getByRole("button").first().click();
  await page.locator('[data-testid="calldata"]').waitFor();
  const data = await page.locator('[data-testid="calldata"]').innerText();
  assert.match(data, /^0x[0-9a-f]{8}/);
});

await t("searching a block number navigates to that block", async () => {
  await go();
  await page.getByLabel("Block number, address or transaction hash").fill("7412875");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("heading", { level: 2, name: /^Block 7,412,875$/ }).waitFor();
});

await t("searching a block the fixture does not hold reports not-found honestly", async () => {
  await go();
  await page.getByLabel("Block number, address or transaction hash").fill("12");
  await page.getByRole("button", { name: "Search" }).click();
  const failure = page.locator(".failure").first();
  await failure.waitFor();
  assert.match(await failure.innerText(), /Not found|does not exist/i);
});

await t("a malformed search explains what was wrong", async () => {
  await go();
  await page.getByLabel("Block number, address or transaction hash").fill("0xdeadbeef");
  await page.getByRole("button", { name: "Search" }).click();
  await page.locator(".failure--inline").waitFor();
  assert.match(await page.locator(".failure--inline").innerText(), /42 characters/);
});

await t("an address shows balance, nonce and account type", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("td").last().getByRole("button").click();
  await page.getByRole("heading", { level: 2, name: "Address" }).waitFor();
  const facts = page.locator('[data-testid="address-facts"]');
  await facts.waitFor();
  const text = await facts.innerText();
  assert.match(text, /Balance/);
  assert.match(text, /Externally owned account|Contract \(\d+ bytes/);
});

await t("a mixed-case address with a broken checksum is rejected, with a correction offered", async () => {
  await go();
  // EIP-55 vector with one letter's case flipped.
  await page.getByLabel("Block number, address or transaction hash").fill("0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
  await page.getByRole("button", { name: "Search" }).click();
  const failure = page.locator(".failure").first();
  await failure.waitFor();
  const text = await failure.innerText();
  assert.match(text, /Checksum does not match/);
  assert.match(text, /Did you mean/);
});

await t("following the suggested correction loads the right address", async () => {
  await go();
  await page.getByLabel("Block number, address or transaction hash").fill("0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
  await page.getByRole("button", { name: "Search" }).click();
  await page.locator(".failure").first().waitFor();
  await page.locator(".failure button.link").click();
  await page.locator('[data-testid="address-facts"]').waitFor();
  assert.match(await page.locator(".hash-line").innerText(), /0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed/);
});

await t("the RPC log records real calls with their outcomes", async () => {
  await go();
  await page.waitForTimeout(900);
  const entries = page.locator('[data-testid="rpc-log"] li');
  assert.ok((await entries.count()) > 0);
  const text = await entries.first().innerText();
  assert.match(text, /eth_(getBlockByNumber|blockNumber)/);
  assert.match(text, /\d+ms/);
});

await t("the wallet panel is honest when no wallet is injected", async () => {
  await go();
  const state = await page.locator('[data-testid="wallet-state"]').innerText();
  assert.match(state, /No EIP-1193 wallet is injected/);
  assert.equal(await page.getByRole("button", { name: "Connect wallet" }).count(), 0);
});

await t("with a wallet injected, connecting reads accounts and chain id", async () => {
  const fresh = await browser.newPage({ viewport: { width: 1360, height: 950 } });
  await fresh.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method }) => {
        if (method === "eth_accounts") return [];
        if (method === "eth_requestAccounts") return ["0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"];
        if (method === "eth_chainId") return "0xaa36a7";
        throw Object.assign(new Error("unsupported"), { code: 4200 });
      },
    };
  });
  await fresh.goto(BASE, { waitUntil: "networkidle" });
  await fresh.getByRole("button", { name: "Connect wallet" }).click();
  await fresh.getByText("Connected · Sepolia testnet").waitFor();
  assert.match(await fresh.locator(".accounts").innerText(), /0x5aaeb605/);
  await fresh.close();
});

await t("a wallet rejection is reported as a rejection, not a failure", async () => {
  const fresh = await browser.newPage({ viewport: { width: 1360, height: 950 } });
  await fresh.addInitScript(() => {
    window.ethereum = {
      request: async ({ method }) => {
        if (method === "eth_accounts") return [];
        throw Object.assign(new Error("User denied"), { code: 4001 });
      },
    };
  });
  await fresh.goto(BASE, { waitUntil: "networkidle" });
  await fresh.getByRole("button", { name: "Connect wallet" }).click();
  await fresh.getByText(/You rejected the connection request/).waitFor();
  await fresh.close();
});

await t("switching to a live network says where the requests go", async () => {
  await go();
  await page.getByLabel("Data source").selectOption("sepolia");
  const banner = page.locator('[data-testid="source-banner"]');
  await banner.getByText(/Live Sepolia/).waitFor();
  assert.match(await banner.innerText(), /rpc\.sepolia\.org/);
});

await t("a live network that cannot be reached shows the real error, not fixture data", async () => {
  await go();
  await page.route("**/rpc.sepolia.org/**", (route) => route.abort("connectionrefused"));
  await page.getByLabel("Data source").selectOption("sepolia");
  const failure = page.locator(".failure").first();
  await failure.waitFor({ timeout: 15000 });
  const text = await failure.innerText();
  assert.match(text, /Could not reach the node|No response within/);
  assert.equal(await page.locator('[data-testid="block-table"]').count(), 0, "no fixture rows may be shown while claiming to be live");
  await page.unroute("**/rpc.sepolia.org/**");
});

await t("the footer states the explorer is read-only", async () => {
  await go();
  const foot = await page.locator(".foot").innerText();
  assert.match(foot, /read-only/i);
  assert.match(foot, /cannot send a transaction/i);
});

await t("there is a working skip link", async () => {
  await go();
  await page.keyboard.press("Tab");
  assert.ok(String(await page.evaluate(() => document.activeElement?.className)).includes("skip"));
});

await t("nothing scrolls horizontally at 360px", async () => {
  const narrow = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await narrow.goto(BASE, { waitUntil: "networkidle" });
  await narrow.locator('[data-testid="block-table"] tbody tr').first().waitFor();
  const offenders = [];
  const measure = async (label) => {
    const x = await narrow.evaluate(() => { window.scrollTo(9999, 0); const v = window.scrollX; window.scrollTo(0, 0); return v; });
    if (x > 0) offenders.push(`${label} (${x}px)`);
  };
  await measure("blocks");
  await narrow.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await narrow.locator('[data-testid="block-facts"]').waitFor();
  await measure("block");
  await narrow.locator('[data-testid="tx-table"] tbody tr').first().getByRole("button").first().click();
  await narrow.locator('[data-testid="tx-facts"]').waitFor();
  await measure("transaction");
  await narrow.close();
  assert.deepEqual(offenders, [], offenders.join(", "));
});

await t("the page runs without console errors", async () => {
  await go();
  await page.locator('[data-testid="block-table"] tbody tr').first().locator("th button").click();
  await page.locator('[data-testid="block-facts"]').waitFor();
  await page.waitForTimeout(500);
  assert.deepEqual(consoleErrors.filter((e) => !/favicon|fonts\.g|ERR_|Failed to load resource/i.test(e)), []);
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

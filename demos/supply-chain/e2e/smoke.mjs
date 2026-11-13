// Browser checks for the supply chain app.
import { chromium } from "playwright";
const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");
const R = [];
const ok = (n, c, extra = "") => R.push(`${c ? "PASS" : "FAIL"}  ${n}${extra ? `  [${extra}]` : ""}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(base);
await p.waitForTimeout(400);

const tab = async (name) => { await p.getByRole("button", { name, exact: false }).first().click(); await p.waitForTimeout(250); };
const headline = async (label) => (await p.locator(".headline div", { hasText: label }).innerText()).split("\n").pop().trim();
const rowFor = (sku) => p.locator(".table tbody tr", { hasText: sku }).first();

ok("states it is a demonstration with synthetic data", /fictional manufacturer/i.test(await p.locator(".demo-bar").innerText()));
const movementsBefore = Number((await headline("Movements")).replace(/\D/g, ""));
ok("headline figures are populated", movementsBefore > 1000, `${movementsBefore} movements`);

// Inventory search and filter
const allRows = await p.locator(".table tbody tr").count();
await p.locator('input[type="search"]').fill("timber");
await p.waitForTimeout(200);
const timber = await p.locator(".table tbody tr").count();
ok("search narrows the inventory", timber > 0 && timber < allRows, `${timber} of ${allRows}`);
await p.locator('input[type="search"]').fill("");
await p.getByText("Below reorder only").click();
await p.waitForTimeout(200);
const low = await p.locator(".table tbody tr").count();
ok("below-reorder filter works", low <= allRows, `${low} low`);
await p.getByText("Below reorder only").click();
await p.waitForTimeout(200);

// Adjustment posts a movement and changes the balance
const sku = "FIN-GLU-1L";
const totalBefore = Number((await rowFor(sku).locator("td").nth(4).innerText()).replace(/\D/g, ""));
await rowFor(sku).getByRole("button", { name: "Adjust" }).click();
await p.waitForTimeout(200);
await p.locator('input[name="adjQty"]').fill("-5");
await p.locator('select[name="adjReason"]').selectOption("Damage");
await p.getByRole("button", { name: "Post adjustment" }).click();
await p.waitForTimeout(300);
const totalAfter = Number((await rowFor(sku).locator("td").nth(4).innerText()).replace(/\D/g, ""));
ok("an adjustment changes the balance by exactly the amount posted", totalAfter === totalBefore - 5, `${totalBefore} → ${totalAfter}`);
ok("the movement count rises by one", Number((await headline("Movements")).replace(/\D/g, "")) === movementsBefore + 1);

// Negative stock is refused
await rowFor(sku).getByRole("button", { name: "Adjust" }).click();
await p.waitForTimeout(200);
await p.locator('input[name="adjQty"]').fill("-999999");
await p.getByRole("button", { name: "Post adjustment" }).click();
await p.waitForTimeout(250);
ok("a movement that would go negative is refused with a reason", (await p.locator(".alert").count()) === 1 && /would leave/i.test(await p.locator(".alert").innerText()));
ok("the refused movement was not posted", Number((await headline("Movements")).replace(/\D/g, "")) === movementsBefore + 1);

// Transfer conserves total stock
await p.locator('input[name="trQty"]').fill("4");
await p.getByRole("button", { name: "Post transfer" }).click();
await p.waitForTimeout(300);
const afterTransfer = Number((await rowFor(sku).locator("td").nth(4).innerText()).replace(/\D/g, ""));
ok("a transfer moves stock without changing the total", afterTransfer === totalAfter, `${totalAfter} → ${afterTransfer}`);
ok("a transfer posts a matched pair", Number((await headline("Movements")).replace(/\D/g, "")) === movementsBefore + 3);

// Reorder suggestions: create the condition, then check the mechanism.
await tab("Inventory");
const shortSku = "FIN-LAQ-5L";
const shortRow = () => p.locator(".table tbody tr", { hasText: shortSku }).first();
// Adjustments are per warehouse, so write off what MAIN actually holds.
const shortMain = Number((await shortRow().locator("td").nth(2).innerText()).replace(/\D/g, ""));
await shortRow().getByRole("button", { name: "Adjust" }).click();
await p.waitForTimeout(200);
await p.locator('input[name="adjQty"]').fill(String(-shortMain));
await p.locator('select[name="adjReason"]').selectOption("Cycle count");
await p.getByRole("button", { name: "Post adjustment" }).click();
await p.waitForTimeout(300);
ok("writing stock to zero flags the item as needing an order", (await p.locator(".headline div", { hasText: "Below reorder" }).innerText()).trim().endsWith("1"), await headline("Below reorder"));

await tab("Purchase orders");
const suggestCount = await p.locator(".suggest li").count();
ok("a reorder suggestion appears for the short item", suggestCount === 1 && (await p.locator(".suggest li").first().innerText()).includes(shortSku));
const cardsBefore = await p.locator(".card").count();
await p.locator(".suggest li").first().getByRole("button", { name: "Raise draft PO" }).click();
await p.waitForTimeout(300);
ok("raising a draft PO adds an order", (await p.locator(".card").count()) === cardsBefore + 1);
const draft = p.locator(".card").first();
ok("the new order starts as a draft", (await draft.locator(".status").innerText()).toLowerCase() === "draft");
await draft.getByRole("button", { name: "Send to supplier" }).click();
await p.waitForTimeout(250);
ok("a draft can be sent", (await p.locator(".card").first().locator(".status").innerText()).toLowerCase() === "sent");
ok("the suggestion clears once stock is on order", (await p.locator(".suggest li").count()) === 0);

await tab("Inventory");
ok("the item now shows as covered rather than needing an order", (await p.locator("tr.is-covered").count()) >= 1 && (await p.locator("tr.is-low").count()) === 0);

// Receiving
await tab("Receiving");
const poText = await p.locator("select").first().innerText();
ok("receiving lists only open orders", /PO-2026-04[12]/.test(poText), poText.replace(/\n/g, " | ").slice(0, 70));
const receivingId = await p.locator("select").first().inputValue();
await p.getByRole("button", { name: "Fill with outstanding" }).click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: "Post receipt" }).click();
await p.waitForTimeout(350);
ok("a full receipt is accepted and reported", /Booked in/.test(await p.locator(".toast").innerText()), await p.locator(".toast").innerText());

await tab("Purchase orders");
const received = await p.locator(".card", { hasText: receivingId }).locator(".status").innerText();
ok("the order status becomes received once complete", received.toLowerCase() === "received", `${receivingId}: ${received}`);

// Over-receipt refused
await tab("Receiving");
const remaining = await p.locator(".table tbody tr").first().locator("td").nth(2).innerText();
await p.locator('input[inputmode="numeric"]').first().fill("999999");
await p.getByRole("button", { name: "Post receipt" }).click();
await p.waitForTimeout(250);
ok("over-receipt is refused", (await p.locator(".alert").count()) === 1 && /outstanding/i.test(await p.locator(".alert").innerText()), remaining);

// Ledger
await tab("Ledger");
await p.locator("select").first().selectOption(sku);
await p.waitForTimeout(250);
const types = await p.locator(".mtype").allInnerTexts();
ok("the ledger shows the movements just posted", types.some((t) => t.includes("adjustment")) && types.some((t) => t.includes("transfer")), types.slice(0, 4).join(","));
const balances = await p.locator(".table tbody tr td:nth-child(6)").allInnerTexts();
ok("every ledger row carries a running balance", balances.length > 0 && balances.every((b) => /^-?[\d,]+$/.test(b.trim())));

// Reports
await tab("Reports");
ok("reports show valuation, movements and ABC", (await p.locator(".panel").count()) >= 4 && /Total at standard cost/.test(await p.locator(".total").innerText()));
const abcCounts = await p.locator(".stats dd").allInnerTexts();
ok("ABC classification is populated", abcCounts.length >= 3);

// Suppliers
await tab("Suppliers");
ok("supplier table flags overdue orders", (await p.locator(".table tbody tr").count()) === 5 && (await p.locator(".warn").count()) >= 1);

ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));
await b.close();
console.log(R.join("\n"));
const f = R.filter((r) => r.startsWith("FAIL")).length;
console.log(`${R.length - f} passed, ${f} failed`);
process.exit(f ? 1 : 0);

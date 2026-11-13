// Browser checks for the sourcing platform.
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
const tab = async (name) => { await p.getByRole("button", { name, exact: true }).click(); await p.waitForTimeout(250); };
const cash = (s) => Number(String(s).replace(/[^0-9.]/g, ""));

ok("declares the rates are indicative, not live", /indicative rates, not live lookups/i.test(await p.locator(".demo-bar").innerText()));
ok("lists the sourcing requests", (await p.locator(".card").count()) === 3);

// Open a comparison from a request card
await p.locator(".card").first().getByRole("button", { name: /Compare/ }).click();
await p.waitForTimeout(300);
const rows = await p.locator(".table-wrap .table tbody tr").count();
ok("comparison shows every quote for the request", rows === 4, `${rows} quotes`);

// Landed cost exceeds unit price wherever the buyer still owes costs
const unit = cash(await p.locator(".table tbody tr").first().locator("td").nth(1).innerText());
const landed = cash(await p.locator(".table tbody tr").first().locator("td").nth(2).innerText());
ok("landed cost per unit is above the quoted unit price", landed > unit, `${unit} → ${landed}`);

// The cheapest quote is not automatically the winner
ok("flags a quote below the minimum order quantity", (await p.locator(".flag").count()) >= 1, await p.locator(".flag").first().innerText());
ok("explains why the top quote beats the cheapest", (await p.locator(".insight").count()) === 1 && /ranks below/.test(await p.locator(".insight").innerText()));

// Score breakdown is open for the top quote by default
const breakdown = await p.locator(".breakdown li").count();
ok("score breakdown is itemised", breakdown >= 5, `${breakdown} lines`);
ok("cost build-up shows each component and a total", /Total landed/.test(await p.locator(".panel .table--inner").innerText()));
// The detail panel toggles.
await p.locator(".table tbody tr").first().getByRole("button", { name: "Detail" }).click();
await p.waitForTimeout(200);
ok("the detail panel can be collapsed", (await p.locator(".breakdown").count()) === 0);
await p.locator(".table tbody tr").first().getByRole("button", { name: "Detail" }).click();
await p.waitForTimeout(200);

// Switching shipping mode changes landed costs
const before = await p.locator(".table tbody tr td:nth-child(3)").allInnerTexts();
await p.locator(".context select").nth(1).selectOption("air");
await p.waitForTimeout(350);
const after = await p.locator(".table tbody tr td:nth-child(3)").allInnerTexts();
ok("changing to air freight changes the landed costs", JSON.stringify(before) !== JSON.stringify(after), `${before[0]} → ${after[0]}`);

// An incoterm that already covers freight is not charged twice
await p.locator(".table tbody tr", { hasText: "DDP" }).getByRole("button", { name: "Detail" }).click();
await p.waitForTimeout(250);
const ddp = await p.locator(".panel .table--inner").innerText();
ok("a DDP quote shows freight and duty as included, not charged", (ddp.match(/in DDP/g) ?? []).length >= 4, (ddp.match(/in DDP/g) ?? []).length + " lines");

// Calculator recalculates live
await tab("Landed cost");
const perUnitBefore = await p.locator(".big").innerText();
await p.locator('input[name="price"]').fill("5.00");
await p.waitForTimeout(300);
const perUnitAfter = await p.locator(".big").innerText();
ok("calculator recalculates when the price changes", perUnitBefore !== perUnitAfter, `${perUnitBefore.trim()} → ${perUnitAfter.trim()}`);
await p.locator('select[name="incoterm"]').selectOption("DDP");
await p.waitForTimeout(300);
ok("DDP explains what it already covers", /already covers/.test(await p.locator(".note").innerText()));
await p.locator('input[name="hs"]').fill("6109");
await p.waitForTimeout(300);
ok("changing the HS code changes the duty rate", /16%/.test(await p.locator('.field:has(input[name="hs"])').innerText()), await p.locator('.field:has(input[name="hs"]) small').innerText());
await p.locator('input[name="qty"]').fill("0");
await p.waitForTimeout(300);
ok("zero quantity does not break the calculator", (await p.locator(".big").innerText()).includes("$0.00") && errs.length === 0);

// Shipments
await tab("Shipments");
ok("shipment shows milestone progress and slippage", /milestones/.test(await p.locator(".progress").innerText()) && (await p.locator(".timeline li").count()) === 7);
ok("late milestones are marked with their variance", (await p.locator(".late").count()) >= 2, (await p.locator(".late").first().innerText()));
ok("completed milestones are visually distinct", (await p.locator(".timeline li.is-done").count()) === 4);

// Suppliers
await tab("Suppliers");
ok("supplier table rates risk with a reason", (await p.locator(".table tbody tr").count()) === 6 && (await p.locator(".risk--high").count()) >= 1);

// Messages
await tab("Messages");
const all = await p.locator(".thread li").count();
await p.locator(".head select").selectOption("S-01");
await p.waitForTimeout(250);
const filtered = await p.locator(".thread li").count();
ok("correspondence filters by supplier", filtered > 0 && filtered < all, `${filtered} of ${all}`);

ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));
await b.close();
console.log(R.join("\n"));
const f = R.filter((r) => r.startsWith("FAIL")).length;
console.log(`${R.length - f} passed, ${f} failed`);
process.exit(f ? 1 : 0);

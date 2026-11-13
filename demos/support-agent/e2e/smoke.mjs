// Browser checks for the support agent.
import { chromium } from "playwright";
const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");
const R = [];
const ok = (n, c, extra = "") => R.push(`${c ? "PASS" : "FAIL"}  ${n}${extra ? `  [${extra}]` : ""}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(base);
await p.waitForTimeout(400);

const ask = async (q) => { await p.locator("#ask").fill(q); await p.locator("#ask").press("Enter"); await p.waitForTimeout(250); };
const lastMsg = () => p.locator(".msg--agent").last();

ok("opens by disclosing it is not a language model", /not a language model/i.test(await p.locator(".msg--agent").first().innerText()));

await ask("how do I cancel my subscription");
ok("answers from an article and cites the source", (await lastMsg().innerText()).includes("Settings") && (await lastMsg().locator(".msg__source").innerText()).includes("How to cancel"));

await ask("what is the weather in lahore tomorrow");
const unknown = await lastMsg().innerText();
ok("admits it cannot answer an off-topic question", /couldn't find|not confident/i.test(unknown), unknown.slice(0, 60));
ok("logs the gap in the operator view", (await p.locator(".gaps li").count()) === 1);

const rate = await p.locator(".stats div", { hasText: "Deflection" }).innerText();
ok("deflection rate is computed live", /\d+%/.test(rate), rate.replace(/\n/g, " "));

await ask("I need a receipt for accounting");
ok("synonym reaches the invoices article", (await lastMsg().locator(".msg__source").innerText()).includes("invoices"));

// Suggested reply chips: "That helped" resolves without sending a question
const customersBefore = await p.locator(".msg--customer").count();
await p.locator(".chat .chip", { hasText: "That helped" }).click();
await p.waitForTimeout(250);
ok("'That helped' marks the thread resolved", (await p.locator(".msg--system").innerText()).includes("resolved") && (await p.locator(".msg--customer").count()) === customersBefore);
ok("operator status shows resolved", (await p.locator(".stats div", { hasText: "Status" }).innerText()).includes("Resolved"));

// Escalation
await ask("I want to speak with a human");
ok("escalates on request", (await p.locator("#handoff-title").count()) === 1);
await p.getByRole("button", { name: "Send to the team" }).click();
await p.waitForTimeout(200);
ok("handoff form validates", (await p.locator(".card em, .card .err").count()) >= 2);
await p.locator('.card input[name="name"]').fill("Sam Rivera");
await p.locator('.card input[name="email"]').fill("sam@example.com");
await p.locator('.card input[name="consent"]').check();
await p.getByRole("button", { name: "Send to the team" }).click();
await p.waitForTimeout(250);
ok("handoff confirms without claiming a message was sent", /Nothing was actually sent/i.test(await p.locator(".card--ok").innerText()));
await p.locator(".card--ok summary").click();
const payload = await p.locator(".card--ok pre").innerText();
ok("handoff payload carries the transcript and the gaps", payload.includes("transcript") && payload.includes("unanswered") && payload.includes("sam@example.com"));
ok("status switches to with a human", (await p.locator(".stats div", { hasText: "Status" }).innerText()).includes("With a human"));

// Knowledge base browser
await p.locator('input[type="search"]').fill("password");
await p.waitForTimeout(250);
const kbCount = await p.locator(".kb li").count();
ok("knowledge base search narrows the list", kbCount > 0 && kbCount < 24, `${kbCount} articles`);
await p.locator('input[type="search"]').fill("");
await p.locator(".kb-controls .chip", { hasText: "Billing" }).click();
await p.waitForTimeout(200);
ok("category filter works", (await p.locator(".kb li").count()) === 5, `${await p.locator(".kb li").count()} billing articles`);

// New conversation resets
await p.getByRole("button", { name: "New conversation" }).click();
await p.waitForTimeout(250);
ok("new conversation clears the transcript and gaps", (await p.locator(".msg").count()) === 1 && (await p.locator(".gaps li").count()) === 0);

ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));
await b.close();
console.log(R.join("\n"));
const f = R.filter((r) => r.startsWith("FAIL")).length;
console.log(`${R.length - f} passed, ${f} failed`);
process.exit(f ? 1 : 0);

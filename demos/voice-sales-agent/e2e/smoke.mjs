// Browser checks for the voice sales agent. Speech APIs are absent in headless
// Chromium, which is exactly the fallback path this verifies.
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

const say = async (t) => { await p.locator("#say").fill(t); await p.locator("#say").press("Enter"); await p.waitForTimeout(200); };
const lastAgent = () => p.locator(".line--agent").last().locator(".line__text");
const slotValue = (label) => p.locator(".slots > div", { hasText: label }).first().locator("dd").innerText();

ok("discloses it is scripted and makes no calls", /scripted dialogue engine, not a language model/i.test(await p.locator(".demo-bar").innerText()) && /no phone calls/i.test(await p.locator(".demo-bar").innerText()));
ok("greeting states it is not an AI that invents answers", /not an AI that makes things up/i.test(await p.locator(".line--agent").first().innerText()));

// Degrades to typing when the browser has no speech engine
// Headless Chromium exposes the speech APIs but installs no voices and never
// returns a recognition result — the honest degradation path.
ok("reports voice output unavailable when no voices are installed", (await p.locator(".top__actions button").first().innerText()).includes("unavailable"));
ok("typing is always available", await p.locator("#say").isEnabled());
if (!(await p.locator(".mic").isDisabled())) {
  await p.locator(".mic").click();
  await p.waitForTimeout(8600);
  ok("a silent speech engine times out instead of hanging", (await p.locator(".notice").count()) === 1 && !(await p.locator(".mic").getAttribute("aria-pressed")).includes("true"), (await p.locator(".notice").innerText()).slice(0, 48));
} else {
  ok("microphone is disabled when unsupported", true);
}

// Slot filling from one rich sentence
await say("Hi I'm Dana Whitfield from Harlow Logistics, we run 60 trucks and need vehicle tracking asap");
ok("captures five slots from one utterance", (await slotValue("Interest")).includes("Vehicle tracking") && (await slotValue("Fleet size")) === "60 vehicles" && (await slotValue("Timeline")) === "Immediately" && (await slotValue("Name")) === "Dana Whitfield" && (await slotValue("Company")) === "Harlow Logistics");
ok("shows what each turn captured", (await p.locator(".line__slots").last().innerText()).includes("Fleet size"));

const score1 = Number(await p.locator(".score__num").innerText());
ok("qualification score is live and explained", score1 > 0 && (await p.locator(".reasons li").count()) >= 3, `score ${score1}`);

// Product question is answered without losing the thread
await say("how much does it cost?");
ok("answers a product question then repeats the open question", /\$18 per vehicle/.test(await lastAgent().innerText()) && /budget/i.test(await lastAgent().innerText()));

await say("about $3,000 a month");
ok("parses a spoken budget", (await slotValue("Budget")) === "$3,000 / month");
const score2 = Number(await p.locator(".score__num").innerText());
ok("budget raises the score", score2 > score1, `${score1} → ${score2}`);

await say("dana at harlow dot example");
ok("parses a spoken email address", (await slotValue("Email")) === "dana@harlow.example");

await say("Thursday morning works");
ok("books the slot and marks the lead qualified", (await p.locator(".pill").innerText()) === "Qualified" && (await slotValue("Call slot")) === "Thursday");

const crm = await p.locator(".panel pre").innerText();
const payload = JSON.parse(crm);
ok("CRM payload is complete and marks the appointment unconfirmed", payload.lead.email === "dana@harlow.example" && payload.appointmentRequest.confirmed === false && payload.qualification.band === "Hot" && payload.transcript.length > 5, `band ${payload.qualification.band}`);

// Human request and decline
await p.getByRole("button", { name: "Reset call" }).click();
await p.waitForTimeout(200);
await say("can I speak to a person");
ok("escalates to a human on request", (await p.locator(".pill").innerText()).includes("specialist"));
await p.getByRole("button", { name: "Reset call" }).click();
await p.waitForTimeout(200);
await say("not interested thanks");
ok("closes politely when declined", (await p.locator(".pill").innerText()).includes("not interested"));

// Never loops
await p.getByRole("button", { name: "Reset call" }).click();
await p.waitForTimeout(200);
await say("mmm");
ok("re-asks once when it does not understand", /didn't catch that/i.test(await lastAgent().innerText()));
await say("mmm again");
ok("hands off rather than asking a third time", (await p.locator(".pill").innerText()).includes("specialist"));

// Scripted sample call
await p.getByRole("button", { name: "Just browsing" }).click();
await p.waitForTimeout(4200);
ok("sample call runs end to end and scores a browsing lead low", (await p.locator(".score__band").innerText()).includes("Cool"), await p.locator(".score__band").innerText());

ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));
await b.close();
console.log(R.join("\n"));
const f = R.filter((r) => r.startsWith("FAIL")).length;
console.log(`${R.length - f} passed, ${f} failed`);
process.exit(f ? 1 : 0);

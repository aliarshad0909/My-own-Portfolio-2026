import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GREETING, SLOTS, answerQuestion, crmPayload, extract, extractBudget, extractFleetSize,
  missingRequired, newSession, nextSlot, qualify, reply, type Session,
} from "../src/lib/dialogue.ts";

const start = () => newSession("s1", 1000);
const say = (s: Session, text: string, t = 2000) => reply(s, text, t);
const lastText = (s: Session) => s.turns[s.turns.length - 1].text;

describe("entity extraction", () => {
  it("reads fleet size from digits, ranges, words and open ends", () => {
    assert.equal(extractFleetSize("we run 42 vans"), "42 vehicles");
    assert.equal(extractFleetSize("between 20 and 30"), "20–30 vehicles");
    assert.equal(extractFleetSize("more than 100"), "100+ vehicles");
    assert.equal(extractFleetSize("just one van"), "1 vehicle");
    assert.equal(extractFleetSize("about a dozen"), "12 vehicles");
    assert.equal(extractFleetSize("no idea really"), null);
  });

  it("reads budget in several spoken forms", () => {
    assert.equal(extractBudget("around $2,000 a month"), "$2,000 / month");
    assert.equal(extractBudget("maybe 3k per month"), "$3,000 / month");
    assert.equal(extractBudget("I'd rather not say"), "Not disclosed");
    assert.equal(extractBudget("not sure yet"), "Not disclosed");
    assert.equal(extractBudget("we need tracking"), null);
  });

  it("does not mistake a budget for a fleet size", () => {
    const found = extract("our budget is about $2000 a month", "fleetSize");
    assert.equal(found.budget, "$2,000 / month");
    assert.equal(found.fleetSize, undefined);
  });

  it("only reads a bare number as a fleet size when that is the question", () => {
    assert.equal(extract("40", "fleetSize").fleetSize, "40 vehicles");
    assert.equal(extract("40", "timeline").fleetSize, undefined);
    assert.equal(extract("we have 40 trucks", "timeline").fleetSize, "40 vehicles");
  });

  it("classifies the stated need", () => {
    assert.equal(extract("I need to know where my vans are", null).need, "Vehicle tracking");
    assert.equal(extract("worried about speeding and harsh braking", null).need, "Driver safety");
    assert.equal(extract("fuel costs are out of control", null).need, "Fuel management");
    assert.ok(extract("tracking and fuel", null).need?.includes(","), "two needs should both be captured");
  });

  it("classifies timeline language", () => {
    assert.equal(extract("we need it asap", null).timeline, "Immediately");
    assert.equal(extract("probably next month", null).timeline, "Within a month");
    assert.equal(extract("sometime this quarter", null).timeline, "This quarter");
    assert.equal(extract("honestly just looking for now", null).timeline, "Exploring only");
  });

  it("reads typed and spoken email addresses", () => {
    assert.equal(extract("it's Sam@Example.COM", null).email, "sam@example.com");
    assert.equal(extract("sam at example dot com", null).email, "sam@example.com");
  });

  it("reads a name from an introduction or a bare answer", () => {
    assert.equal(extract("Hi, I'm Dana Whitfield", null).name, "Dana Whitfield");
    assert.equal(extract("this is Marco", null).name, "Marco");
    assert.equal(extract("dana", "name").name, "Dana");
    assert.equal(extract("dana", "timeline").name, undefined);
  });

  it("reads a company name", () => {
    assert.equal(extract("I'm with Harlow Logistics", null).company, "Harlow Logistics");
    assert.equal(extract("Bridgeway Haulage", "company").company, "Bridgeway Haulage");
  });
});

describe("product questions", () => {
  it("answers known questions with fixed copy", () => {
    assert.match(answerQuestion("how much does it cost") ?? "", /\$18 per vehicle/);
    assert.match(answerQuestion("is there a trial") ?? "", /30-day pilot/);
    assert.equal(answerQuestion("what is the capital of France"), null);
  });
});

describe("dialogue flow", () => {
  it("opens by disclosing it is scripted", () => {
    assert.match(GREETING, /scripted one, not an AI/i);
    assert.equal(start().turns.length, 1);
  });

  it("asks for the first missing slot and advances as they fill", () => {
    let s = start();
    assert.equal(nextSlot(s.slots)?.id, "need");
    s = say(s, "I need to track my vans");
    assert.equal(s.slots.need, "Vehicle tracking");
    assert.equal(nextSlot(s.slots)?.id, "fleetSize");
    assert.match(lastText(s), /how many vehicles/i);
  });

  it("captures several slots from one sentence", () => {
    const s = say(start(), "Hi I'm Dana from Harlow Logistics, we have 60 trucks and need fuel tracking asap");
    assert.equal(s.slots.need?.includes("Fuel management"), true);
    assert.equal(s.slots.fleetSize, "60 vehicles");
    assert.equal(s.slots.timeline, "Immediately");
    assert.equal(s.slots.name, "Dana");
    assert.equal(s.slots.company, "Harlow Logistics");
  });

  it("answers a product question before asking the next one", () => {
    const s = say(start(), "how much does it cost?");
    assert.match(lastText(s), /\$18 per vehicle/);
    assert.match(lastText(s), /hoping to solve/i);
  });

  it("completes a full qualification and books an appointment", () => {
    let s = start();
    for (const line of ["I need vehicle tracking", "we have 60 vans", "within a month", "about $3k per month", "I'm Dana Whitfield", "Harlow Logistics", "dana@harlow.example", "Thursday morning"]) {
      s = say(s, line, 3000);
    }
    assert.equal(s.outcome, "qualified");
    assert.deepEqual(missingRequired(s.slots), []);
    assert.equal(s.slots.appointment, "Thursday");
    assert.match(lastText(s), /specialist will call Dana Whitfield on Thursday/);
  });

  it("hands off when a person is requested", () => {
    const s = say(start(), "can I just speak to a person");
    assert.equal(s.outcome, "handoff");
    assert.match(lastText(s), /pass you to a specialist/i);
  });

  it("stops cleanly when the caller declines", () => {
    const s = say(start(), "not interested, thanks");
    assert.equal(s.outcome, "declined");
    assert.match(lastText(s), /won't follow up/i);
  });

  it("ignores empty input", () => {
    assert.equal(say(start(), "   ").turns.length, 1);
  });

  it("only ever speaks scripted lines", () => {
    const scripted = new Set([GREETING, ...SLOTS.map((s) => s.ask)]);
    let s = start();
    for (const line of ["tracking", "30 vans", "next month", "no budget", "Dana", "Acme", "d@a.example"]) s = say(s, line, 3000);
    for (const t of s.turns.filter((t) => t.role === "agent")) {
      const containsScript = [...scripted].some((line) => t.text.includes(line)) || /Perfect\. I've got everything/.test(t.text) || /that's a common one/.test(t.text);
      assert.ok(containsScript, `unscripted agent line: ${t.text}`);
    }
  });
});

describe("qualification scoring", () => {
  it("scores a large urgent fleet as hot and explains every point", () => {
    const q = qualify({ fleetSize: "80 vehicles", timeline: "Immediately", budget: "$5,000 / month", need: "Vehicle tracking", email: "a@b.example" });
    assert.equal(q.score, 100);
    assert.equal(q.band, "Hot");
    assert.equal(q.reasons.length, 5);
  });
  it("scores a small browsing lead as cool", () => {
    const q = qualify({ fleetSize: "3 vehicles", timeline: "Exploring only", need: "Fuel management" });
    assert.ok(q.score < 40, String(q.score));
    assert.equal(q.band, "Cool");
  });
  it("gives no points for an undisclosed budget", () => {
    const withBudget = qualify({ budget: "$1,000 / month" }).score;
    const without = qualify({ budget: "Not disclosed" }).score;
    assert.equal(without, 0);
    assert.equal(withBudget, 20);
  });
  it("scores an empty session at zero", () => {
    assert.equal(qualify({}).score, 0);
  });
});

describe("CRM payload", () => {
  it("contains the lead, appointment, scoring and transcript", () => {
    let s = start();
    for (const line of ["driver safety", "25 vans", "this quarter", "no budget yet", "I'm Marco Diaz", "Delta Freight", "marco@delta.example", "Tuesday"]) s = say(s, line, 4000);
    const p = crmPayload(s);
    assert.equal(p.outcome, "qualified");
    assert.equal(p.lead.name, "Marco Diaz");
    assert.equal(p.lead.email, "marco@delta.example");
    assert.equal(p.lead.interest, "Driver safety");
    assert.deepEqual(p.appointmentRequest, { preference: "Tuesday", durationMinutes: 20, confirmed: false });
    assert.equal(p.qualification.band, "Warm");
    assert.equal(p.transcript.length, s.turns.length);
    assert.match(p.startedAt, /^\d{4}-\d{2}-\d{2}T/);
  });
  it("marks an appointment as unconfirmed, since nothing is really booked", () => {
    let s = start();
    for (const line of ["tracking", "10 vans", "asap", "skip", "Ana", "Acme", "a@b.example", "Tuesday"]) s = say(s, line, 4000);
    assert.equal(crmPayload(s).appointmentRequest?.confirmed, false);
  });
});

describe("never loops on a question", () => {
  it("treats a declined optional answer as given and moves on", () => {
    let s = newSession("x", 1);
    for (const line of ["tracking", "10 vans", "asap"]) s = reply(s, line, 2);
    assert.equal(nextSlot(s.slots)?.id, "budget");
    s = reply(s, "skip", 3);
    assert.equal(nextSlot(s.slots)?.id, "name", "should have moved past the optional budget question");
  });

  it("re-asks a required question once, then hands off rather than looping", () => {
    let s = newSession("y", 1);
    s = reply(s, "mmm", 2);
    assert.match(s.turns[s.turns.length - 1].text, /didn't catch that/i);
    assert.equal(s.outcome, "in_progress");
    s = reply(s, "mmm again", 3);
    assert.equal(s.outcome, "handoff");
    assert.match(s.turns[s.turns.length - 1].text, /pass you to a specialist/i);
  });

  it("completes even when every optional question is declined", () => {
    let s = newSession("z", 1);
    for (const line of ["tracking", "10 vans", "asap", "skip", "Ana", "skip", "a@b.example", "Tuesday"]) s = reply(s, line, 4);
    assert.equal(s.outcome, "qualified");
    const p = crmPayload(s);
    // "Not disclosed" is kept: it tells sales the caller was asked and declined.
    assert.equal(p.lead.budget, "Not disclosed");
    assert.equal(p.lead.company, null, "an unanswered optional field must not invent a value");
    assert.equal(qualify(s.slots).reasons.some((r) => r.startsWith("Budget")), false, "a declined budget scores nothing");
    assert.equal(p.appointmentRequest?.confirmed, false);
  });
});

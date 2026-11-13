/**
 * Inbound sales dialogue engine.
 *
 * This is a deterministic slot-filling state machine, NOT a language model.
 * It extracts values from what the caller says using keyword and pattern
 * matching, asks for whatever is still missing, and produces a structured
 * summary. Every sentence it speaks is written in this file.
 */

export type SlotId = "need" | "fleetSize" | "timeline" | "budget" | "name" | "company" | "email" | "appointment";

export type Slot = {
  id: SlotId;
  /** Question asked when this slot is still empty. */
  ask: string;
  /** Shown in the qualification panel. */
  label: string;
  /** Required before the agent will book an appointment. */
  required: boolean;
};

export const SLOTS: Slot[] = [
  { id: "need", label: "Interest", required: true, ask: "What are you hoping to solve? We cover vehicle tracking, driver safety, fuel and maintenance." },
  { id: "fleetSize", label: "Fleet size", required: true, ask: "Roughly how many vehicles are in your fleet?" },
  { id: "timeline", label: "Timeline", required: true, ask: "When are you hoping to have something in place?" },
  { id: "budget", label: "Budget", required: false, ask: "Do you have a monthly budget in mind? It's fine if you'd rather not say." },
  { id: "name", label: "Name", required: true, ask: "Who am I speaking with?" },
  { id: "company", label: "Company", required: false, ask: "And which company are you with?" },
  { id: "email", label: "Email", required: true, ask: "What's the best email for the follow-up?" },
  { id: "appointment", label: "Call slot", required: true, ask: "I can book a 20-minute call. Would Tuesday or Thursday morning suit you better?" },
];

export type Slots = Partial<Record<SlotId, string>>;

export type Turn = { role: "agent" | "caller"; text: string; at: number; filled?: SlotId[] };

export type Session = {
  id: string;
  startedAt: number;
  turns: Turn[];
  slots: Slots;
  /** Set when the caller asks for a person or says they are not interested. */
  outcome: "in_progress" | "qualified" | "handoff" | "declined";
  /** Consecutive turns spent on the same question, so the agent never loops. */
  attempts: number;
};

const NEEDS: [RegExp, string][] = [
  [/\b(track|tracking|gps|location)\b|\bwhere\b.*\b(van|truck|vehicle|car)s?\b/i, "Vehicle tracking"],
  [/\b(safety|driver behaviou?r|speeding|harsh|accident|dashcam|camera)\b/i, "Driver safety"],
  [/\b(fuel|mpg|economy|idling|consumption)\b/i, "Fuel management"],
  [/\b(maintenance|service|repair|breakdown|downtime|inspection)\b/i, "Maintenance scheduling"],
  [/\b(complian|tacho|hours of service|hos|audit|regulat)\b/i, "Compliance"],
  [/\b(rout|dispatch|schedul|job|delivery)\b/i, "Routing and dispatch"],
];

const TIMELINES: [RegExp, string][] = [
  [/\b(asap|immediately|urgent|right away|straight away|right now|this week)\b/i, "Immediately"],
  [/\b(this month|within a month|few weeks|next month|30 days)\b/i, "Within a month"],
  [/\b(quarter|three months|3 months|couple of months|q[1-4])\b/i, "This quarter"],
  [/\b(next year|six months|6 months|later|no rush|exploring|just looking|research)\b/i, "Exploring only"],
];

/**
 * Spoken quantities. Checked longest phrase first, so "a dozen" beats "a" and
 * "a couple" beats "couple". A bare "a" is deliberately absent — it appears in
 * almost every sentence and meant "1 vehicle" far too often.
 */
const WORD_NUMBERS: [phrase: string, value: number][] = Object.entries({
  "a hundred": 100, "a couple": 2, "a few": 3, "half a dozen": 6,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, dozen: 12, couple: 2,
}).sort((a, b) => b[0].length - a[0].length);

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Spoken email: "sam at example dot com". Speech recognition rarely returns the symbols. */
function spokenEmail(text: string): string | null {
  const m = text.match(/\b([a-z0-9._-]+)\s+at\s+([a-z0-9.-]+)\s+dot\s+([a-z]{2,})\b/i);
  return m ? `${m[1]}@${m[2]}.${m[3]}`.toLowerCase() : null;
}

export function extractFleetSize(text: string): string | null {
  const range = text.match(/\b(\d{1,5})\s*(?:-|to|–|and)\s*(\d{1,5})\b/);
  if (range) return `${range[1]}–${range[2]} vehicles`;
  const over = text.match(/\b(?:over|more than|above|\+)\s*(\d{1,5})\b/i);
  if (over) return `${over[1]}+ vehicles`;
  const digits = text.match(/\b(\d{1,5})\b/);
  if (digits) {
    const n = Number(digits[1]);
    if (n > 0 && n <= 100000) return `${n} vehicle${n === 1 ? "" : "s"}`;
  }
  for (const [phrase, n] of WORD_NUMBERS) {
    if (new RegExp(`\\b${phrase}\\b`, "i").test(text)) return `${n} vehicle${n === 1 ? "" : "s"}`;
  }
  return null;
}

/** Ways a caller declines to answer. Treated as a valid answer, never as silence. */
export const SKIP_RE = /\b(skip|pass|no|none|nope|n\/a|not sure|don'?t know|dunno|rather not|prefer not|no idea|haven'?t decided|next)\b/i;

export function extractBudget(text: string, asking: SlotId | null = "budget"): string | null {
  // "skip" means "skip this question", not "my budget is nothing" — so a
  // decline only counts as a budget answer when budget is what was asked.
  if (asking === "budget" && /\b(no budget|not sure|don'?t know|rather not|no idea|haven'?t decided|prefer not|skip|pass)\b/i.test(text)) return "Not disclosed";
  const money = text.match(/(?:[$£€]\s?)(\d[\d,]*)(?:\s*(k|thousand))?/i) ?? text.match(/\b(\d[\d,]*)\s*(k|thousand)?\s*(?:a|per)\s*month\b/i);
  if (money) {
    const base = Number(money[1].replace(/,/g, ""));
    const mult = money[2] ? 1000 : 1;
    return `$${(base * mult).toLocaleString("en-US")} / month`;
  }
  return null;
}

const NAME_RE = /\b(?:[Ii]'?m|[Mm]y name is|[Tt]his is|[Ii]t'?s|[Ss]peaking,? )\s+([A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/;
const COMPANY_RE = /\b(?:[Ff]rom|[Ww]ith|[Aa]t|[Ww]ork for|[Cc]ompany is|[Ww]e'?re)\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})/;

const APPOINTMENT_RE = /\b(monday|tuesday|wednesday|thursday|friday|morning|afternoon|tomorrow|next week)\b/i;

/** Pull every value we can recognise out of one utterance. */
export function extract(text: string, asking: SlotId | null): Slots {
  const found: Slots = {};

  for (const [re, label] of NEEDS) if (re.test(text)) found.need = found.need ? `${found.need}, ${label}` : label;
  for (const [re, label] of TIMELINES) if (!found.timeline && re.test(text)) found.timeline = label;

  const email = text.match(EMAIL_RE)?.[0] ?? spokenEmail(text);
  if (email) found.email = email.toLowerCase();

  const budget = extractBudget(text, asking);
  if (budget) found.budget = budget;

  // Only read a bare number as a fleet size when that is the question on the table,
  // so "20 vehicles" and "$2000 a month" never get confused.
  const fleet = extractFleetSize(text);
  if (fleet && (asking === "fleetSize" || /\b(vehicle|van|truck|car|fleet|unit)s?\b/i.test(text)) && !budget) found.fleetSize = fleet;

  const name = text.match(NAME_RE)?.[1];
  if (name) found.name = name;
  else if (asking === "name" && /^[A-Za-z][a-z'-]+(\s+[A-Z]?[a-z'-]+)?$/.test(text.trim())) found.name = text.trim().replace(/\b\w/g, (c) => c.toUpperCase());

  const company = text.match(COMPANY_RE)?.[1];
  if (company) found.company = company;
  else if (asking === "company" && text.trim().length > 1 && text.trim().length < 60 && !/\b(no|none|skip|n\/a)\b/i.test(text)) found.company = text.trim();

  if (asking === "appointment") {
    const slot = text.match(APPOINTMENT_RE);
    if (slot) found.appointment = `${slot[0][0].toUpperCase()}${slot[0].slice(1).toLowerCase()}`;
  }

  return found;
}

const HANDOFF_RE = /\b(speak|talk)\s+(to|with)\s+(a\s+)?(human|person|someone|rep|sales ?person)|real person|put me through/i;
const DECLINE_RE = /\b(not interested|no thanks|no thank you|stop|go away|remove me|unsubscribe)\b/i;

export const nextSlot = (slots: Slots): Slot | null => SLOTS.find((s) => !slots[s.id]) ?? null;

export const missingRequired = (slots: Slots): Slot[] => SLOTS.filter((s) => s.required && !slots[s.id]);

export const GREETING =
  "Thanks for calling Kestrel Fleet Systems. I'm an automated assistant — a scripted one, not an AI that makes things up. I can answer a few questions and book you a call with a specialist. What brings you in today?";

/** Short factual answers. Asked a question we know, we answer it before moving on. */
const FACTS: [RegExp, string][] = [
  [/\b(price|cost|how much|pricing)\b/i, "Pricing starts at $18 per vehicle per month on an annual plan, and drops for fleets over 50. A specialist can give you an exact figure."],
  [/\b(install|hardware|fit|device|plug)\b/i, "Most vehicles use a plug-in OBD device that takes about five minutes. Hard-wired units are available for older trucks."],
  [/\b(contract|commit|cancel|term)\b/i, "Annual agreements are standard, with a 30-day get-out in the first three months."],
  [/\b(integrat|api|erp|sync)\b/i, "There's a REST API, plus prebuilt links to the common fleet and payroll systems."],
  [/\b(trial|demo|pilot)\b/i, "There's a 30-day pilot on up to five vehicles, with no commitment."],
];

export function answerQuestion(text: string): string | null {
  for (const [re, answer] of FACTS) if (re.test(text)) return answer;
  return null;
}

export const newSession = (id: string, now: number): Session => ({
  id,
  startedAt: now,
  turns: [{ role: "agent", text: GREETING, at: now }],
  slots: {},
  outcome: "in_progress",
  attempts: 0,
});

/** The agent's reply to one caller utterance. */
export function reply(session: Session, text: string, now: number): Session {
  const said = text.trim();
  if (said === "") return session;

  const asking = nextSlot(session.slots)?.id ?? null;
  const callerTurn: Turn = { role: "caller", text: said, at: now };

  if (DECLINE_RE.test(said)) {
    return {
      ...session,
      turns: [...session.turns, callerTurn, { role: "agent", text: "Understood — I'll close this off and we won't follow up. Thanks for your time.", at: now }],
      outcome: "declined",
    };
  }

  if (HANDOFF_RE.test(said)) {
    return {
      ...session,
      turns: [...session.turns, callerTurn, { role: "agent", text: "Of course. I'll pass you to a specialist with everything you've told me so far.", at: now }],
      outcome: "handoff",
    };
  }

  const found = extract(said, asking);
  const current = asking ? SLOTS.find((s) => s.id === asking) : null;
  const factFirst = answerQuestion(said);

  // The caller asked us something instead of answering. Answer it, repeat the
  // question, and don't count it against the retry budget.
  if (Object.keys(found).length === 0 && factFirst && current) {
    return {
      ...session,
      turns: [...session.turns, callerTurn, { role: "agent", text: `${factFirst} ${current.ask}`, at: now }],
      attempts: session.attempts,
    };
  }

  // Nothing recognised. An optional question is marked as declined and we move
  // on; a required one is asked once more, then handed to a person. The agent
  // must never ask the same thing a third time.
  if (Object.keys(found).length === 0 && current) {
    if (!current.required || SKIP_RE.test(said)) {
      found[current.id] = SKIP_RE.test(said) || !current.required ? "Not given" : "Not given";
    } else if (session.attempts >= 1) {
      return {
        ...session,
        turns: [...session.turns, callerTurn, { role: "agent", text: "I'm not following that one, and I'd rather not keep asking. Let me pass you to a specialist who can take it from here.", at: now }],
        outcome: "handoff",
      };
    } else {
      return {
        ...session,
        turns: [...session.turns, callerTurn, { role: "agent", text: `Sorry, I didn't catch that. ${current.ask}`, at: now }],
        attempts: session.attempts + 1,
      };
    }
  }

  const slots = { ...session.slots, ...found };
  const filled = Object.keys(found) as SlotId[];

  const parts: string[] = [];
  const fact = answerQuestion(said);
  if (fact) parts.push(fact);

  if (filled.includes("need") && found.need && found.need !== "Not given") parts.push(`${found.need} — that's a common one, and we handle it.`);

  const next = nextSlot(slots);
  if (next) {
    parts.push(next.ask);
    return { ...session, turns: [...session.turns, callerTurn, { role: "agent", text: parts.join(" "), at: now, filled }], slots, attempts: 0 };
  }

  parts.push(
    `Perfect. I've got everything: ${slots.need} for ${slots.fleetSize}, ${String(slots.timeline).toLowerCase()}. A specialist will call ${slots.name} on ${slots.appointment} and confirm by email at ${slots.email}.`,
  );
  return { ...session, turns: [...session.turns, callerTurn, { role: "agent", text: parts.join(" "), at: now, filled }], slots, outcome: "qualified", attempts: 0 };
}

export type Qualification = { score: number; band: "Hot" | "Warm" | "Cool"; reasons: string[] };

/** Transparent scoring — every point is explained in the UI, nothing is hidden. */
export function qualify(slots: Slots): Qualification {
  let score = 0;
  const reasons: string[] = [];

  const size = Number(String(slots.fleetSize ?? "").replace(/[^\d].*$/, ""));
  if (size >= 50) { score += 35; reasons.push("Fleet of 50+ vehicles (+35)"); }
  else if (size >= 15) { score += 25; reasons.push("Fleet of 15–49 vehicles (+25)"); }
  else if (size > 0) { score += 12; reasons.push("Fleet under 15 vehicles (+12)"); }

  const t = slots.timeline;
  if (t === "Immediately") { score += 30; reasons.push("Wants it immediately (+30)"); }
  else if (t === "Within a month") { score += 24; reasons.push("Buying within a month (+24)"); }
  else if (t === "This quarter") { score += 15; reasons.push("Buying this quarter (+15)"); }
  else if (t === "Exploring only") { score += 4; reasons.push("Exploring only (+4)"); }

  if (slots.budget && slots.budget !== "Not disclosed" && slots.budget !== "Not given") { score += 20; reasons.push("Budget stated (+20)"); }
  if (slots.need) { score += 10; reasons.push("Clear use case (+10)"); }
  if (slots.email) { score += 5; reasons.push("Contact email captured (+5)"); }

  const band = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cool";
  return { score, band, reasons };
}

/** The shape a CRM would receive. Nothing is sent from this demo. */
export function crmPayload(session: Session) {
  const q = qualify(session.slots);
  return {
    source: "inbound_voice_agent_demo",
    sessionId: session.id,
    startedAt: new Date(session.startedAt).toISOString(),
    outcome: session.outcome,
    lead: {
      name: session.slots.name ?? null,
      company: session.slots.company && session.slots.company !== "Not given" ? session.slots.company : null,
      email: session.slots.email ?? null,
      interest: session.slots.need ?? null,
      fleetSize: session.slots.fleetSize ?? null,
      timeline: session.slots.timeline ?? null,
      budget: session.slots.budget && session.slots.budget !== "Not given" ? session.slots.budget : null,
    },
    appointmentRequest: session.slots.appointment ? { preference: session.slots.appointment, durationMinutes: 20, confirmed: false } : null,
    qualification: q,
    transcript: session.turns.map((t) => ({ role: t.role, text: t.text, at: new Date(t.at).toISOString() })),
  };
}

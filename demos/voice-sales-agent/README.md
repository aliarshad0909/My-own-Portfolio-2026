# Kestrel Fleet Systems — voice sales agent demo

An inbound sales agent that qualifies a lead, answers common product questions
and requests a callback. Built as a portfolio demonstration by Ali Arshad.

**Three things this is not:**

1. **Not a language model.** It is a deterministic slot-filling state machine. Every sentence it says is written in `src/lib/dialogue.ts`. It cannot compose a new one, which is exactly why it cannot invent a price or a promise.
2. **Not telephony.** It runs in a browser tab. It makes no calls, receives no calls and dials nothing. There is no outbound calling of any kind.
3. **Not a real company.** Kestrel Fleet Systems is fictional, and no lead data is transmitted anywhere.

Project 04 of the portfolio expansion.

## What actually works

- **Slot filling from natural speech** — need, fleet size, timeline, budget, name, company, email and preferred call slot, extracted from whatever the caller says, several at a time.
- **Entity parsing that handles how people actually talk** — "about a dozen", "between 20 and 30", "more than 100", "3k per month", "sam at example dot com".
- **Product answers** — a fixed set of factual answers about pricing, installation, contracts, integrations and trials. Asked mid-flow, the agent answers and then repeats its open question without losing its place.
- **Live qualification scoring** — 0–100 across fleet size, timeline, budget, use case and contact, with **every point explained on screen**. No hidden weighting.
- **Escalation and decline** — asking for a person hands off immediately; "not interested" closes the call cleanly and says it won't follow up.
- **A loop guard** — an unrecognised answer to an optional question is marked as declined and the agent moves on. For a required one it re-asks once, then hands to a specialist. It never asks the same thing three times.
- **CRM handoff payload** — the JSON a real deployment would POST, shown in full, with `appointmentRequest.confirmed: false` because nothing is really booked.
- **Three sample calls** that play through the whole flow.

## Voice

Speech input and output use the browser's own Web Speech API **when it is
available and actually working**:

- The microphone button is offered only when a recognition engine exists.
- Voice output is offered only when the browser reports at least one installed voice — some environments expose `speechSynthesis` with no voices, where speaking is silently a no-op.
- If recognition returns neither a result nor an error within 8 seconds, the agent stops, says the engine isn't responding, and points you at the text box.
- Typing always works and is the primary path, not a fallback bolted on afterwards.

Some browsers send captured audio to a vendor service for recognition. This app
records nothing and uploads nothing of its own.

## What a real phone deployment would need

Not included here, and not pretended:

- A telephony provider (SIP or a programmable voice API) and a number.
- A server-side agent runtime — Pipecat (BSD-2-Clause) or LiveKit Agents (Apache-2.0) are the open frameworks assessed in `docs/OPEN_SOURCE_RESEARCH.md`.
- Recorded-call consent and the relevant local compliance. Rules differ by jurisdiction, and in several places all parties must consent.
- No unsolicited outbound calling. This demo exists for inbound only.

## Running it

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm test           # 28 unit tests
```

```bash
npm run build && npx serve dist
npx playwright install chromium
node e2e/smoke.mjs http://localhost:3000
```

## Tests

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/dialogue.test.ts` | 28 | Fleet-size, budget, need, timeline, name, company and email extraction including spoken forms; budget-versus-fleet-size disambiguation; product answers; full qualification to a booked slot; handoff and decline; the loop guard; scoring bands; and an assertion that every agent line is scripted. |
| `e2e/smoke.mjs` | 20 | Disclosure, graceful degradation when the speech engine is absent or silent, multi-slot capture, live scoring, mid-flow product questions, spoken email parsing, qualification, CRM payload shape, escalation, decline, the loop guard and a scripted sample call. |
| `qa` sweep | 8 | Layout at 5 widths, skip link, touch targets, console errors. |

All pass as of the last commit. The end-to-end run deliberately exercises the
degraded path: headless Chromium exposes the speech APIs but installs no voices
and never returns a result, which is how the timeout and the "voice
unavailable" state got built in the first place.

## Technology

React 19, TypeScript, esbuild. No AI SDK, no speech library, no UI framework.
Fonts (Outfit, IBM Plex Sans) from Google Fonts under the SIL Open Font License.

## Deploying

Static output. Deploy as its own Vercel project with root directory
`demos/voice-sales-agent`, then set `liveUrl` in the portfolio's `lib/projects.ts`.
Speech input needs HTTPS in most browsers, which Vercel provides.

# Tideline — support agent demo

A working customer support assistant built as a portfolio demonstration by
Ali Arshad.

**Tideline is a fictional product, and this is not a language model.** The
assistant ranks a fixed knowledge base of 24 articles and quotes the best match
back to you. It cannot write a new sentence. When nothing scores highly enough
it says so and offers a person — it never guesses. The interface states this in
the banner and in the assistant's first message.

Project 03 of the portfolio expansion.

## How the retrieval works

1. **Tokenise** — lowercase, strip punctuation, drop stopwords, apply a light stemmer so "subscriptions" matches "subscription".
2. **Expand synonyms, both ways** — a customer typing "bill" reaches an article that says "invoice", and vice versa. The expansion map is inverted at load so neither direction is privileged.
3. **Rank with Okapi BM25** — standard term weighting (k₁ = 1.4, b = 0.72) with an inverse document frequency term, plus a 1.8× boost for terms appearing in an article's title or its listed question phrasings.
4. **Score confidence** — 75% from how much of the question actually matched, 25% from the margin over the runner-up. One stray keyword in a long question is not confidence.
5. **Decide** — above 50%, answer with the article text and cite it. Below, show the closest matches, record the question as a gap, and offer a human.

Asking for a person in plain language ("talk to someone", "I want a human")
escalates immediately, whatever the knowledge base says.

## What actually works

- Conversational chat with suggested replies, full transcript and scroll management.
- Answers quoted from articles, each with a visible source link and match percentage.
- Honest refusal with near-matches when confidence is low.
- Human escalation with a consent-gated contact form and validation.
- A handoff payload — the JSON a real deployment would POST to a helpdesk — shown in full so you can see exactly what would be sent.
- Operator view: questions asked, answered from the knowledge base, live deflection rate, conversation status, and the list of unanswered questions (the articles worth writing next).
- Browsable knowledge base with search and category filters, linked from each answer.

## What is deliberately not here

| Area | Reality |
| --- | --- |
| Language model | None. No API key, no network call, no generated text. |
| Delivery | The handoff is displayed, not sent. Nothing leaves the browser. |
| Persistence | Conversations are per-page-load. No storage, no tracking. |
| Auth | None. The operator view is visible to anyone. |

## Adding a real model later

The decision point is one function, `respond()` in `src/lib/conversation.ts`.
A production version would keep the retrieval step and pass the top articles to
a model as context (retrieval-augmented generation), so answers stay grounded in
real documentation. The pieces already in place for that:

- `search()` returns ranked articles with scores — that is the retrieval half of RAG.
- `confidence()` already decides when not to answer, which is the guard a model needs most.
- `handoffPayload()` is the escape hatch to a human.

What would need adding: a server route holding the API key (never the browser),
a token budget, a cost ceiling, logging and a privacy policy covering what is
sent to the provider. None of that is faked here.

## Running it

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm test           # 43 unit tests
```

```bash
npm run build && npx serve dist
npx playwright install chromium
node e2e/smoke.mjs http://localhost:3000
```

## Tests

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/agent.test.ts` | 43 | Tokenising and stemming, bidirectional synonyms, **all 24 articles retrieved correctly from a natural-language question**, no match for off-topic input, deterministic ranking, confidence thresholds, and — importantly — an assertion that every sourced agent reply is verbatim article text, so the agent provably cannot invent an answer. Also escalation triggers, transcript ordering, contact validation and handoff payload shape. |
| `e2e/smoke.mjs` | 17 | Disclosure on open, answering with citations, honest refusal, gap logging, live deflection rate, synonym routing, resolve and escalate flows, handoff validation and payload, knowledge-base search and filters, reset, runtime errors. |
| `qa` sweep | 8 | Layout at 5 widths, skip link, touch targets, console errors. |

All pass as of the last commit.

## Technology

React 19, TypeScript, esbuild. No AI SDK, no search library, no UI framework —
the BM25 implementation is about 80 lines in `src/lib/retrieval.ts`. Fonts
(Sora, Inter) from Google Fonts under the SIL Open Font License.

## Deploying

Static output. Deploy as its own Vercel project with root directory
`demos/support-agent`, then set `liveUrl` in the portfolio's `lib/projects.ts`.

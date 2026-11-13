# Inbound lead qualification — n8n workflow

A reusable automation that takes a website inquiry and turns it into a
qualified, scored, deduplicated CRM record with a drafted reply waiting for
human approval. Built as a portfolio deliverable by Ali Arshad.

Project 05 of the portfolio expansion.

```
Website inquiry → validate → duplicate check → qualify → route by band
                                                      ├─ hot/warm → CRM → Slack + drafted reply → human approval
                                                      └─ cold     → logged for weekly review
```

See `docs/workflow-diagram.svg`.

## Licence boundary — read this first

n8n is published under the **Sustainable Use License**, which is
source-available, not OSI open source. It permits internal business use and
building workflows on a client's own instance, but **not** reselling n8n or
hosting it for others.

This directory therefore contains **only workflow JSON that Ali wrote**. No n8n
source code is bundled or redistributed, and nothing here hosts n8n for anyone.
Files marked `.ee.` in the n8n repository sit under a separate commercial
licence and are not involved. If a client ever wants a hosted instance, that
needs a commercial agreement with n8n. Full assessment in
`docs/OPEN_SOURCE_RESEARCH.md` at the repository root.

## Importing it

1. In n8n: **Workflows → Import from file** → `workflows/inbound-lead-qualification.json`.
2. Set the environment variables below on your n8n instance, then restart it.
3. Open the workflow and activate it. The production webhook URL appears on the first node.
4. Point your contact form at that URL with `Content-Type: application/json`.

### Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `CRM_WEBHOOK_URL` | Create CRM record | Where the qualified lead is posted |
| `CRM_API_TOKEN` | Create CRM record | Sent as `Authorization: Bearer …` |
| `SLACK_WEBHOOK_URL` | Notify sales | Incoming-webhook URL for the alert |
| `APPROVAL_WEBHOOK_URL` | Queue for human approval | Where the drafted reply waits for a person |

**No credentials are in the export.** Every outbound node reads its URL and
token from `$env`, and a test asserts that — the export is checked for a
`credentials` block and for anything shaped like an API key before it ships.

Two nodes are deliberately generic so the workflow imports with nothing
configured: *Look up existing lead* is a No-Op you replace with your CRM's
"search by email", and *Detect duplicates* uses n8n's static data, which you
would swap for Redis or the CRM itself once more than one n8n instance is
running.

## What the workflow does

**Validation** — required fields, length bounds, email shape, explicit consent,
and a honeypot field. Disposable domains are rejected. Everything is trimmed
and lowercased. Invalid inquiries get a `422` with the list of problems, so the
form can show real errors.

**Duplicate detection** — keyed on email over a rolling 30-day window. A repeat
is not discarded; it is flagged, counted and scored down, because a second
inquiry from the same person is a signal, not noise.

**Qualification** — a transparent 0–100 score. Budget band, a named company, a
business (non-freemail) domain, a specific service, a detailed brief and
high-intent language all add points; low-intent language and duplicates
subtract. Every point is recorded with its reason and travels with the lead, so
a salesperson can see exactly why it scored what it did.

**Routing** — hot and warm leads reach the CRM and Slack; cold leads are logged
for a weekly review rather than chased.

**Drafted follow-up** — composed from fixed fragments. No model is called, so
the wording cannot drift and no promise can be invented. The draft quotes the
inquiry rather than paraphrasing it.

**Human approval** — the draft is queued with `status: "pending_human_approval"`.
Nothing is ever emailed automatically. A test asserts no mail-sending node
exists in the workflow at all.

**Error handling** — every outbound call retries three times with a timeout and
routes failures to a *Record failure* node that keeps enough context to retry by
hand. The webhook always gets a response, success or failure.

## Testing

n8n itself is not installed here, so the tests take a different approach: they
**extract the JavaScript from each Code node and execute it** against the
example payloads with n8n's globals (`$input`, `$getWorkflowStaticData`) mocked.

```bash
npm test     # 22 tests
```

| Group | Covers |
| --- | --- |
| Export | Structure, unique ids and names, no orphan nodes, every connection resolves, no credentials or secrets, retry and timeout on every HTTP node, both webhook responses present, no mail-sending node. |
| Validation | Accepts a good inquiry, rejects a bad one naming all five problems, flags freemail and disposable domains, trims and lowercases. |
| Duplicates | First-time pass-through, repeat detection, different email unaffected. |
| Qualification | Hot and cold banding with reasons, duplicate penalty, score clamped to 0–100. |
| Draft | Addressed to the sender, pending approval, quotes the inquiry, truncates long messages. |

**What this does not prove:** that the workflow runs inside n8n. Only importing
it into a real instance proves that. The tests prove the logic it carries is
correct and the export is clean.

## Example payloads

`examples/input-hot-lead.json`, `input-cold-lead.json`, `input-invalid.json`.

Posting the hot-lead example produces, before any outbound call:

```json
{
  "valid": true,
  "isDuplicate": false,
  "score": 97,
  "band": "hot",
  "reasons": [
    "Budget \"$15,000+\" (+35)",
    "Company named (+12)",
    "Business domain harlowlogistics.example (+15)",
    "Specific service: web & software development (+10)",
    "Detailed brief (+10)",
    "High-intent language (+15)"
  ],
  "approval": { "status": "pending_human_approval", "to": "dana@harlowlogistics.example" }
}
```

## Connecting it to the portfolio contact form

The portfolio's `/api/inquiry` route already posts a JSON body and supports a
shared secret. Set `INQUIRY_WEBHOOK_URL` there to this workflow's production
URL and the two line up — the field names match. Add a check on
`x-inquiry-secret` as the first step if you want the workflow to reject anything
that did not come from the site.

## Before using this with real leads

- [ ] Replace the No-Op lookup with a real CRM search, and the static-data store with Redis or the CRM, before running more than one n8n instance.
- [ ] Confirm your privacy notice covers storing inquiry details and the lawful basis for processing them.
- [ ] Review the scoring weights against your own pipeline — they are a starting point, not a universal truth.
- [ ] Decide retention: how long drafted replies and lead records are kept.

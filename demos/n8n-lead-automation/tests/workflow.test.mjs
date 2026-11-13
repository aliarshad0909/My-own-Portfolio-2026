/**
 * Validates the exported workflow and EXECUTES the JavaScript inside its Code
 * nodes against the example payloads, with n8n's globals mocked.
 *
 * This does not prove the workflow runs in n8n — only n8n can prove that. It
 * proves the logic the workflow carries is correct and that the export is
 * structurally sound and free of credentials.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const wf = JSON.parse(readFileSync(join(here, "../workflows/inbound-lead-qualification.json"), "utf8"));
const example = (n) => JSON.parse(readFileSync(join(here, `../examples/${n}.json`), "utf8"));

const nodeNamed = (name) => wf.nodes.find((n) => n.name === name);
const codeOf = (name) => nodeNamed(name).parameters.jsCode;

/** Run one Code node's source with n8n's globals mocked. */
function runCode(name, items, staticData = {}) {
  const src = codeOf(name);
  const $input = { all: () => items.map((json) => ({ json })) };
  const $getWorkflowStaticData = () => staticData;
  const fn = new Function("$input", "$getWorkflowStaticData", `${src}`);
  return fn($input, $getWorkflowStaticData).map((r) => r.json);
}

describe("workflow export", () => {
  it("is structurally valid", () => {
    assert.equal(typeof wf.name, "string");
    assert.ok(wf.nodes.length >= 12, `${wf.nodes.length} nodes`);
    for (const n of wf.nodes) {
      assert.ok(n.id && n.name && n.type, `node missing fields: ${JSON.stringify(n).slice(0, 80)}`);
      assert.ok(Array.isArray(n.position) && n.position.length === 2, `${n.name} has no position`);
      assert.ok(typeof n.typeVersion === "number", `${n.name} has no typeVersion`);
    }
    assert.equal(new Set(wf.nodes.map((n) => n.id)).size, wf.nodes.length, "node ids must be unique");
    assert.equal(new Set(wf.nodes.map((n) => n.name)).size, wf.nodes.length, "node names must be unique");
  });

  it("only connects nodes that exist", () => {
    const names = new Set(wf.nodes.map((n) => n.name));
    for (const [from, conn] of Object.entries(wf.connections)) {
      assert.ok(names.has(from), `connection from unknown node ${from}`);
      for (const outputs of conn.main) for (const c of outputs) assert.ok(names.has(c.node), `connection to unknown node ${c.node}`);
    }
  });

  it("has no orphan nodes", () => {
    const targets = new Set(Object.values(wf.connections).flatMap((c) => c.main.flat().map((x) => x.node)));
    const sources = new Set(Object.keys(wf.connections));
    for (const n of wf.nodes) {
      const isEntry = n.type === "n8n-nodes-base.webhook";
      assert.ok(isEntry || targets.has(n.name), `${n.name} is never reached`);
      const isTerminal = n.type === "n8n-nodes-base.respondToWebhook" || n.name === "Record failure" || n.name === "Notify sales (Slack)";
      assert.ok(isTerminal || sources.has(n.name), `${n.name} goes nowhere`);
    }
  });

  it("contains no credentials or hardcoded secrets", () => {
    const raw = JSON.stringify(wf);
    assert.equal(raw.includes('"credentials"'), false, "the export must not carry credentials");
    for (const pattern of [/sk-[a-zA-Z0-9]{16,}/, /xox[baprs]-[a-zA-Z0-9-]{10,}/, /Bearer\s+(?!\{\{)[A-Za-z0-9._-]{16,}/, /AKIA[0-9A-Z]{16}/]) {
      assert.equal(pattern.test(raw), false, `possible secret matching ${pattern}`);
    }
    // Every outbound call takes its target and token from the environment.
    for (const n of wf.nodes.filter((x) => x.type === "n8n-nodes-base.httpRequest")) {
      assert.match(n.parameters.url, /\$env\./, `${n.name} must read its URL from $env`);
    }
  });

  it("retries and handles failure on every outbound call", () => {
    for (const n of wf.nodes.filter((x) => x.type === "n8n-nodes-base.httpRequest")) {
      assert.ok(n.parameters.options?.retry?.retry?.maxTries >= 3, `${n.name} has no retry policy`);
      assert.ok(n.parameters.options?.timeout, `${n.name} has no timeout`);
      assert.ok(n.onError, `${n.name} has no error handling`);
    }
    assert.ok(nodeNamed("Record failure"), "there must be a failure path");
  });

  it("always answers the webhook", () => {
    const responders = wf.nodes.filter((n) => n.type === "n8n-nodes-base.respondToWebhook");
    assert.equal(responders.length, 2, "one success and one rejection response");
    assert.deepEqual(responders.map((r) => r.parameters.responseCode).sort(), [200, 422]);
  });

  it("never sends email automatically", () => {
    const raw = JSON.stringify(wf).toLowerCase();
    assert.equal(/"type":\s*"n8n-nodes-base\.(emailsend|gmail|sendgrid)"/.test(raw), false, "no node may send mail directly");
    assert.match(codeOf("Draft follow-up"), /pending_human_approval/);
  });
});

describe("validation node", () => {
  it("accepts a complete inquiry and normalises it", () => {
    const [out] = runCode("Validate and normalise", [example("input-hot-lead")]);
    assert.equal(out.valid, true);
    assert.deepEqual(out.errors, []);
    assert.equal(out.lead.email, "dana@harlowlogistics.example");
    assert.equal(out.lead.freemail, false);
    assert.equal(out.lead.domain, "harlowlogistics.example");
    assert.match(out.lead.receivedAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  it("rejects a bad inquiry and names every problem", () => {
    const [out] = runCode("Validate and normalise", [example("input-invalid")]);
    assert.equal(out.valid, false);
    assert.deepEqual(out.errors.sort(), ["consent", "email", "honeypot", "message", "name"]);
  });

  it("flags freemail and disposable domains", () => {
    const [free] = runCode("Validate and normalise", [example("input-cold-lead")]);
    assert.equal(free.lead.freemail, true);
    const [disp] = runCode("Validate and normalise", [{ body: { name: "Bot", email: "x@mailinator.com", message: "a".repeat(40), consent: true } }]);
    assert.equal(disp.disposable, true);
    assert.equal(disp.valid, false);
  });

  it("lowercases and trims", () => {
    const [out] = runCode("Validate and normalise", [{ body: { name: "  Ada  ", email: "  ADA@Example.COM ", message: "x".repeat(30), consent: "true" } }]);
    assert.equal(out.lead.email, "ada@example.com");
    assert.equal(out.lead.name, "Ada");
    assert.equal(out.lead.consent, true);
  });
});

describe("duplicate detection", () => {
  it("passes a first-time lead through", () => {
    const store = {};
    const valid = runCode("Validate and normalise", [example("input-hot-lead")]);
    const [out] = runCode("Detect duplicates", valid, store);
    assert.equal(out.isDuplicate, false);
    assert.equal(out.previousCount, 0);
  });

  it("flags the same email again inside the window", () => {
    const store = {};
    const valid = runCode("Validate and normalise", [example("input-hot-lead")]);
    runCode("Detect duplicates", valid, store);
    const [second] = runCode("Detect duplicates", valid, store);
    assert.equal(second.isDuplicate, true);
    assert.equal(second.previousCount, 1);
  });

  it("does not flag a different email", () => {
    const store = {};
    runCode("Detect duplicates", runCode("Validate and normalise", [example("input-hot-lead")]), store);
    const other = runCode("Validate and normalise", [example("input-cold-lead")]);
    const [out] = runCode("Detect duplicates", other, store);
    assert.equal(out.isDuplicate, false);
  });
});

describe("qualification", () => {
  const pipeline = (payload, store = {}) => {
    const valid = runCode("Validate and normalise", [payload]);
    const deduped = runCode("Detect duplicates", valid, store);
    return runCode("Qualify lead", deduped)[0];
  };

  it("scores a budgeted business enquiry hot and explains why", () => {
    const out = pipeline(example("input-hot-lead"));
    assert.equal(out.band, "hot");
    assert.ok(out.score >= 60, `scored ${out.score}`);
    assert.ok(out.reasons.some((r) => r.includes("Business domain")));
    assert.ok(out.reasons.some((r) => r.includes("High-intent")));
    assert.equal(out.reasons.length >= 5, true);
  });

  it("scores a student enquiry cold", () => {
    const out = pipeline(example("input-cold-lead"));
    assert.equal(out.band, "cold");
    assert.ok(out.reasons.some((r) => r.includes("Low-intent")));
  });

  it("penalises a duplicate", () => {
    const store = {};
    const first = pipeline(example("input-hot-lead"), store);
    const second = pipeline(example("input-hot-lead"), store);
    assert.equal(second.score, first.score - 10);
    assert.ok(second.reasons.some((r) => r.includes("Duplicate")));
  });

  it("keeps the score inside 0–100", () => {
    const low = pipeline({ body: { name: "Student One", email: "s@gmail.com", message: "just curious, free thesis assignment help please, student here", consent: true } });
    assert.ok(low.score >= 0 && low.score <= 100, String(low.score));
  });
});

describe("follow-up draft", () => {
  const draftFor = (payload) => {
    const valid = runCode("Validate and normalise", [payload]);
    const deduped = runCode("Detect duplicates", valid, {});
    const scored = runCode("Qualify lead", deduped);
    return runCode("Draft follow-up", scored)[0];
  };

  it("drafts a reply addressed to the sender, pending approval", () => {
    const out = draftFor(example("input-hot-lead"));
    assert.equal(out.approval.status, "pending_human_approval");
    assert.equal(out.approval.to, "dana@harlowlogistics.example");
    assert.match(out.approval.draft, /^Hi Dana,/);
    assert.match(out.approval.draft, /20-minute call/);
    assert.match(out.approval.subject, /your enquiry/);
  });

  it("uses a softer opener for a cold lead", () => {
    const out = draftFor(example("input-cold-lead"));
    assert.match(out.approval.draft, /^Hi Sam,/);
    assert.match(out.approval.draft, /right fit/);
  });

  it("quotes the enquiry rather than paraphrasing it", () => {
    const out = draftFor(example("input-hot-lead"));
    assert.ok(out.approval.draft.includes("customer portal to replace a spreadsheet"));
  });

  it("truncates a very long message instead of pasting it whole", () => {
    const out = draftFor({ body: { name: "Long Writer", email: "l@corp.example", message: "x".repeat(900), consent: true } });
    assert.ok(out.approval.draft.includes("…"));
    assert.ok(out.approval.draft.length < 900);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WebhookLedger, signPayload, verifyWebhookSignature } from "./index.mjs";

describe("webhook-deadletter-replay", () => {
  it("verifies HMAC signatures, ignores duplicate events, and replays dead letters", () => {
    const ts = 1_750_000_000;
    const sig = signPayload("s3cr3t", ts, "{}");
    assert.equal(verifyWebhookSignature("s3cr3t", ts, "{}", sig, ts + 10).ok, true);
    assert.equal(verifyWebhookSignature("s3cr3t", ts, "{}", sig, ts + 999).ok, false);
    const ledger = new WebhookLedger();
    assert.equal(ledger.ingest("evt_1", () => {}).status, "processed");
    assert.equal(ledger.ingest("evt_1", () => {}).status, "duplicate_ignored");
    assert.equal(ledger.ingest("evt_2", () => { throw new Error("timeout"); }).status, "dead_lettered");
    assert.deepEqual(ledger.replayDeadLetters(() => {}), { replayed: 1, remaining: 0 });
  });
});

import crypto from "node:crypto";

export function signPayload(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyWebhookSignature(secret, timestamp, body, signatureHex, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300) {
  if (Math.abs(nowSec - timestamp) > toleranceSec) return { ok: false, reason: "timestamp_expired" };
  const expected = signPayload(secret, timestamp, body);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(String(signatureHex || ""), "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: "invalid_signature" };
  return { ok: true };
}

export class WebhookLedger {
  constructor() { this.processed = new Set(); this.deadLetters = []; }
  ingest(eventId, handler) {
    if (this.processed.has(eventId)) return { status: "duplicate_ignored" };
    try {
      handler();
      this.processed.add(eventId);
      return { status: "processed" };
    } catch (err) {
      this.deadLetters.push({ eventId, error: err.message, attempts: 1 });
      return { status: "dead_lettered" };
    }
  }
  replayDeadLetters(handler) {
    const remaining = [];
    let replayed = 0;
    for (const item of this.deadLetters) {
      try {
        handler(item.eventId);
        this.processed.add(item.eventId);
        replayed += 1;
      } catch (err) {
        remaining.push({ ...item, error: err.message, attempts: item.attempts + 1 });
      }
    }
    this.deadLetters = remaining;
    return { replayed, remaining: remaining.length };
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const ts = 1_750_000_000;
  const sig = signPayload("demo-secret", ts, '{"order":"101"}');
  console.log(JSON.stringify({ verify: verifyWebhookSignature("demo-secret", ts, '{"order":"101"}', sig, ts + 5) }));
}

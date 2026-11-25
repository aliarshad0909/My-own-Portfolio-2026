import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  decryptAtRest,
  encryptAtRest,
  hashAdminPassword,
  isAdminAuthConfigured,
  parseCookieFromHeader,
  shouldUseSecureCookie,
  verifyAdminCredentials,
  verifyAdminPassword,
  verifyCsrfToken,
  verifySessionToken,
} from "@/lib/admin/auth-core";
import { adminRateLimit } from "@/lib/admin/rate-limit";

const SAVED_ENV = { ...process.env };
const SAVED_FETCH = globalThis.fetch;

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in SAVED_ENV)) delete process.env[key];
  }
  Object.assign(process.env, SAVED_ENV);
  globalThis.fetch = SAVED_FETCH;
});

function configureTestAdminEnv(password = "StudioStrongPass!2026") {
  process.env.ADMIN_EMAIL = "owner@aliarshad.co";
  process.env.ADMIN_PASSWORD_HASH = hashAdminPassword(password);
  process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters-0123456789";
  process.env.ADMIN_ENCRYPTION_KEY = "test-encryption-key-with-at-least-32-characters-9876543210";
}

describe("admin auth core — scrypt, sessions, CSRF, encryption", () => {
  it("hashes and verifies passwords in constant time and rejects malformed hashes", () => {
    const hashA = hashAdminPassword("MySuperSecretStudioPass!");
    const hashB = hashAdminPassword("MySuperSecretStudioPass!");
    assert.ok(hashA.startsWith("scrypt$"));
    assert.notEqual(hashA, hashB, "each hash must use a unique random salt");
    assert.equal(verifyAdminPassword("MySuperSecretStudioPass!", hashA), true);
    assert.equal(verifyAdminPassword("WrongPassword!", hashA), false);
    assert.equal(verifyAdminPassword("MySuperSecretStudioPass!", "plain$abc$def"), false);
    assert.equal(verifyAdminPassword("", hashA), false);
  });

  it("enforces explicit single-owner email allowlist and configuration checks", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_SESSION_SECRET;
    assert.equal(isAdminAuthConfigured(), false);
    assert.equal(verifyAdminCredentials("owner@aliarshad.co", "anything"), false);

    configureTestAdminEnv("StudioStrongPass!2026");
    assert.equal(isAdminAuthConfigured(), true);
    assert.equal(verifyAdminCredentials("OWNER@aliarshad.co", "StudioStrongPass!2026"), true);
    assert.equal(verifyAdminCredentials("intruder@example.com", "StudioStrongPass!2026"), false);
    assert.equal(verifyAdminCredentials("owner@aliarshad.co", "WrongPass"), false);
  });

  it("mints signed session tokens and rejects tampered, expired, or rotated-secret tokens", () => {
    configureTestAdminEnv();
    const now = 1_760_000_000_000;
    const { token, payload } = createSessionToken("owner@aliarshad.co", now);

    const verified = verifySessionToken(token, now + 5_000);
    assert.ok(verified);
    assert.equal(verified.sub, "owner@aliarshad.co");
    assert.equal(verified.csrf, payload.csrf);

    // Tampered signature
    assert.equal(verifySessionToken(`${token}tamper`, now + 5_000), null);

    // Tampered payload
    const [, sig] = token.split(".");
    const fakePayload = Buffer.from(JSON.stringify({ ...payload, sub: "attacker@evil.test" })).toString("base64url");
    assert.equal(verifySessionToken(`${fakePayload}.${sig}`, now + 5_000), null);

    // Expired session
    const afterExpiry = now + (ADMIN_SESSION_TTL_SECONDS + 10) * 1000;
    assert.equal(verifySessionToken(token, afterExpiry), null);

    // Rotated session secret invalidates old tokens immediately
    process.env.ADMIN_SESSION_SECRET = "rotated-new-session-secret-with-more-than-32-characters-xyz";
    assert.equal(verifySessionToken(token, now + 5_000), null);
  });

  it("validates CSRF header tokens and parses raw cookie headers safely", () => {
    configureTestAdminEnv();
    const { token, payload } = createSessionToken("owner@aliarshad.co");
    assert.equal(verifyCsrfToken(payload, payload.csrf), true);
    assert.equal(verifyCsrfToken(payload, "wrong-csrf-token"), false);
    assert.equal(verifyCsrfToken(payload, null), false);

    const cookieHeader = `foo=bar; ${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; theme=dark`;
    assert.equal(parseCookieFromHeader(cookieHeader, ADMIN_SESSION_COOKIE), token);
    assert.equal(parseCookieFromHeader(cookieHeader, "missing"), null);
  });

  it("encrypts and decrypts OAuth tokens at rest via AES-256-GCM and rejects tampering", () => {
    configureTestAdminEnv();
    const secretToken = "ya29.fake-oauth-access-token-value-12345";
    const enc1 = encryptAtRest(secretToken);
    const enc2 = encryptAtRest(secretToken);
    assert.ok(enc1.startsWith("v1."));
    assert.notEqual(enc1, enc2, "random IV must produce distinct ciphertexts");
    assert.equal(decryptAtRest(enc1), secretToken);
    assert.equal(decryptAtRest(`${enc1}x`), null);
    assert.equal(decryptAtRest("not-valid-ciphertext"), null);
  });

  it("sets Secure cookies on production HTTPS while allowing local loopback HTTP testing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    assert.equal(shouldUseSecureCookie(new Request("https://www.aliarshad.co/api/admin/auth/login")), true);
    assert.equal(shouldUseSecureCookie(new Request("http://127.0.0.1:3000/api/admin/auth/login")), false);
  });
});

describe("admin distributed-ready rate limiting", () => {
  it("falls back to in-memory rate limiting when Upstash is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const key = `test-mem-${Date.now()}`;
    const r1 = await adminRateLimit(key, 2, 60);
    const r2 = await adminRateLimit(key, 2, 60);
    const r3 = await adminRateLimit(key, 2, 60);
    assert.equal(r1.allowed, true);
    assert.equal(r1.backend, "memory");
    assert.equal(r2.allowed, true);
    assert.equal(r3.allowed, false);
    assert.ok(r3.retryAfter > 0);
  });

  it("uses Upstash Redis REST pipeline when configured and falls back cleanly on network failure", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-test-token";

    globalThis.fetch = (async () =>
      new Response(JSON.stringify([{ result: 6 }, { result: 1 }, { result: 120 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;

    const blocked = await adminRateLimit("test-upstash-key", 5, 300);
    assert.equal(blocked.backend, "upstash");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfter, 120);

    // Network failure falls back gracefully to in-memory limiter
    globalThis.fetch = (async () => {
      throw new TypeError("network down");
    }) as typeof fetch;
    const fallback = await adminRateLimit(`test-fallback-${Date.now()}`, 5, 300);
    assert.equal(fallback.backend, "memory");
    assert.equal(fallback.allowed, true);
  });
});

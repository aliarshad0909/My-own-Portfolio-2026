/**
 * Pure Node.js crypto, scrypt password hashing, HMAC-SHA256 session tokens,
 * CSRF token checks, and AES-256-GCM encryption for /admin.
 * Zero `next/*` imports so unit tests can import this directly under `node --test`.
 */
import crypto from "node:crypto";
import { envVar } from "@/lib/form-security";

export const ADMIN_SESSION_COOKIE = "ali_studio_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours
export const MIN_SECRET_BYTES = 32;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

export type AdminSessionPayload = {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  csrf: string;
};

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Configured admin email allowlist (strictly one explicit owner account). */
export function configuredAdminEmail(): string {
  return envVar("ADMIN_EMAIL").toLowerCase();
}

export function configuredSessionSecret(): string {
  return envVar("ADMIN_SESSION_SECRET");
}

export function configuredPasswordHash(): string {
  return envVar("ADMIN_PASSWORD_HASH");
}

/**
 * True only when all three required authentication env vars are present and strong:
 * ADMIN_EMAIL, ADMIN_PASSWORD_HASH (scrypt format), and ADMIN_SESSION_SECRET (>= 32 chars).
 */
export function isAdminAuthConfigured(): boolean {
  const email = configuredAdminEmail();
  const hash = configuredPasswordHash();
  const secret = configuredSessionSecret();
  return (
    email.includes("@") &&
    hash.startsWith("scrypt$") &&
    hash.split("$").length === 3 &&
    secret.length >= MIN_SECRET_BYTES
  );
}

/**
 * Local-development demo mode toggle.
 * Explicitly requires ADMIN_DEMO_MODE=true; never activates automatically in production.
 */
export function isDemoModeEnabled(): boolean {
  return envVar("ADMIN_DEMO_MODE").toLowerCase() === "true";
}

/** Generate a salted scrypt password hash string suitable for ADMIN_PASSWORD_HASH. */
export function hashAdminPassword(password: string, saltHex?: string): string {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Constant-time verification of a password against a stored `scrypt$<saltHex>$<hashHex>` value. */
export function verifyAdminPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.trim().split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, saltHex, hashHex] = parts;
  if (!/^[0-9a-f]{32}$/i.test(saltHex) || !/^[0-9a-f]{128}$/i.test(hashHex)) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS);
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Authenticate email + password against configured single-owner credentials. */
export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!isAdminAuthConfigured()) return false;
  const cleanEmail = email.trim().toLowerCase();
  const allowedEmail = configuredAdminEmail();
  const emailMatch = timingSafeStringEqual(cleanEmail, allowedEmail);
  const passwordMatch = verifyAdminPassword(password, configuredPasswordHash());
  return emailMatch && passwordMatch;
}

function signPayloadB64(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Mint a signed session cookie value + payload for the verified admin email. */
export function createSessionToken(email: string, nowMs = Date.now()): {
  token: string;
  payload: AdminSessionPayload;
} {
  const secret = configuredSessionSecret();
  if (secret.length < MIN_SECRET_BYTES) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  }
  const iat = Math.floor(nowMs / 1000);
  const payload: AdminSessionPayload = {
    sub: email.trim().toLowerCase(),
    iat,
    exp: iat + ADMIN_SESSION_TTL_SECONDS,
    jti: crypto.randomBytes(16).toString("hex"),
    csrf: crypto.randomBytes(24).toString("base64url"),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = signPayloadB64(payloadB64, secret);
  return { token: `${payloadB64}.${sig}`, payload };
}

/** Verify signature, expiry, and allowlisted admin email of a session cookie value. */
export function verifySessionToken(token: string | undefined | null, nowMs = Date.now()): AdminSessionPayload | null {
  if (!token || !isAdminAuthConfigured()) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = signPayloadB64(payloadB64, configuredSessionSecret());
  if (!timingSafeStringEqual(providedSig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    if (
      typeof parsed.sub !== "string" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.jti !== "string" ||
      typeof parsed.csrf !== "string"
    ) {
      return null;
    }
    const nowSec = Math.floor(nowMs / 1000);
    if (parsed.exp <= nowSec || parsed.iat > nowSec + 60) return null;
    if (!timingSafeStringEqual(parsed.sub.toLowerCase(), configuredAdminEmail())) return null;
    return parsed as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function shouldUseSecureCookie(request?: Request): boolean {
  if (process.env.NODE_ENV === "production") {
    if (request) {
      const proto = request.headers.get("x-forwarded-proto");
      if (proto === "http") return false;
      try {
        const url = new URL(request.url);
        if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return false;
      } catch {
        // default secure in production
      }
    }
    return true;
  }
  return false;
}

export function sessionCookieOptions(request?: Request) {
  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}

/** Parse a specific cookie value from a raw Request `cookie` header (for Route Handlers & tests). */
export function parseCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/** Verify CSRF header against the authenticated session's CSRF token. */
export function verifyCsrfToken(session: AdminSessionPayload, headerToken: string | null): boolean {
  if (!headerToken) return false;
  return timingSafeStringEqual(session.csrf, headerToken.trim());
}

/** Derive a 32-byte encryption key for encrypting sensitive OAuth tokens at rest in Neon. */
function encryptionKey(): Buffer {
  const raw = envVar("ADMIN_ENCRYPTION_KEY") || configuredSessionSecret();
  if (raw.length < MIN_SECRET_BYTES) {
    throw new Error("ADMIN_ENCRYPTION_KEY or ADMIN_SESSION_SECRET (>= 32 chars) is required for token encryption.");
  }
  return crypto.createHash("sha256").update(`ali-studio-admin-enc-v1:${raw}`).digest();
}

export function encryptAtRest(plaintext: string): string {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptAtRest(ciphertext: string): string | null {
  try {
    const parts = ciphertext.split(".");
    if (parts.length !== 4 || parts[0] !== "v1") return null;
    const [, ivB64, tagB64, dataB64] = parts;
    const key = encryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

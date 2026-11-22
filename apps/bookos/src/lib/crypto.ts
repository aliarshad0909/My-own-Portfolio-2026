import crypto from "node:crypto";

/**
 * Cryptographic password hashing (scrypt) and session token helpers for BookOS.
 * Never stores plaintext passwords or raw session tokens in PostgreSQL.
 */

export const DEMO_ACCOUNT = {
  email: "admin@bookos.studio",
  password: "BookDemo2026!",
  name: "Elena Rostova",
  role: "admin" as const,
};

export const SESSION_COOKIE_NAME = "bookos_session";
export const SESSION_TTL_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/** Generates an unguessable random password for non-interactive seeded team fixtures. */
export function generateLockedPassword(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function resolveSessionSecret(): string {
  const configured = (process.env.SESSION_SECRET || "").trim();
  const isProdExternalDb =
    process.env.RENDER === "true" ||
    (process.env.NODE_ENV === "production" &&
      Boolean((process.env.BOOKOS_DATABASE_URL || process.env.DATABASE_URL || "").trim()));

  if (isProdExternalDb && configured.length < 32) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 random characters in production.",
    );
  }
  return configured || "bookos-local-dev-secret-change-in-production";
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac("sha256", resolveSessionSecret()).update(token).digest("hex");
}

export function generateBookingRef(): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `BK-${suffix}`;
}

export function generateSandboxReceiptRef(): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SBX-RCPT-${suffix}`;
}

import crypto from "node:crypto";

/**
 * Cryptographic password hashing (scrypt) and session token helpers for Orexa.
 * Never stores plaintext passwords or raw session tokens in PostgreSQL.
 */

export const DEMO_ACCOUNT = {
  email: "learner@orexa.studio",
  password: "OrexaDemo2026!",
  name: "Maya Lin (Demo Learner)",
  role: "demo" as const,
};

export const SESSION_COOKIE_NAME = "orexa_session";
export const SESSION_TTL_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/** Generates an unguessable random password for non-interactive seeded team/cohort fixtures. */
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
      Boolean((process.env.OREXA_DATABASE_URL || process.env.DATABASE_URL || "").trim()));

  if (isProdExternalDb && configured.length < 32) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 random characters in production.",
    );
  }
  return configured || "orexa-local-dev-session-secret-change-in-prod";
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac("sha256", resolveSessionSecret()).update(token).digest("hex");
}

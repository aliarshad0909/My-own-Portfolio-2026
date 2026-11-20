import crypto from "node:crypto";

/**
 * Cryptographic password hashing (scrypt) and session token helpers.
 * Never stores plaintext passwords or raw session tokens in PostgreSQL.
 */

export const DEMO_ACCOUNT = {
  email: "demo@pipelineos.studio",
  password: "PipelineDemo2026!",
  name: "Alex Mercer (Demo)",
  role: "demo" as const,
};

export const SESSION_COOKIE_NAME = "pipelineos_session";
export const SESSION_TTL_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
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

export function hashSessionToken(token: string): string {
  const secret = process.env.SESSION_SECRET || "pipelineos-local-dev-secret-change-in-prod";
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}


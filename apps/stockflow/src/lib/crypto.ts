import crypto from "node:crypto";

export const DEMO_ACCOUNT = {
  email: "ops@stockflow.studio",
  password: "StockFlowDemo2026!",
  name: "Samir Malik (Demo Ops)",
  role: "demo" as const,
};

export const SESSION_COOKIE_NAME = "stockflow_session";
export const SESSION_TTL_DAYS = 14;

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
  const secret = process.env.SESSION_SECRET || "stockflow-local-dev-secret-change-in-prod";
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}


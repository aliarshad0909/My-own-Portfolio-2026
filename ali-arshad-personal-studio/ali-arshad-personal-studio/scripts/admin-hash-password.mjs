#!/usr/bin/env node
/**
 * Generate a salted scrypt password hash (`ADMIN_PASSWORD_HASH`) and random session secret
 * (`ADMIN_SESSION_SECRET`) for the Private Studio Admin Console.
 *
 * Usage:
 *   npm run admin:hash-password
 *   (or pipe a password via stdin in non-interactive shells)
 */
import crypto from "node:crypto";
import readline from "node:readline";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function readPassword() {
  if (process.env.ADMIN_PASSWORD_INPUT) {
    return Promise.resolve(process.env.ADMIN_PASSWORD_INPUT);
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("Enter new admin password (minimum 12 characters): ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const password = (await readPassword()).trim();
if (password.length < 12) {
  console.error("Error: Password must be at least 12 characters long.");
  process.exit(1);
}

const hash = hashPassword(password);
const sessionSecret = crypto.randomBytes(36).toString("base64url");
const encryptionKey = crypto.randomBytes(36).toString("base64url");

console.log("\nCopy these values into .env.local or Vercel Environment Variables (never commit them):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log(`ADMIN_ENCRYPTION_KEY=${encryptionKey}\n`);

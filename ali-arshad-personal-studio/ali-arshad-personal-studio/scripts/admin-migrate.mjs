#!/usr/bin/env node
/**
 * Applies `db/migrations/001_admin_console.sql` to Neon PostgreSQL.
 * Prefers `DIRECT_DATABASE_URL` (unpooled) and falls back to `DATABASE_URL`.
 */
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const connectionString = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("Error: Set DIRECT_DATABASE_URL (preferred for migrations) or DATABASE_URL before running admin:migrate.");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), "db", "migrations", "001_admin_console.sql");
const rawSql = fs.readFileSync(sqlPath, "utf8");

// Strip comment lines and split into executable statements.
const statements = rawSql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((stmt) => stmt.trim())
  .filter(Boolean);

const sql = neon(connectionString);

try {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`Admin console schema migration complete (${statements.length} statements applied).`);
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
}

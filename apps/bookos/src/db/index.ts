import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { seedDemoData } from "@/db/seed";
import { DEMO_ACCOUNT } from "@/lib/crypto";

export type AppDatabase = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

type DbState = {
  db: AppDatabase;
  driver: "postgres" | "pglite";
  execRaw: (sql: string) => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __bookosDb?: DbState };

function loadInitMigrationSql(): string {
  const migrationPath = path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql");
  return fs.readFileSync(migrationPath, "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.BOOKOS_DATABASE_URL || process.env.DATABASE_URL || "").trim();

  if (databaseUrl) {
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 8,
      ssl: isLocal ? false : { rejectUnauthorized },
    });
    const db = drizzlePg(pool, { schema });
    return {
      db,
      driver: "postgres",
      execRaw: async (sql: string) => {
        await pool.query(sql);
      },
      initialized: false,
      initPromise: null,
    };
  }

  if (process.env.RENDER === "true") {
    throw new Error(
      "DATABASE_URL (or BOOKOS_DATABASE_URL) is required in Render production so data persists in PostgreSQL.",
    );
  }

  const dataDir =
    (process.env.PGLITE_DATA_DIR || "").trim() || path.join(process.cwd(), "data", "pgdata");
  if (dataDir !== "memory://") {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = dataDir === "memory://" ? new PGlite() : new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });

  return {
    db,
    driver: "pglite",
    execRaw: async (sql: string) => {
      await client.exec(sql);
    },
    initialized: false,
    initPromise: null,
  };
}

function getState(): DbState {
  if (!globalForDb.__bookosDb) {
    globalForDb.__bookosDb = createState();
  }
  return globalForDb.__bookosDb;
}

/**
 * Returns the ready-to-query Drizzle PostgreSQL instance, ensuring migrations
 * and initial realistic demo data are loaded once per process.
 */
export async function getDb(): Promise<AppDatabase> {
  const state = getState();
  if (!state.initialized) {
    if (!state.initPromise) {
      state.initPromise = (async () => {
        const sql = loadInitMigrationSql();
        await state.execRaw(sql);
        const existingAdmin = await state.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, DEMO_ACCOUNT.email))
          .limit(1);
        const existingServices = await state.db
          .select({ id: schema.services.id })
          .from(schema.services)
          .limit(1);

        if (existingAdmin.length === 0 && existingServices.length === 0) {
          await seedDemoData(state.db);
        } else if (existingAdmin.length === 0) {
          await seedDemoData(state.db, { usersOnly: true });
        } else if (existingServices.length === 0) {
          await seedDemoData(state.db, { skipUsers: true });
        }
        state.initialized = true;
      })();
    }
    await state.initPromise;
  }
  return state.db;
}

/**
 * Executes a callback inside an atomic PostgreSQL transaction across both
 * `node-postgres` and `pglite` Drizzle drivers.
 */
export async function withDbTransaction<T>(fn: (tx: AppDatabase) => Promise<T>): Promise<T> {
  const db = await getDb();
  const txRunner = db as PgliteDatabase<typeof schema>;
  return txRunner.transaction(async (tx) => fn(tx as unknown as AppDatabase));
}

export function getDbDriver(): "postgres" | "pglite" {
  return getState().driver;
}

/**
 * Atomically resets the demo workspace data while keeping active sessions intact
 * so visitors remain signed in after clicking Reset Demo.
 */
export async function resetDemoWorkspace(): Promise<void> {
  const state = getState();
  await getDb();
  await state.execRaw(`
    TRUNCATE TABLE reminders, bookings, availability_rules, customers, staff, services, activity_logs RESTART IDENTITY CASCADE;
  `);
  await seedDemoData(state.db, { skipUsers: true });
}

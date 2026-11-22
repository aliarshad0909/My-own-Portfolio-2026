import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { DEMO_ACCOUNT } from "@/lib/crypto";
import { seedDemoData } from "@/db/seed";

export type AppDatabase = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

type DbState = {
  db: AppDatabase;
  driver: "postgres" | "pglite";
  execRaw: (sql: string) => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __peopleosDb?: DbState };

function loadInitMigrationSql(): string {
  const migrationPath = path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql");
  return fs.readFileSync(migrationPath, "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.PEOPLEOS_DATABASE_URL || process.env.DATABASE_URL || "").trim();

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
      "DATABASE_URL (or PEOPLEOS_DATABASE_URL) is required in Render production so data persists in PostgreSQL.",
    );
  }

  const dataDir = (process.env.PGLITE_DATA_DIR || "").trim() || path.join(process.cwd(), "data", "pgdata");
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
  if (!globalForDb.__peopleosDb) {
    globalForDb.__peopleosDb = createState();
  }
  return globalForDb.__peopleosDb;
}

/**
 * Returns the ready-to-query Drizzle PostgreSQL instance, ensuring migrations
 * and initial realistic fictional HR demo data are loaded once per process.
 */
export async function getDb(): Promise<AppDatabase> {
  const state = getState();
  if (!state.initialized) {
    if (!state.initPromise) {
      state.initPromise = (async () => {
        const sql = loadInitMigrationSql();
        await state.execRaw(sql);
        const existingDemo = await state.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, DEMO_ACCOUNT.email))
          .limit(1);
        const existingDepts = await state.db
          .select({ id: schema.departments.id })
          .from(schema.departments)
          .limit(1);

        if (existingDemo.length === 0 && existingDepts.length === 0) {
          await seedDemoData(state.db);
        } else if (existingDemo.length === 0) {
          await seedDemoData(state.db, { usersOnly: true });
        } else if (existingDepts.length === 0) {
          await seedDemoData(state.db, { skipUsers: true });
        }
        state.initialized = true;
      })();
    }
    await state.initPromise;
  }
  return state.db;
}

export function getDbDriver(): "postgres" | "pglite" {
  return getState().driver;
}

/**
 * Atomically resets the demo HR workspace data while keeping active sessions intact
 * so visitors remain signed in cleanly after resetting.
 */
export async function resetDemoWorkspace(): Promise<void> {
  const state = getState();
  await getDb();
  await state.execRaw(`
    TRUNCATE TABLE
      activity_logs,
      employee_documents,
      performance_reviews,
      onboarding_tasks,
      candidates,
      leave_requests,
      attendance_logs,
      employees,
      departments
    RESTART IDENTITY CASCADE;
  `);
  await seedDemoData(state.db, { skipUsers: true });
}

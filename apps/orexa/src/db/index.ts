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

const globalForDb = globalThis as unknown as { __orexaDb?: DbState };

function loadInitMigrationSql(): string {
  const migrationPath = path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql");
  return fs.readFileSync(migrationPath, "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.OREXA_DATABASE_URL || process.env.DATABASE_URL || "").trim();

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
      "DATABASE_URL (or OREXA_DATABASE_URL) is required in Render production so Orexa learning data persists in PostgreSQL.",
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
  if (!globalForDb.__orexaDb) {
    globalForDb.__orexaDb = createState();
  }
  return globalForDb.__orexaDb;
}

/**
 * Returns the ready-to-query Drizzle PostgreSQL instance, ensuring migrations
 * and initial realistic Orexa demo curriculum data are loaded once per process.
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

        const existingCourses = await state.db
          .select({ id: schema.courses.id })
          .from(schema.courses)
          .limit(1);

        if (existingDemo.length === 0 && existingCourses.length === 0) {
          await seedDemoData(state.db);
        } else if (existingDemo.length === 0) {
          await seedDemoData(state.db, { usersOnly: true });
        } else if (existingCourses.length === 0) {
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
 * Atomically resets Orexa demo curriculum, progress, assessments, tutor history,
 * and resources back to the clean seeded dataset while preserving active sessions.
 */
export async function resetDemoWorkspace(): Promise<void> {
  const state = getState();
  await getDb();
  await state.execRaw(`
    TRUNCATE TABLE
      tutor_messages,
      assessment_attempts,
      assessments,
      lesson_progress,
      lessons,
      modules,
      resources,
      courses
    RESTART IDENTITY CASCADE;
  `);
  await seedDemoData(state.db, { skipUsers: true });
}

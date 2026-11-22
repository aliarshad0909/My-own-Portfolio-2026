import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq, sql } from "drizzle-orm";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { seedDemoData, type SeedOptions } from "@/db/seed";
import { DEMO_ACCOUNT } from "@/lib/crypto";

export type PostgresDatabase = NodePgDatabase<typeof schema>;
export type EmbeddedPgliteDatabase = PgliteDatabase<typeof schema>;
export type AppDatabase = PostgresDatabase | EmbeddedPgliteDatabase;

type PostgresTransaction = Parameters<Parameters<PostgresDatabase["transaction"]>[0]>[0];
type PgliteTransaction = Parameters<Parameters<EmbeddedPgliteDatabase["transaction"]>[0]>[0];
export type AppTransaction = PostgresTransaction | PgliteTransaction;
export type DbOrTx = AppDatabase | AppTransaction;

type DbStateBase = {
  execRaw: (sqlText: string) => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

type DbState =
  | (DbStateBase & {
      driver: "postgres";
      db: PostgresDatabase;
    })
  | (DbStateBase & {
      driver: "pglite";
      db: EmbeddedPgliteDatabase;
    });

const globalForDb = globalThis as unknown as { __projectosDb?: DbState };

function loadInitMigrationSql(): string {
  const migrationPath = path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql");
  return fs.readFileSync(migrationPath, "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.PROJECTOS_DATABASE_URL || process.env.DATABASE_URL || "").trim();

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
      execRaw: async (sqlText: string) => {
        await pool.query(sqlText);
      },
      initialized: false,
      initPromise: null,
    };
  }

  if (process.env.RENDER === "true") {
    throw new Error(
      "DATABASE_URL (or PROJECTOS_DATABASE_URL) is required in Render production so data persists in PostgreSQL.",
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
    execRaw: async (sqlText: string) => {
      await client.exec(sqlText);
    },
    initialized: false,
    initPromise: null,
  };
}

function getState(): DbState {
  if (!globalForDb.__projectosDb) {
    globalForDb.__projectosDb = createState();
  }
  return globalForDb.__projectosDb;
}

async function runInTransaction<T>(state: DbState, fn: (tx: AppTransaction) => Promise<T>): Promise<T> {
  if (state.driver === "postgres") {
    return state.db.transaction(async (tx) => fn(tx));
  }
  return state.db.transaction(async (tx) => fn(tx));
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
        const migrationSql = loadInitMigrationSql();
        await state.execRaw(migrationSql);
        const existingDemo = await state.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, DEMO_ACCOUNT.email))
          .limit(1);
        const existingProjects = await state.db
          .select({ id: schema.projects.id })
          .from(schema.projects)
          .limit(1);

        if (existingDemo.length === 0 && existingProjects.length === 0) {
          await runInTransaction(state, (tx) => seedDemoData(tx));
        } else if (existingDemo.length === 0) {
          await runInTransaction(state, (tx) => seedDemoData(tx, { usersOnly: true }));
        } else if (existingProjects.length === 0) {
          await runInTransaction(state, (tx) => seedDemoData(tx, { skipUsers: true }));
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

export type ResetDemoWorkspaceOptions = {
  /**
   * Optional seeder override (primarily for transactional rollback testing).
   * Receives the active transaction handle after TRUNCATE executes inside the same transaction.
   */
  seeder?: (tx: DbOrTx, options: SeedOptions) => Promise<void>;
};

/**
 * Atomically resets demo workspace tables inside a single database transaction
 * while keeping user accounts and active sessions intact. If any seed step throws,
 * PostgreSQL/PGlite rolls back the TRUNCATE and restores the previous workspace state.
 */
export async function resetDemoWorkspace(options: ResetDemoWorkspaceOptions = {}): Promise<void> {
  const state = getState();
  await getDb();
  const runSeed = options.seeder ?? seedDemoData;

  await runInTransaction(state, async (tx) => {
    await tx.execute(
      sql`TRUNCATE TABLE activity_logs, time_entries, task_comments, tasks, milestones, projects, team_members RESTART IDENTITY CASCADE`,
    );
    await runSeed(tx, { skipUsers: true });
  });
}

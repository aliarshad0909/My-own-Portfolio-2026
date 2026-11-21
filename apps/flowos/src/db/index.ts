import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { DEMO_ACCOUNT } from "@/lib/crypto";
import { seedFlowOsDemo } from "@/db/seed";

export type FlowOsDb = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

type DbState = {
  db: FlowOsDb;
  driver: "postgres" | "pglite";
  execRaw: (sql: string) => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __flowosDb?: DbState };

function loadInitMigrationSql(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql"),
    "utf8",
  );
}

function createState(): DbState {
  const databaseUrl = (process.env.FLOWOS_DATABASE_URL || process.env.DATABASE_URL || "").trim();
  if (databaseUrl) {
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 8,
      ssl: isLocal ? false : { rejectUnauthorized },
    });
    return {
      db: drizzlePg(pool, { schema }),
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
      "FLOWOS_DATABASE_URL (or DATABASE_URL) is required in Render production so workflows and runs persist in PostgreSQL.",
    );
  }

  const dataDir =
    (process.env.PGLITE_DATA_DIR || "").trim() || path.join(process.cwd(), "data", "pgdata");
  if (dataDir !== "memory://") fs.mkdirSync(dataDir, { recursive: true });
  const client = dataDir === "memory://" ? new PGlite() : new PGlite(dataDir);
  return {
    db: drizzlePglite(client, { schema }),
    driver: "pglite",
    execRaw: async (sql: string) => {
      await client.exec(sql);
    },
    initialized: false,
    initPromise: null,
  };
}

function getState(): DbState {
  if (!globalForDb.__flowosDb) {
    globalForDb.__flowosDb = createState();
  }
  return globalForDb.__flowosDb;
}

export async function getDb(): Promise<FlowOsDb> {
  const state = getState();
  if (!state.initialized) {
    if (!state.initPromise) {
      state.initPromise = (async () => {
        await state.execRaw(loadInitMigrationSql());
        const existingDemo = await state.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, DEMO_ACCOUNT.email))
          .limit(1);
        const existingWf = await state.db
          .select({ id: schema.workflows.id })
          .from(schema.workflows)
          .limit(1);

        if (existingDemo.length === 0 && existingWf.length === 0) {
          await seedFlowOsDemo(state.db);
        } else if (existingDemo.length === 0) {
          await seedFlowOsDemo(state.db, { usersOnly: true });
        } else if (existingWf.length === 0) {
          await seedFlowOsDemo(state.db, { skipUsers: true });
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

export async function resetDemoWorkspace(): Promise<void> {
  const state = getState();
  await getDb();
  await state.execRaw(`
    TRUNCATE TABLE
      run_steps, workflow_runs, workflows, integrations
    RESTART IDENTITY CASCADE;
  `);
  await seedFlowOsDemo(state.db, { skipUsers: true });
}

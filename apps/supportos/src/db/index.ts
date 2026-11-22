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
  close: () => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __supportosDb?: DbState };

function loadInitMigrationSql(): string {
  const migrationPath = path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql");
  return fs.readFileSync(migrationPath, "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.SUPPORTOS_DATABASE_URL || process.env.DATABASE_URL || "").trim();

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
      close: async () => {
        await pool.end();
      },
      initialized: false,
      initPromise: null,
    };
  }

  if (process.env.RENDER === "true") {
    throw new Error(
      "DATABASE_URL (or SUPPORTOS_DATABASE_URL) is required in Render production so data persists in PostgreSQL.",
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
    close: async () => {
      await client.close();
    },
    initialized: false,
    initPromise: null,
  };
}

function getState(): DbState {
  if (!globalForDb.__supportosDb) {
    globalForDb.__supportosDb = createState();
  }
  return globalForDb.__supportosDb;
}

async function syncTicketNumberSequence(state: DbState): Promise<void> {
  await state.execRaw(`
    CREATE SEQUENCE IF NOT EXISTS supportos_ticket_seq START WITH 1001 INCREMENT BY 1;
    SELECT setval(
      'supportos_ticket_seq',
      GREATEST(
        COALESCE(
          (SELECT MAX(SUBSTRING(UPPER(ticket_number) FROM '^SUP-([0-9]+)$')::bigint) FROM tickets),
          1000
        ),
        (SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END FROM supportos_ticket_seq)
      ),
      true
    );
  `);
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
        const existingDemo = await state.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, DEMO_ACCOUNT.email))
          .limit(1);
        const existingCustomers = await state.db
          .select({ id: schema.customers.id })
          .from(schema.customers)
          .limit(1);

        if (existingDemo.length === 0 && existingCustomers.length === 0) {
          await seedDemoData(state.db);
        } else if (existingDemo.length === 0) {
          await seedDemoData(state.db, { usersOnly: true });
        } else if (existingCustomers.length === 0) {
          await seedDemoData(state.db, { skipUsers: true });
        }
        await syncTicketNumberSequence(state);
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
 * Atomically resets the demo workspace data while keeping active sessions intact
 * for the demo user so visitors stay signed in cleanly after resetting.
 */
export async function resetDemoWorkspace(): Promise<void> {
  const state = getState();
  await getDb();
  await state.execRaw(`
    TRUNCATE TABLE activity_logs, ticket_messages, tickets, customers, canned_responses, kb_articles RESTART IDENTITY CASCADE;
  `);
  await seedDemoData(state.db, { skipUsers: true });
  await syncTicketNumberSequence(state);
}

export async function closeDbForTests(): Promise<void> {
  const state = globalForDb.__supportosDb;
  if (state) {
    await state.close();
    globalForDb.__supportosDb = undefined;
  }
}

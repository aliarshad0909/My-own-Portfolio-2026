import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { DEMO_ACCOUNT } from "@/lib/crypto";
import { seedStockFlowDemo } from "@/db/seed";

export type StockFlowDb = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

type DbState = {
  db: StockFlowDb;
  driver: "postgres" | "pglite";
  execRaw: (sql: string) => Promise<void>;
  initialized: boolean;
  initPromise: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __stockflowDb?: DbState };

function loadInitMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql"), "utf8");
}

function createState(): DbState {
  const databaseUrl = (process.env.STOCKFLOW_DATABASE_URL || process.env.DATABASE_URL || "").trim();
  if (databaseUrl) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 8,
      ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
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

  const dataDir = (process.env.PGLITE_DATA_DIR || "").trim() || path.join(process.cwd(), "data", "pgdata");
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
  if (!globalForDb.__stockflowDb) {
    globalForDb.__stockflowDb = createState();
  }
  return globalForDb.__stockflowDb;
}

export async function getDb(): Promise<StockFlowDb> {
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
        const existingWh = await state.db.select({ id: schema.warehouses.id }).from(schema.warehouses).limit(1);
        if (existingDemo.length === 0 && existingWh.length === 0) {
          await seedStockFlowDemo(state.db);
        } else if (existingDemo.length === 0) {
          await seedStockFlowDemo(state.db, { usersOnly: true });
        } else if (existingWh.length === 0) {
          await seedStockFlowDemo(state.db, { skipUsers: true });
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
      sales_order_items, sales_orders, customers,
      purchase_order_items, purchase_orders, suppliers,
      stock_movements, stock_levels, products, warehouses
    RESTART IDENTITY CASCADE;
  `);
  await seedStockFlowDemo(state.db, { skipUsers: true });
}


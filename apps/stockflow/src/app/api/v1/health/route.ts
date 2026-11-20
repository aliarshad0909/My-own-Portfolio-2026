import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";
import { products, stockMovements, warehouses } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const [[p], [w], [m]] = await Promise.all([
      db.select({ n: count() }).from(products),
      db.select({ n: count() }).from(warehouses),
      db.select({ n: count() }).from(stockMovements),
    ]);
    return NextResponse.json({
      ok: true,
      service: "stockflow-inventory",
      driver: getDbDriver(),
      counts: { products: p.n, warehouses: w.n, movements: m.n },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Health check failed" },
      { status: 500 },
    );
  }
}


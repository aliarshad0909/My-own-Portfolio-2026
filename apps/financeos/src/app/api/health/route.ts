import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";
import { accounts, invoices, transactions } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const [[a], [t], [i]] = await Promise.all([
      db.select({ n: count() }).from(accounts),
      db.select({ n: count() }).from(transactions),
      db.select({ n: count() }).from(invoices),
    ]);
    return NextResponse.json({
      ok: true,
      service: "financeos-erp",
      driver: getDbDriver(),
      counts: { accounts: a.n, transactions: t.n, invoices: i.n },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Health check failed" },
      { status: 500 },
    );
  }
}

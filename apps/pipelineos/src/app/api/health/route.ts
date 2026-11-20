import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";
import { contacts, deals, leads } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const [[c], [l], [d]] = await Promise.all([
      db.select({ n: count() }).from(contacts),
      db.select({ n: count() }).from(leads),
      db.select({ n: count() }).from(deals),
    ]);
    return NextResponse.json({
      ok: true,
      service: "pipelineos-crm",
      driver: getDbDriver(),
      counts: { contacts: c.n, leads: l.n, deals: d.n },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database health check failed" },
      { status: 500 },
    );
  }
}


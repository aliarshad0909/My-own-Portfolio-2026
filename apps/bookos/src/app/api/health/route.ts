import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, getDbDriver } from "@/db";
import { bookings, customers, services, staff } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const [[svc], [stf], [cust], [bk]] = await Promise.all([
      db.select({ n: count() }).from(services),
      db.select({ n: count() }).from(staff),
      db.select({ n: count() }).from(customers),
      db.select({ n: count() }).from(bookings),
    ]);
    return NextResponse.json({
      ok: true,
      service: "bookos-scheduling",
      driver: getDbDriver(),
      counts: {
        services: svc.n,
        staff: stf.n,
        customers: cust.n,
        bookings: bk.n,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database health check failed" },
      { status: 500 },
    );
  }
}

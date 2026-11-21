import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, getDbDriver } from "@/db";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      ok: true,
      app: "PeopleOS",
      driver: getDbDriver(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Database unavailable" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getDb, getDbDriver } from "@/db";
import { projects } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select({ id: projects.id }).from(projects).limit(1);
    return NextResponse.json({
      ok: true,
      app: "projectos",
      driver: getDbDriver(),
      seeded: rows.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database unavailable" },
      { status: 500 },
    );
  }
}

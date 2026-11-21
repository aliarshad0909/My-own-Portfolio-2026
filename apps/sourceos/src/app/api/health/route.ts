import { NextResponse } from "next/server";
import { getDb, getDbDriver } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb();
    return NextResponse.json({
      ok: true,
      app: "sourceos",
      driver: getDbDriver(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database health check failed" },
      { status: 500 },
    );
  }
}

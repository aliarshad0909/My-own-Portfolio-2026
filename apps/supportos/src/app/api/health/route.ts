import { NextResponse } from "next/server";
import { getDb, getDbDriver } from "@/db";

export async function GET() {
  try {
    await getDb();
    return NextResponse.json({
      ok: true,
      service: "supportos",
      driver: getDbDriver(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}

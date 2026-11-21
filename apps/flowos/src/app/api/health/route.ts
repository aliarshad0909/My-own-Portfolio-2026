import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      ok: true,
      service: "flowos-automation",
      driver: getDbDriver(),
      aiMode: process.env.OPENAI_API_KEY ? "deterministic+optional-llm" : "deterministic",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Database health check failed",
      },
      { status: 500 },
    );
  }
}

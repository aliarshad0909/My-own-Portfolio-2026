import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      ok: true,
      app: "orexa-learning-os",
      mode: "interactive-demo",
      driver: getDbDriver(),
      tutorEngine: process.env.OREXA_LLM_API_KEY ? "llm-with-deterministic-fallback" : "deterministic",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database unavailable" },
      { status: 503 },
    );
  }
}

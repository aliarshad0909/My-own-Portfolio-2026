import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getDb, getDbDriver } from "@/db";
import { datasets, savedDashboards } from "@/db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const [dsCount] = await db.select({ value: count() }).from(datasets);
    const [dashCount] = await db.select({ value: count() }).from(savedDashboards);
    return NextResponse.json({
      status: "ok",
      app: "insightos",
      driver: getDbDriver(),
      datasets: dsCount?.value ?? 0,
      savedDashboards: dashCount?.value ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Database unavailable",
      },
      { status: 500 },
    );
  }
}

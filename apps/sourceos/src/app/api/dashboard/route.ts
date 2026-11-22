import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const summary = await getDashboardSummary(db);
  return NextResponse.json(summary);
}

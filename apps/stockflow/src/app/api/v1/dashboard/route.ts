import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/inventory";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}


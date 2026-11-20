import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/analytics";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const data = await getAnalyticsData();
  return NextResponse.json(data);
}


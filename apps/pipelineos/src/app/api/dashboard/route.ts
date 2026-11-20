import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/analytics";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const data = await getDashboardData();
  return NextResponse.json(data);
}


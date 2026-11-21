import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const data = await getDashboardData(auth.user.id);
  return NextResponse.json(data);
}

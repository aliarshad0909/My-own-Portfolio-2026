import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getFinancialOverview } from "@/lib/accounting";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const overview = await getFinancialOverview();
  return NextResponse.json(overview);
}

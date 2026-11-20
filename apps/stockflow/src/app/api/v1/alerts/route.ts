import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getAlertsSummary } from "@/lib/inventory";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const alerts = await getAlertsSummary();
  return NextResponse.json(alerts);
}


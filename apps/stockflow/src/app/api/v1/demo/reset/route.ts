import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/db";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "reset"), 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Rate limited. Try again in ${limit.retryAfterSeconds}s.` }, { status: 429 });
  }

  await resetDemoWorkspace();
  return NextResponse.json({ ok: true, message: "StockFlow demo inventory reset cleanly." });
}


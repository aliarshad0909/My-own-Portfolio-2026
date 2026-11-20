import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/db";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "demo-reset"), 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Demo reset is rate-limited. Wait ${limit.retryAfterSeconds}s before resetting again.` },
      { status: 429 },
    );
  }

  await resetDemoWorkspace();
  return NextResponse.json({ ok: true, message: "Demo workspace restored to seeded state." });
}


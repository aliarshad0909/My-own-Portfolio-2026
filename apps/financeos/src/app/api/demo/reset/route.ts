import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (process.env.ALLOW_DEMO_RESET === "false") {
    return NextResponse.json({ error: "Demo workspace reset is disabled." }, { status: 403 });
  }
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "demo" && auth.user.role !== "admin") {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  const perClient = checkRateLimit(clientKey(request, "reset"), 3, 120_000);
  if (!perClient.allowed) {
    return NextResponse.json({ error: `Rate limited. Retry in ${perClient.retryAfterSeconds}s.` }, { status: 429 });
  }
  const cooldown = checkRateLimit("global:financeos-reset", 1, 15_000);
  if (!cooldown.allowed) {
    return NextResponse.json({ error: `Workspace was just reset. Retry in ${cooldown.retryAfterSeconds}s.` }, { status: 429 });
  }

  await resetDemoWorkspace();
  return NextResponse.json({ ok: true, message: "FinanceOS demonstration workspace restored." });
}

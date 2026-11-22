import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (process.env.ALLOW_DEMO_RESET === "false") {
    return NextResponse.json({ error: "Demo workspace reset is disabled." }, { status: 403 });
  }

  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "demo" && auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only demo or admin accounts may reset the demo workspace." },
      { status: 403 },
    );
  }

  const perClient = checkRateLimit(clientKey(request, "demo-reset"), 3, 120_000);
  if (!perClient.allowed) {
    return NextResponse.json(
      { error: `Demo reset is rate-limited. Wait ${perClient.retryAfterSeconds}s before resetting again.` },
      { status: 429 },
    );
  }

  const globalCooldown = checkRateLimit("global:supportos-demo-reset", 1, 15_000);
  if (!globalCooldown.allowed) {
    return NextResponse.json(
      { error: `Workspace was just reset. Try again in ${globalCooldown.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  await resetDemoWorkspace();
  return NextResponse.json({ ok: true, message: "SupportOS demo workspace restored to seeded state." });
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { executeWorkflow } from "@/lib/engine";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "run-workflow"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Execution rate limit reached. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  let triggerPayload: Record<string, unknown> = {};
  try {
    const raw = (await request.json()) as { payload?: Record<string, unknown> };
    if (raw && typeof raw === "object") {
      if (raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)) {
        triggerPayload = raw.payload;
      } else if (!("payload" in raw) && !Array.isArray(raw)) {
        triggerPayload = raw as Record<string, unknown>;
      }
    }
  } catch {
    // Allow empty body -> defaults to workflow samplePayload
  }

  try {
    const execution = await executeWorkflow(id, triggerPayload);
    return NextResponse.json({
      run: execution.run,
      steps: execution.steps,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute workflow." },
      { status: 400 },
    );
  }
}

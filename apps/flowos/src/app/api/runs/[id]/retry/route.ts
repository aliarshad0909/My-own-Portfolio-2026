import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { retryWorkflowRun } from "@/lib/engine";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  try {
    const result = await retryWorkflowRun(id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to retry workflow run." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { ApprovalConflictError, resolveApproval, RunNotFoundError } from "@/lib/engine";
import { verifyCsrfOrigin } from "@/lib/security";

const approvalSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(400).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Decision must be 'approve' or 'reject'." },
      { status: 400 },
    );
  }

  try {
    const result = await resolveApproval(
      id,
      parsed.data.decision,
      auth.user.name,
      parsed.data.note,
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApprovalConflictError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    if (err instanceof RunNotFoundError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to process approval." },
      { status: 400 },
    );
  }
}

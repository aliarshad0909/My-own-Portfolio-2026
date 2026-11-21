import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { LeaveReviewError, reviewLeaveRequestTx } from "@/lib/hr-service";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { reviewLeaveSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      {
        error:
          "Insufficient permissions: standard Employee role cannot approve or reject leave requests. Switch Role View to Manager, HR Admin, or HR Demo.",
      },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "leave-review"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Decision must be 'approved' or 'rejected'." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await reviewLeaveRequestTx(db, {
      leaveRequestId: id,
      decision: parsed.data.decision,
      reviewerName: auth.user.name,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof LeaveReviewError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: "Unable to process leave decision." },
      { status: 500 },
    );
  }
}

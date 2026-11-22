import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, employees, leaveRequests } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createLeaveRequestSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const statusFilter = (searchParams.get("status") || "").trim();

  const db = await getDb();
  const rows = await db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      employeeName: employees.fullName,
      employeeCode: employees.employeeCode,
      employeeTitle: employees.title,
      leaveBalanceDays: employees.leaveBalanceDays,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      daysRequested: leaveRequests.daysRequested,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      reviewedBy: leaveRequests.reviewedBy,
      reviewedAt: leaveRequests.reviewedAt,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .orderBy(desc(leaveRequests.createdAt));

  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
  return NextResponse.json({
    viewerRole: auth.user.role,
    leaveRequests: filtered,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "leave-write"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLeaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid leave request details." },
      { status: 400 },
    );
  }

  if (
    auth.user.role === "employee" &&
    auth.user.employeeId &&
    parsed.data.employeeId !== auth.user.employeeId
  ) {
    return NextResponse.json(
      { error: "In Employee role view, you may only submit leave requests for yourself." },
      { status: 403 },
    );
  }

  const db = await getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, parsed.data.employeeId))
    .limit(1);

  if (!emp) {
    return NextResponse.json({ error: "Selected employee does not exist." }, { status: 404 });
  }

  const [created] = await db
    .insert(leaveRequests)
    .values({
      employeeId: parsed.data.employeeId,
      leaveType: parsed.data.leaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      daysRequested: parsed.data.daysRequested,
      reason: parsed.data.reason,
      status: "pending",
    })
    .returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "leave.requested",
    entityType: "leave_request",
    entityId: created.id,
    summary: `Submitted ${created.daysRequested}-day ${created.leaveType} leave request for ${emp.fullName} (${created.startDate} → ${created.endDate}).`,
  });

  return NextResponse.json({ leaveRequest: created }, { status: 201 });
}

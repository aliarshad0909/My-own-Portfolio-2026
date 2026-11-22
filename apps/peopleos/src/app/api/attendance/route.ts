import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, attendanceLogs, employees } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createAttendanceSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const dateFilter = (searchParams.get("date") || "").trim();

  const db = await getDb();
  const rows = await db
    .select({
      id: attendanceLogs.id,
      employeeId: attendanceLogs.employeeId,
      employeeName: employees.fullName,
      employeeCode: employees.employeeCode,
      employeeTitle: employees.title,
      logDate: attendanceLogs.logDate,
      status: attendanceLogs.status,
      checkInTime: attendanceLogs.checkInTime,
      notes: attendanceLogs.notes,
      createdAt: attendanceLogs.createdAt,
    })
    .from(attendanceLogs)
    .innerJoin(employees, eq(attendanceLogs.employeeId, employees.id))
    .orderBy(desc(attendanceLogs.logDate), employees.fullName);

  const filtered = dateFilter ? rows.filter((r) => r.logDate === dateFilter) : rows;
  return NextResponse.json({ attendanceLogs: filtered });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "attendance-write"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid attendance entry." },
      { status: 400 },
    );
  }

  if (
    auth.user.role === "employee" &&
    auth.user.employeeId &&
    parsed.data.employeeId !== auth.user.employeeId
  ) {
    return NextResponse.json(
      { error: "Employees can only log their own daily attendance check-in." },
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
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const [entry] = await db
    .insert(attendanceLogs)
    .values({
      employeeId: parsed.data.employeeId,
      logDate: parsed.data.logDate,
      status: parsed.data.status,
      checkInTime: parsed.data.status === "on_leave" || parsed.data.status === "absent" ? "—" : parsed.data.checkInTime,
      notes: parsed.data.notes,
    })
    .onConflictDoUpdate({
      target: [attendanceLogs.employeeId, attendanceLogs.logDate],
      set: {
        status: parsed.data.status,
        checkInTime: parsed.data.status === "on_leave" || parsed.data.status === "absent" ? "—" : parsed.data.checkInTime,
        notes: parsed.data.notes,
      },
    })
    .returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "attendance.logged",
    entityType: "attendance_log",
    entityId: entry.id,
    summary: `Logged ${entry.status} attendance for ${emp.fullName} on ${entry.logDate}.`,
  });

  return NextResponse.json({ attendanceLog: entry }, { status: 201 });
}

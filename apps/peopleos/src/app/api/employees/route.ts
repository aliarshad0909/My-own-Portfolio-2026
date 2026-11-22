import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, departments, employees, onboardingTasks } from "@/db/schema";
import { canManageDirectory, requireApiUser } from "@/lib/auth";
import { sanitizeEmployeeForViewer } from "@/lib/hr-service";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createEmployeeSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const departmentId = (searchParams.get("departmentId") || "").trim();
  const status = (searchParams.get("status") || "").trim();

  const db = await getDb();
  const [empRows, deptRows] = await Promise.all([
    db.select().from(employees).orderBy(employees.employeeCode),
    db.select().from(departments),
  ]);

  const deptMap = new Map(deptRows.map((d) => [d.id, d]));
  const empNameMap = new Map(empRows.map((e) => [e.id, e.fullName]));

  const directReportIds = new Set(
    empRows.filter((e) => auth.user.employeeId && e.managerId === auth.user.employeeId).map((e) => e.id),
  );

  let filtered = empRows;
  if (departmentId) {
    filtered = filtered.filter((e) => e.departmentId === departmentId);
  }
  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }
  if (q) {
    filtered = filtered.filter((e) => {
      const deptName = deptMap.get(e.departmentId)?.name.toLowerCase() ?? "";
      return (
        e.fullName.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        deptName.includes(q)
      );
    });
  }

  const safeEmployees = filtered.map((emp) => {
    const dept = deptMap.get(emp.departmentId);
    return sanitizeEmployeeForViewer(
      {
        ...emp,
        departmentName: dept?.name ?? "Unassigned",
        departmentCode: dept?.code ?? "—",
        managerName: emp.managerId ? empNameMap.get(emp.managerId) ?? null : null,
      },
      {
        role: auth.user.role,
        viewerEmployeeId: auth.user.employeeId,
        directReportIds,
      },
    );
  });

  return NextResponse.json({
    viewerRole: auth.user.role,
    viewerEmployeeId: auth.user.employeeId,
    employees: safeEmployees,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canManageDirectory(auth.user.role)) {
    return NextResponse.json(
      { error: "Only HR Admin or HR Demo roles can add new employees." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "employees-write"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid employee data." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const existingRows = await db.select({ code: employees.employeeCode }).from(employees);
  const maxNum = existingRows.reduce((max, row) => {
    const m = /^EMP-(\d+)$/.exec(row.code);
    const num = m ? Number(m[1]) : 1000;
    return Math.max(max, num);
  }, 1000);
  const nextCode = `EMP-${maxNum + 1}`;

  const [dept] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, parsed.data.departmentId))
    .limit(1);
  if (!dept) {
    return NextResponse.json({ error: "Selected department does not exist." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(employees)
      .values({
        employeeCode: nextCode,
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        title: parsed.data.title,
        departmentId: parsed.data.departmentId,
        managerId: parsed.data.managerId || null,
        employmentType: parsed.data.employmentType,
        status: parsed.data.status,
        startDate: parsed.data.startDate,
        location: parsed.data.location,
        leaveBalanceDays: parsed.data.leaveBalanceDays,
        compensationBandPrivate: parsed.data.compensationBandPrivate,
        emergencyContactPrivate: parsed.data.emergencyContactPrivate,
        hrNotesPrivate: parsed.data.hrNotesPrivate,
      })
      .returning();

    if (created.status === "onboarding") {
      await db.insert(onboardingTasks).values([
        { employeeId: created.id, title: "Sign offer letter & mutual NDA", ownerRole: "HR Ops", completed: false },
        { employeeId: created.id, title: "Provision laptop & workspace SSO", ownerRole: "IT Ops", completed: false },
        { employeeId: created.id, title: "Schedule 30-day goals kickoff with manager", ownerRole: "Manager", completed: false },
      ]);
    }

    await db.insert(activityLogs).values({
      actorName: auth.user.name,
      action: "employee.created",
      entityType: "employee",
      entityId: created.employeeCode,
      summary: `Added ${created.fullName} (${created.title}) to ${dept.name}.`,
    });

    return NextResponse.json({ employee: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An employee with that work email already exists." },
      { status: 409 },
    );
  }
}

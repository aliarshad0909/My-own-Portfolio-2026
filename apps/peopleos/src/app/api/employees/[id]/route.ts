import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  activityLogs,
  departments,
  employeeDocuments,
  employees,
  onboardingTasks,
} from "@/db/schema";
import { canManageDirectory, requireApiUser } from "@/lib/auth";
import { sanitizeEmployeeForViewer } from "@/lib/hr-service";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateEmployeeSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();

  const [emp] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!emp) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const [deptRows, allEmps, docs, tasks] = await Promise.all([
    db.select().from(departments),
    db.select({ id: employees.id, fullName: employees.fullName, title: employees.title, managerId: employees.managerId }).from(employees),
    db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, emp.id)),
    db.select().from(onboardingTasks).where(eq(onboardingTasks.employeeId, emp.id)),
  ]);

  const dept = deptRows.find((d) => d.id === emp.departmentId);
  const manager = emp.managerId ? allEmps.find((e) => e.id === emp.managerId) : null;
  const directReports = allEmps.filter((e) => e.managerId === emp.id);
  const viewerDirectReportIds = new Set(
    allEmps.filter((e) => auth.user.employeeId && e.managerId === auth.user.employeeId).map((e) => e.id),
  );

  const safeEmployee = sanitizeEmployeeForViewer(
    {
      ...emp,
      departmentName: dept?.name ?? "Unassigned",
      departmentCode: dept?.code ?? "—",
      managerName: manager?.fullName ?? null,
    },
    {
      role: auth.user.role,
      viewerEmployeeId: auth.user.employeeId,
      directReportIds: viewerDirectReportIds,
    },
  );

  return NextResponse.json({
    viewerRole: auth.user.role,
    employee: safeEmployee,
    directReports,
    documents: docs,
    onboardingTasks: tasks,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canManageDirectory(auth.user.role)) {
    return NextResponse.json({ error: "Only HR Admin or HR Demo roles can update employee profiles." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid update payload." }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(employees)
    .set(parsed.data)
    .where(eq(employees.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "employee.updated",
    entityType: "employee",
    entityId: updated.employeeCode,
    summary: `Updated profile details for ${updated.fullName}.`,
  });

  return NextResponse.json({ employee: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canManageDirectory(auth.user.role)) {
    return NextResponse.json({ error: "Only HR Admin or HR Demo roles can remove employee records." }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(employees).where(eq(employees.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "employee.deleted",
    entityType: "employee",
    entityId: deleted.employeeCode,
    summary: `Removed ${deleted.fullName} from the employee directory.`,
  });

  return NextResponse.json({ ok: true });
}

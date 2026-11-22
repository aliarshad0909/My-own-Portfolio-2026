import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, departments, employees } from "@/db/schema";
import { canManageDirectory, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createDepartmentSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [deptRows, empRows] = await Promise.all([
    db.select().from(departments).orderBy(departments.name),
    db.select({ id: employees.id, departmentId: employees.departmentId, status: employees.status }).from(employees),
  ]);

  const enriched = deptRows.map((d) => ({
    ...d,
    headcount: empRows.filter((e) => e.departmentId === d.id).length,
    onboardingCount: empRows.filter((e) => e.departmentId === d.id && e.status === "onboarding").length,
  }));

  return NextResponse.json({ departments: enriched });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canManageDirectory(auth.user.role)) {
    return NextResponse.json(
      { error: "Only HR Admin or HR Demo roles can create departments." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "departments-write"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid department fields." },
      { status: 400 },
    );
  }

  const db = await getDb();
  try {
    const [created] = await db.insert(departments).values(parsed.data).returning();
    await db.insert(activityLogs).values({
      actorName: auth.user.name,
      action: "department.created",
      entityType: "department",
      entityId: created.id,
      summary: `Created department ${created.name} (${created.code}) led by ${created.headName}.`,
    });
    return NextResponse.json({ department: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A department with that name or code already exists." },
      { status: 409 },
    );
  }
}

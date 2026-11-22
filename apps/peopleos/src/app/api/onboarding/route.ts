import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, employees, onboardingTasks } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createOnboardingTaskSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db
    .select({
      id: onboardingTasks.id,
      employeeId: onboardingTasks.employeeId,
      employeeName: employees.fullName,
      employeeTitle: employees.title,
      employeeStatus: employees.status,
      startDate: employees.startDate,
      title: onboardingTasks.title,
      ownerRole: onboardingTasks.ownerRole,
      completed: onboardingTasks.completed,
      createdAt: onboardingTasks.createdAt,
    })
    .from(onboardingTasks)
    .innerJoin(employees, eq(onboardingTasks.employeeId, employees.id))
    .orderBy(employees.fullName, onboardingTasks.createdAt);

  return NextResponse.json({ onboardingTasks: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Standard Employee role cannot create onboarding checklist items." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "onboarding-write"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createOnboardingTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid onboarding task." },
      { status: 400 },
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

  const [created] = await db
    .insert(onboardingTasks)
    .values({
      employeeId: parsed.data.employeeId,
      title: parsed.data.title,
      ownerRole: parsed.data.ownerRole,
      completed: false,
    })
    .returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "onboarding.task_added",
    entityType: "onboarding_task",
    entityId: created.id,
    summary: `Added onboarding task "${created.title}" for ${emp.fullName}.`,
  });

  return NextResponse.json({ task: created }, { status: 201 });
}

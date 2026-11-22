import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, onboardingTasks } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { toggleOnboardingTaskSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = toggleOnboardingTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected boolean 'completed' field." }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(onboardingTasks)
    .set({ completed: parsed.data.completed })
    .where(eq(onboardingTasks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Onboarding task not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "onboarding.toggled",
    entityType: "onboarding_task",
    entityId: updated.id,
    summary: `Marked onboarding task "${updated.title}" as ${updated.completed ? "completed" : "pending"}.`,
  });

  return NextResponse.json({ task: updated });
}

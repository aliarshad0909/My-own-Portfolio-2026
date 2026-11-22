import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, reminders } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();

  const [updated] = await db
    .update(reminders)
    .set({ status: "sent" })
    .where(eq(reminders.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "reminder.sent",
    entityType: "reminder",
    entityId: updated.id,
    summary: `Dispatched simulated ${updated.channel.toUpperCase()} reminder.`,
  });

  return NextResponse.json({
    reminder: {
      ...updated,
      scheduledForUtc: updated.scheduledForUtc.toISOString(),
    },
  });
}

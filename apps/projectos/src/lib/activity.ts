import type { AppDatabase } from "@/db";
import { activityLogs } from "@/db/schema";

export async function recordActivity(
  db: AppDatabase,
  entry: {
    actorName: string;
    action: string;
    entityType: string;
    entityTitle: string;
    projectId?: string | null;
    detail?: string;
  },
): Promise<void> {
  await db.insert(activityLogs).values({
    actorName: entry.actorName,
    action: entry.action,
    entityType: entry.entityType,
    entityTitle: entry.entityTitle,
    projectId: entry.projectId ?? null,
    detail: entry.detail ?? "",
  });
}

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { lessonProgress, lessons } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { lessonProgressSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id: lessonId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = lessonProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid progress payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existingLesson] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!existingLesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const completedAt = parsed.data.completed ? new Date() : null;
  const [record] = await db
    .insert(lessonProgress)
    .values({
      userId: auth.user.id,
      lessonId,
      completed: parsed.data.completed,
      completedAt,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        completed: parsed.data.completed,
        completedAt,
      },
    })
    .returning();

  return NextResponse.json({
    progress: {
      lessonId: record.lessonId,
      completed: record.completed,
      completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    },
  });
}

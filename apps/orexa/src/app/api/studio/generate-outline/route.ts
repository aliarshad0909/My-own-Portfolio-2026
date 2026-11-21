import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { generateDeterministicLessonOutline } from "@/lib/tutor";
import { outlineGenerateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "orexa-outline-gen"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Outline generator rate-limited. Wait ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = outlineGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid outline generation request." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, parsed.data.courseId))
    .limit(1);

  if (!course) {
    return NextResponse.json({ error: "Selected course not found." }, { status: 404 });
  }

  const draft = generateDeterministicLessonOutline({
    courseTitle: course.title,
    courseCategory: course.category,
    topic: parsed.data.topic,
    difficulty: parsed.data.difficulty,
    durationMins: parsed.data.durationMins,
    learningGoal: parsed.data.learningGoal,
  });

  return NextResponse.json({ draft });
}

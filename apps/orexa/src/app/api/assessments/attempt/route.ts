import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assessmentAttempts, assessments, courses, type QuizQuestion } from "@/db/schema";
import { gradeAssessment } from "@/lib/adaptive";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { assessmentAttemptSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "orexa-quiz-attempt"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many quiz submissions. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = assessmentAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid assessment submission." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, parsed.data.assessmentId))
    .limit(1);

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  const [course] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(eq(courses.id, assessment.courseId))
    .limit(1);

  const questions = (Array.isArray(assessment.questionsJson) ? assessment.questionsJson : []) as QuizQuestion[];
  const evaluation = gradeAssessment(questions, parsed.data.answers, course?.title ?? "this course");

  const [saved] = await db
    .insert(assessmentAttempts)
    .values({
      userId: auth.user.id,
      assessmentId: assessment.id,
      scorePct: evaluation.scorePct,
      difficultyLevel: assessment.difficulty,
      answersJson: evaluation.gradedAnswers,
      recommendation: evaluation.recommendation,
    })
    .returning();

  return NextResponse.json(
    {
      attempt: {
        id: saved.id,
        assessmentId: saved.assessmentId,
        assessmentTitle: assessment.title,
        courseId: assessment.courseId,
        courseTitle: course?.title ?? "Course",
        scorePct: saved.scorePct,
        difficultyLevel: saved.difficultyLevel,
        recommendation: saved.recommendation,
        createdAt: saved.createdAt.toISOString(),
      },
      evaluation,
    },
    { status: 201 },
  );
}

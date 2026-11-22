import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { tutorMessages } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { getCourseGroundingContext, getTutorThread } from "@/lib/queries";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { generateTutorReply } from "@/lib/tutor";
import { tutorAskSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId query parameter is required." }, { status: 400 });
  }

  const messages = await getTutorThread(auth.user.id, courseId);
  return NextResponse.json({
    messages,
    engineMode: process.env.OREXA_LLM_API_KEY ? "llm" : "deterministic",
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "orexa-tutor"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Tutor rate limit reached. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = tutorAskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tutor prompt." },
      { status: 400 },
    );
  }

  const grounding = await getCourseGroundingContext(parsed.data.courseId);
  if (!grounding) {
    return NextResponse.json({ error: "Selected course not found." }, { status: 404 });
  }

  const db = await getDb();
  const [studentMsg] = await db
    .insert(tutorMessages)
    .values({
      userId: auth.user.id,
      courseId: parsed.data.courseId,
      role: "student",
      content: parsed.data.message,
      mode: "deterministic",
    })
    .returning();

  const reply = await generateTutorReply(grounding, parsed.data.message, parsed.data.lessonId);

  const [tutorMsg] = await db
    .insert(tutorMessages)
    .values({
      userId: auth.user.id,
      courseId: parsed.data.courseId,
      role: "tutor",
      content: reply.content,
      mode: reply.mode,
    })
    .returning();

  return NextResponse.json(
    {
      studentMessage: {
        id: studentMsg.id,
        courseId: studentMsg.courseId,
        role: studentMsg.role,
        content: studentMsg.content,
        mode: studentMsg.mode,
        createdAt: studentMsg.createdAt.toISOString(),
      },
      tutorMessage: {
        id: tutorMsg.id,
        courseId: tutorMsg.courseId,
        role: tutorMsg.role,
        content: tutorMsg.content,
        mode: tutorMsg.mode,
        createdAt: tutorMsg.createdAt.toISOString(),
      },
      citedLessons: reply.citedLessons,
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required to clear a thread." }, { status: 400 });
  }

  const db = await getDb();
  await db
    .delete(tutorMessages)
    .where(and(eq(tutorMessages.userId, auth.user.id), eq(tutorMessages.courseId, courseId)));

  return NextResponse.json({ ok: true });
}

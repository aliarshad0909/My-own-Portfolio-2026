import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { lessons } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { lessonCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = lessonCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid lesson payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const existing = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, parsed.data.moduleId));
  const sortOrder = parsed.data.sortOrder ?? existing.length + 1;

  const [created] = await db
    .insert(lessons)
    .values({
      moduleId: parsed.data.moduleId,
      title: parsed.data.title,
      durationMins: parsed.data.durationMins,
      contentMd: parsed.data.contentMd,
      keyTakeaways: parsed.data.keyTakeaways,
      sortOrder,
    })
    .returning();

  return NextResponse.json({ lesson: created }, { status: 201 });
}

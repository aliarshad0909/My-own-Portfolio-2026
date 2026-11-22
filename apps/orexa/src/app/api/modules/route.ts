import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { modules } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { moduleCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = moduleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid module details." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const existing = await db.select({ id: modules.id }).from(modules).where(eq(modules.courseId, parsed.data.courseId));
  const sortOrder = parsed.data.sortOrder ?? existing.length + 1;

  const [created] = await db
    .insert(modules)
    .values({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      sortOrder,
    })
    .returning();

  return NextResponse.json({ module: created }, { status: 201 });
}

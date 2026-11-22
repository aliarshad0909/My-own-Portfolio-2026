import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { resourceCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  const db = await getDb();

  const rows = courseId
    ? await db.select().from(resources).where(eq(resources.courseId, courseId)).orderBy(asc(resources.createdAt))
    : await db.select().from(resources).orderBy(asc(resources.createdAt));

  return NextResponse.json({ resources: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = resourceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid resource details." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db.insert(resources).values(parsed.data).returning();
  return NextResponse.json({ resource: created }, { status: 201 });
}

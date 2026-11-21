import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { getCoursesCatalog } from "@/lib/queries";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { courseCreateSchema, slugifyTitle } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const includeAll = url.searchParams.get("all") === "true" && canAuthorStudio(auth.user.role);
  const data = await getCoursesCatalog(auth.user.id, { includeUnpublished: includeAll });
  return NextResponse.json({ courses: data });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "orexa-course-write"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = courseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid course details." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const slug = `${slugifyTitle(parsed.data.title)}-${crypto.randomBytes(2).toString("hex")}`;

  const [created] = await db
    .insert(courses)
    .values({
      slug,
      title: parsed.data.title,
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      description: parsed.data.description,
      instructorName: parsed.data.instructorName,
      published: parsed.data.published,
    })
    .returning();

  return NextResponse.json({ course: created }, { status: 201 });
}

import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, employees, performanceReviews } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createReviewSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db
    .select({
      id: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      employeeName: employees.fullName,
      employeeTitle: employees.title,
      employeeCode: employees.employeeCode,
      cycle: performanceReviews.cycle,
      reviewerName: performanceReviews.reviewerName,
      rating: performanceReviews.rating,
      summary: performanceReviews.summary,
      goals: performanceReviews.goals,
      createdAt: performanceReviews.createdAt,
    })
    .from(performanceReviews)
    .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .orderBy(desc(performanceReviews.createdAt));

  return NextResponse.json({ reviews: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Only Managers, HR Admins, or HR Demo roles can publish performance reviews." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "reviews-write"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid performance review fields." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, parsed.data.employeeId))
    .limit(1);
  if (!emp) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const [created] = await db.insert(performanceReviews).values(parsed.data).returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "review.created",
    entityType: "performance_review",
    entityId: created.id,
    summary: `Published ${created.cycle} review for ${emp.fullName} (${created.rating}/5).`,
  });

  return NextResponse.json({ review: created }, { status: 201 });
}

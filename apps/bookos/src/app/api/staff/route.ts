import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, withDbTransaction } from "@/db";
import { activityLogs, availabilityRules, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { staffCreateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [staffRows, ruleRows] = await Promise.all([
    db.select().from(staff).orderBy(asc(staff.createdAt)),
    db.select().from(availabilityRules).orderBy(asc(availabilityRules.dayOfWeek), asc(availabilityRules.startTime)),
  ]);

  const rulesByStaff = new Map<string, typeof ruleRows>();
  for (const r of ruleRows) {
    const list = rulesByStaff.get(r.staffId) ?? [];
    list.push(r);
    rulesByStaff.set(r.staffId, list);
  }

  return NextResponse.json({
    staff: staffRows.map((member) => ({
      ...member,
      availabilityRules: (rulesByStaff.get(member.id) ?? []).map((r) => ({
        id: r.id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    })),
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "staff-write"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = staffCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid staff payload." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const existing = await db.select({ id: staff.id }).from(staff).where(eq(staff.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "A staff member with this email already exists." }, { status: 409 });
  }

  const result = await withDbTransaction(async (tx) => {
    const [created] = await tx
      .insert(staff)
      .values({
        ...parsed.data,
        email,
      })
      .returning();

    // Seed default Monday-Friday 09:00-17:00 availability rules
    const defaultRules = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      staffId: created.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
    }));
    const insertedRules = await tx.insert(availabilityRules).values(defaultRules).returning();

    await tx.insert(activityLogs).values({
      actorName: auth.user.name,
      action: "staff.created",
      entityType: "staff",
      entityId: created.id,
      summary: `Added specialist ${created.name} (${created.roleTitle}, ${created.timezone}).`,
    });

    return { created, insertedRules };
  });

  return NextResponse.json(
    {
      staffMember: {
        ...result.created,
        availabilityRules: result.insertedRules.map((r) => ({
          id: r.id,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      },
    },
    { status: 201 },
  );
}

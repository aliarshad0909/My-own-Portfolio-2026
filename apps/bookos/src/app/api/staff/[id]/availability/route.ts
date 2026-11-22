import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withDbTransaction } from "@/db";
import { activityLogs, availabilityRules, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { availabilityUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = availabilityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid availability schedule." },
      { status: 400 },
    );
  }

  // Deduplicate identical day/time windows
  const uniqueRules = Array.from(
    new Map(
      parsed.data.rules.map((r) => [`${r.dayOfWeek}:${r.startTime}:${r.endTime}`, r]),
    ).values(),
  );

  const result = await withDbTransaction(async (tx) => {
    const [member] = await tx.select().from(staff).where(eq(staff.id, id)).limit(1);
    if (!member) return null;

    await tx.delete(availabilityRules).where(eq(availabilityRules.staffId, id));

    const inserted =
      uniqueRules.length > 0
        ? await tx
            .insert(availabilityRules)
            .values(
              uniqueRules.map((r) => ({
                staffId: id,
                dayOfWeek: r.dayOfWeek,
                startTime: r.startTime,
                endTime: r.endTime,
              })),
            )
            .returning()
        : [];

    await tx.insert(activityLogs).values({
      actorName: auth.user.name,
      action: "availability.updated",
      entityType: "staff",
      entityId: member.id,
      summary: `Updated weekly availability for ${member.name} (${inserted.length} active windows).`,
    });

    return inserted;
  });

  if (result === null) {
    return NextResponse.json({ error: "Staff specialist not found." }, { status: 404 });
  }

  return NextResponse.json({
    rules: result.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
  });
}

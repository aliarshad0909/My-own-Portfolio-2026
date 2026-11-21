import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, candidates } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createCandidateSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db.select().from(candidates).orderBy(desc(candidates.createdAt));
  return NextResponse.json({ candidates: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Standard Employee role cannot add recruitment candidates." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "candidates-write"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCandidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid candidate payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db.insert(candidates).values(parsed.data).returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "candidate.created",
    entityType: "candidate",
    entityId: created.id,
    summary: `Added candidate ${created.fullName} for ${created.roleTitle} (${created.stage}).`,
  });

  return NextResponse.json({ candidate: created }, { status: 201 });
}

import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { cannedResponses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { logActivity } from "@/lib/ticket-service";
import { createCannedResponseSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "").trim();
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const db = await getDb();
  const all = await db.select().from(cannedResponses).orderBy(asc(cannedResponses.title));

  const filtered = all.filter((item) => {
    if (category && category !== "all" && item.category !== category) return false;
    if (search) {
      const hay = `${item.title} ${item.shortcut} ${item.body}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  return NextResponse.json({ cannedResponses: filtered });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "canned:create"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCannedResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid canned response." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const [created] = await db
      .insert(cannedResponses)
      .values(parsed.data)
      .returning();

    await logActivity(db, {
      actorName: auth.user.name,
      action: "canned_response.created",
      entityType: "canned_response",
      entityId: created.id,
      summary: `Created canned response ${created.shortcut} (${created.title})`,
    });

    return NextResponse.json({ cannedResponse: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Shortcut already exists. Choose a unique /shortcut." }, { status: 400 });
  }
}

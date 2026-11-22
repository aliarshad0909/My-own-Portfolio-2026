import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { cannedResponses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateCannedResponseSchema } from "@/lib/validation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid canned response ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCannedResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(cannedResponses).where(eq(cannedResponses.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Canned response not found." }, { status: 404 });
  }

  try {
    const [updated] = await db
      .update(cannedResponses)
      .set({
        title: parsed.data.title ?? existing.title,
        shortcut: parsed.data.shortcut ?? existing.shortcut,
        category: parsed.data.category ?? existing.category,
        body: parsed.data.body ?? existing.body,
        updatedAt: new Date(),
      })
      .where(eq(cannedResponses.id, id))
      .returning();

    return NextResponse.json({ cannedResponse: updated });
  } catch {
    return NextResponse.json({ error: "Shortcut already in use." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid canned response ID." }, { status: 400 });
  }

  const db = await getDb();
  const [deleted] = await db.delete(cannedResponses).where(eq(cannedResponses.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Canned response not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { modules } from "@/db/schema";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { moduleUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = moduleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid module update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(modules)
    .set(parsed.data)
    .where(eq(modules.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 });
  }
  return NextResponse.json({ module: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const [deleted] = await db.delete(modules).where(eq(modules.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id: deleted.id });
}

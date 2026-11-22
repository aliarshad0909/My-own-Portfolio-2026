import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { kbArticles } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { slugify } from "@/lib/support-engine";
import { updateKbArticleSchema } from "@/lib/validation";

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
    return NextResponse.json({ error: "Invalid KB article ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateKbArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid KB update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(kbArticles).where(eq(kbArticles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  try {
    const [updated] = await db
      .update(kbArticles)
      .set({
        title: parsed.data.title ?? existing.title,
        slug: parsed.data.slug ? slugify(parsed.data.slug) : existing.slug,
        category: parsed.data.category ?? existing.category,
        summary: parsed.data.summary ?? existing.summary,
        body: parsed.data.body ?? existing.body,
        published: parsed.data.published !== undefined ? parsed.data.published : existing.published,
        views: parsed.data.incrementViews ? existing.views + 1 : existing.views,
        updatedAt: new Date(),
      })
      .where(eq(kbArticles.id, id))
      .returning();

    return NextResponse.json({ article: updated });
  } catch {
    return NextResponse.json({ error: "Article slug already in use." }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid KB article ID." }, { status: 400 });
  }

  const db = await getDb();
  const [deleted] = await db.delete(kbArticles).where(eq(kbArticles.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

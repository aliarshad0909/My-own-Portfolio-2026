import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { kbArticles } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { slugify } from "@/lib/support-engine";
import { logActivity } from "@/lib/ticket-service";
import { createKbArticleSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const category = (searchParams.get("category") || "").trim();
  const publishedOnly = searchParams.get("publishedOnly") === "true";

  const db = await getDb();
  const all = await db.select().from(kbArticles).orderBy(desc(kbArticles.views));

  const filtered = all.filter((a) => {
    if (publishedOnly && !a.published) return false;
    if (category && category !== "all" && a.category !== category) return false;
    if (search) {
      const hay = `${a.title} ${a.summary} ${a.body} ${a.slug}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  return NextResponse.json({ articles: filtered });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "kb:create"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createKbArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid KB article." },
      { status: 400 },
    );
  }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) {
    return NextResponse.json({ error: "Could not derive a valid slug from title." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [created] = await db
      .insert(kbArticles)
      .values({
        slug,
        title: parsed.data.title,
        category: parsed.data.category,
        summary: parsed.data.summary,
        body: parsed.data.body,
        published: parsed.data.published,
        views: 1,
      })
      .returning();

    await logActivity(db, {
      actorName: auth.user.name,
      action: "kb.created",
      entityType: "kb_article",
      entityId: created.id,
      summary: `Published KB article "${created.title}" (${created.category})`,
    });

    return NextResponse.json({ article: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "An article with this slug already exists." }, { status: 400 });
  }
}

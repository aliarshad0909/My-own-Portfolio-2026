import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createDocumentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const rows = await db.select().from(documents).orderBy(desc(documents.createdAt));
  return NextResponse.json({ documents: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid trade document payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db.insert(documents).values(parsed.data).returning();
  return NextResponse.json({ document: created }, { status: 201 });
}

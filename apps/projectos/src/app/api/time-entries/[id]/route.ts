import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { timeEntries } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Time entry not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

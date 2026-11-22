import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { landedCostScenarios } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();
  const [deleted] = await db
    .delete(landedCostScenarios)
    .where(eq(landedCostScenarios.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id: deleted.id });
}

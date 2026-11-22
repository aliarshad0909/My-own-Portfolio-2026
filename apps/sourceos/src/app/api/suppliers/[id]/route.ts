import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { suppliers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateSupplierSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid update payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(suppliers)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(suppliers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  }

  return NextResponse.json({ supplier: updated });
}

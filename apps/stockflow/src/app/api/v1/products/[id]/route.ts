import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { listEnrichedProducts } from "@/lib/inventory";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { productUpdateSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  const all = await listEnrichedProducts();
  const product = all.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const db = await getDb();
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(20);

  return NextResponse.json({ product, movements });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product update" }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  const db = await getDb();
  try {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch {
    return NextResponse.json(
      { error: "Cannot delete a product referenced by existing purchase or sales orders. Mark it discontinued instead." },
      { status: 409 },
    );
  }
}


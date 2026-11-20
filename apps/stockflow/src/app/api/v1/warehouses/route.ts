import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, stockLevels, warehouses } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { warehouseCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [allWarehouses, allLevels, allProducts] = await Promise.all([
    db.select().from(warehouses).orderBy(desc(warehouses.createdAt)),
    db.select().from(stockLevels),
    db.select().from(products),
  ]);

  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  const enriched = allWarehouses.map((w) => {
    const levels = allLevels.filter((l) => l.warehouseId === w.id && l.quantityOnHand > 0);
    const totalUnits = levels.reduce((s, l) => s + l.quantityOnHand, 0);
    const totalReserved = levels.reduce((s, l) => s + l.quantityReserved, 0);
    const valuationCents = levels.reduce((s, l) => s + l.quantityOnHand * (prodMap.get(l.productId)?.unitCostCents ?? 0), 0);
    return {
      ...w,
      skuCount: levels.length,
      totalUnits,
      totalReserved,
      valuationCents,
    };
  });

  return NextResponse.json({ warehouses: enriched });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = warehouseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid warehouse data" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const [created] = await db
      .insert(warehouses)
      .values({ ...parsed.data, code: parsed.data.code.toUpperCase() })
      .returning();
    return NextResponse.json({ warehouse: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unable to create warehouse";
    return NextResponse.json(
      { error: msg.includes("unique") ? "Warehouse code already exists." : msg },
      { status: 409 },
    );
  }
}


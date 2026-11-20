import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, stockLevels, stockMovements, warehouses } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { listEnrichedProducts } from "@/lib/inventory";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { productCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const items = await listEnrichedProducts({
    q: url.searchParams.get("q") || undefined,
    category: url.searchParams.get("category") || undefined,
    barcode: url.searchParams.get("barcode") || undefined,
    warehouseId: url.searchParams.get("warehouseId") || undefined,
    lowStockOnly: url.searchParams.get("lowStock") === "1",
  });

  const db = await getDb();
  const allWarehouses = await db.select().from(warehouses);

  return NextResponse.json({ products: items, warehouses: allWarehouses });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();

  try {
    const created = await db.transaction(async (tx) => {
      const [prod] = await tx
        .insert(products)
        .values({
          sku: data.sku.toUpperCase(),
          barcode: data.barcode,
          name: data.name,
          category: data.category,
          description: data.description,
          imageUrl: data.imageUrl,
          unitCostCents: data.unitCostCents,
          sellingPriceCents: data.sellingPriceCents,
          minStockThreshold: data.minStockThreshold,
          status: data.status,
        })
        .returning();

      if (data.initialWarehouseId && data.initialQuantity > 0) {
        await tx.insert(stockLevels).values({
          productId: prod.id,
          warehouseId: data.initialWarehouseId,
          binLocation: data.binLocation || "A-01",
          quantityOnHand: data.initialQuantity,
          quantityReserved: 0,
        });
        await tx.insert(stockMovements).values({
          type: "receipt",
          productId: prod.id,
          toWarehouseId: data.initialWarehouseId,
          quantityDelta: data.initialQuantity,
          reference: "OPENING-STOCK",
          note: "Initial stock recorded at product creation",
          performedBy: auth.user.name,
          source: "web",
        });
      }
      return prod;
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unable to create product";
    return NextResponse.json(
      { error: msg.includes("unique") ? "A product with that SKU or barcode already exists." : msg },
      { status: 409 },
    );
  }
}


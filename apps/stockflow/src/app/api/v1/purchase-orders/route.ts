import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, purchaseOrderItems, purchaseOrders, suppliers, warehouses } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { purchaseOrderCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [orders, items, allSuppliers, allWarehouses, allProducts] = await Promise.all([
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)),
    db.select().from(purchaseOrderItems),
    db.select().from(suppliers),
    db.select().from(warehouses),
    db.select().from(products),
  ]);

  const supMap = new Map(allSuppliers.map((s) => [s.id, s]));
  const whMap = new Map(allWarehouses.map((w) => [w.id, w]));
  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  const enriched = orders.map((po) => {
    const poItems = items
      .filter((i) => i.purchaseOrderId === po.id)
      .map((i) => ({
        ...i,
        productSku: prodMap.get(i.productId)?.sku ?? "",
        productName: prodMap.get(i.productId)?.name ?? "Product",
      }));
    const totalCents = poItems.reduce((s, i) => s + i.quantityOrdered * i.unitCostCents, 0);
    return {
      ...po,
      supplierName: supMap.get(po.supplierId)?.name ?? "Supplier",
      warehouseCode: whMap.get(po.warehouseId)?.code ?? "WH",
      warehouseName: whMap.get(po.warehouseId)?.name ?? "Warehouse",
      items: poItems,
      totalCents,
    };
  });

  return NextResponse.json({
    purchaseOrders: enriched,
    suppliers: allSuppliers,
    warehouses: allWarehouses,
    products: allProducts,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = purchaseOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid purchase order" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();
  const orderNumber = `PO-2026-${Math.floor(200 + Math.random() * 799)}`;

  const created = await db.transaction(async (tx) => {
    const [po] = await tx
      .insert(purchaseOrders)
      .values({
        orderNumber,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        status: "ordered",
        expectedDate: data.expectedDate || new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
        notes: data.notes,
      })
      .returning();

    await tx.insert(purchaseOrderItems).values(
      data.items.map((item) => ({
        purchaseOrderId: po.id,
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        unitCostCents: item.unitCostCents,
      })),
    );
    return po;
  });

  return NextResponse.json({ purchaseOrder: created }, { status: 201 });
}


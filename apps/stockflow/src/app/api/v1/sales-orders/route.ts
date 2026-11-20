import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers, products, salesOrderItems, salesOrders, warehouses } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { salesOrderCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [orders, items, allCustomers, allWarehouses, allProducts] = await Promise.all([
    db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)),
    db.select().from(salesOrderItems),
    db.select().from(customers),
    db.select().from(warehouses),
    db.select().from(products),
  ]);

  const custMap = new Map(allCustomers.map((c) => [c.id, c]));
  const whMap = new Map(allWarehouses.map((w) => [w.id, w]));
  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  const enriched = orders.map((so) => {
    const soItems = items
      .filter((i) => i.salesOrderId === so.id)
      .map((i) => ({
        ...i,
        productSku: prodMap.get(i.productId)?.sku ?? "",
        productName: prodMap.get(i.productId)?.name ?? "Product",
      }));
    const totalCents = soItems.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
    return {
      ...so,
      customerName: custMap.get(so.customerId)?.name ?? "Customer",
      warehouseCode: whMap.get(so.warehouseId)?.code ?? "WH",
      warehouseName: whMap.get(so.warehouseId)?.name ?? "Warehouse",
      items: soItems,
      totalCents,
    };
  });

  return NextResponse.json({
    salesOrders: enriched,
    customers: allCustomers,
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
  const parsed = salesOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid sales order" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();
  const orderNumber = `SO-2026-${Math.floor(300 + Math.random() * 699)}`;

  const created = await db.transaction(async (tx) => {
    const [so] = await tx
      .insert(salesOrders)
      .values({
        orderNumber,
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        status: "pending",
        deliveryStatus: "awaiting_fulfilment",
        notes: data.notes,
      })
      .returning();

    await tx.insert(salesOrderItems).values(
      data.items.map((item) => ({
        salesOrderId: so.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    );
    return so;
  });

  return NextResponse.json({ salesOrder: created }, { status: 201 });
}


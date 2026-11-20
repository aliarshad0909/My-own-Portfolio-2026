import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, stockMovements, warehouses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "").trim();
  const source = (url.searchParams.get("source") || "").trim();

  const db = await getDb();
  const [rows, allProducts, allWarehouses] = await Promise.all([
    db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(100),
    db.select({ id: products.id, sku: products.sku, name: products.name }).from(products),
    db.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name }).from(warehouses),
  ]);

  const prodMap = new Map(allProducts.map((p) => [p.id, p]));
  const whMap = new Map(allWarehouses.map((w) => [w.id, w]));

  const filtered = rows
    .filter((m) => {
      if (type && type !== "all" && m.type !== type) return false;
      if (source && source !== "all" && m.source !== source) return false;
      return true;
    })
    .map((m) => ({
      ...m,
      productName: prodMap.get(m.productId)?.name ?? "Product",
      productSku: prodMap.get(m.productId)?.sku ?? "",
      fromWarehouseCode: m.fromWarehouseId ? whMap.get(m.fromWarehouseId)?.code ?? null : null,
      toWarehouseCode: m.toWarehouseId ? whMap.get(m.toWarehouseId)?.code ?? null : null,
    }));

  return NextResponse.json({ movements: filtered });
}


import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  customers,
  products,
  purchaseOrderItems,
  purchaseOrders,
  salesOrderItems,
  salesOrders,
  stockLevels,
  stockMovements,
  suppliers,
  warehouses,
} from "@/db/schema";

export type EnrichedProduct = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  unitCostCents: number;
  sellingPriceCents: number;
  minStockThreshold: number;
  status: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  valuationCents: number;
  isLowStock: boolean;
  warehouseStock: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    binLocation: string;
    quantityOnHand: number;
    quantityReserved: number;
    available: number;
  }[];
};

export async function listEnrichedProducts(filters: { q?: string; category?: string; barcode?: string; warehouseId?: string; lowStockOnly?: boolean } = {}): Promise<EnrichedProduct[]> {
  const db = await getDb();
  const [allProducts, allLevels, allWarehouses] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(stockLevels),
    db.select().from(warehouses),
  ]);

  const whMap = new Map(allWarehouses.map((w) => [w.id, w]));

  const enriched: EnrichedProduct[] = allProducts.map((p) => {
    const levels = allLevels
      .filter((l) => l.productId === p.id)
      .map((l) => {
        const w = whMap.get(l.warehouseId);
        return {
          warehouseId: l.warehouseId,
          warehouseCode: w?.code ?? "WH",
          warehouseName: w?.name ?? "Unknown Warehouse",
          binLocation: l.binLocation,
          quantityOnHand: l.quantityOnHand,
          quantityReserved: l.quantityReserved,
          available: Math.max(0, l.quantityOnHand - l.quantityReserved),
        };
      });

    const totalOnHand = levels.reduce((s, l) => s + l.quantityOnHand, 0);
    const totalReserved = levels.reduce((s, l) => s + l.quantityReserved, 0);
    const totalAvailable = Math.max(0, totalOnHand - totalReserved);
    const valuationCents = totalOnHand * p.unitCostCents;
    const isLowStock = p.status === "active" && totalAvailable <= p.minStockThreshold;

    return {
      ...p,
      totalOnHand,
      totalReserved,
      totalAvailable,
      valuationCents,
      isLowStock,
      warehouseStock: levels,
    };
  });

  const q = (filters.q || "").trim().toLowerCase();
  const barcode = (filters.barcode || "").trim();

  return enriched.filter((p) => {
    if (barcode && p.barcode !== barcode && p.sku.toLowerCase() !== barcode.toLowerCase()) return false;
    if (filters.category && filters.category !== "all" && p.category !== filters.category) return false;
    if (filters.warehouseId && filters.warehouseId !== "all") {
      if (!p.warehouseStock.some((ws) => ws.warehouseId === filters.warehouseId && ws.quantityOnHand > 0)) return false;
    }
    if (filters.lowStockOnly && !p.isLowStock) return false;
    if (q) {
      const hay = `${p.sku} ${p.barcode} ${p.name} ${p.category} ${p.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getDashboardSummary() {
  const db = await getDb();
  const [enrichedProducts, allWarehouses, allPOs, allSOs, recentMovs] = await Promise.all([
    listEnrichedProducts(),
    db.select().from(warehouses),
    db.select().from(purchaseOrders),
    db.select().from(salesOrders),
    db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(10),
  ]);

  const prodMap = new Map(enrichedProducts.map((p) => [p.id, p]));
  const whMap = new Map(allWarehouses.map((w) => [w.id, w]));

  const totalProducts = enrichedProducts.length;
  const totalStockQuantity = enrichedProducts.reduce((s, p) => s + p.totalOnHand, 0);
  const totalValuationCents = enrichedProducts.reduce((s, p) => s + p.valuationCents, 0);
  const lowStockProducts = enrichedProducts.filter((p) => p.isLowStock);

  const pendingPurchaseOrders = allPOs.filter((po) => po.status === "draft" || po.status === "ordered" || po.status === "partially_received").length;
  const pendingSalesOrders = allSOs.filter((so) => so.status === "pending" || so.status === "reserved").length;

  const warehouseDistribution = allWarehouses.map((w) => {
    let units = 0;
    let valuationCents = 0;
    let skuCount = 0;
    for (const p of enrichedProducts) {
      const entry = p.warehouseStock.find((ws) => ws.warehouseId === w.id);
      if (entry && entry.quantityOnHand > 0) {
        skuCount += 1;
        units += entry.quantityOnHand;
        valuationCents += entry.quantityOnHand * p.unitCostCents;
      }
    }
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      location: w.location,
      skuCount,
      units,
      valuationCents,
    };
  });

  const recentMovements = recentMovs.map((m) => ({
    ...m,
    productName: prodMap.get(m.productId)?.name ?? "Product",
    productSku: prodMap.get(m.productId)?.sku ?? "",
    fromWarehouseCode: m.fromWarehouseId ? whMap.get(m.fromWarehouseId)?.code ?? null : null,
    toWarehouseCode: m.toWarehouseId ? whMap.get(m.toWarehouseId)?.code ?? null : null,
  }));

  return {
    kpis: {
      totalProducts,
      totalStockQuantity,
      totalValuationCents,
      lowStockCount: lowStockProducts.length,
      pendingPurchaseOrders,
      pendingSalesOrders,
      warehouseCount: allWarehouses.length,
    },
    lowStockProducts: lowStockProducts.slice(0, 8),
    warehouseDistribution,
    recentMovements,
  };
}

/**
 * Atomic PostgreSQL stock adjustment / receipt / issue.
 * Guards against negative on-hand stock and writes an immutable movement log.
 */
export async function adjustStock(params: {
  productId: string;
  warehouseId: string;
  type: "receipt" | "adjustment" | "issue";
  quantityDelta: number;
  binLocation?: string;
  reference?: string;
  note?: string;
  performedBy: string;
  source: "web" | "mobile" | "system";
}) {
  const db = await getDb();
  const signedDelta =
    params.type === "issue"
      ? -Math.abs(params.quantityDelta)
      : params.type === "receipt"
        ? Math.abs(params.quantityDelta)
        : params.quantityDelta;

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(stockLevels)
      .where(and(eq(stockLevels.productId, params.productId), eq(stockLevels.warehouseId, params.warehouseId)))
      .limit(1);

    const currentQty = existing?.quantityOnHand ?? 0;
    const nextQty = currentQty + signedDelta;
    if (nextQty < 0) {
      throw new Error(`Insufficient stock in selected warehouse (current on-hand: ${currentQty}, requested change: ${signedDelta}).`);
    }

    if (existing) {
      await tx
        .update(stockLevels)
        .set({
          quantityOnHand: nextQty,
          ...(params.binLocation ? { binLocation: params.binLocation } : {}),
          updatedAt: new Date(),
        })
        .where(eq(stockLevels.id, existing.id));
    } else {
      await tx.insert(stockLevels).values({
        productId: params.productId,
        warehouseId: params.warehouseId,
        binLocation: params.binLocation || "A-01",
        quantityOnHand: nextQty,
        quantityReserved: 0,
      });
    }

    const [movement] = await tx
      .insert(stockMovements)
      .values({
        type: params.type,
        productId: params.productId,
        fromWarehouseId: signedDelta < 0 ? params.warehouseId : null,
        toWarehouseId: signedDelta > 0 ? params.warehouseId : null,
        quantityDelta: signedDelta,
        reference: params.reference || `${params.type.toUpperCase()}-${Date.now().toString().slice(-5)}`,
        note: params.note || "",
        performedBy: params.performedBy,
        source: params.source,
      })
      .returning();

    return { newQuantityOnHand: nextQty, movement };
  });
}

/**
 * Atomic PostgreSQL inter-warehouse stock transfer.
 */
export async function transferStock(params: {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  note?: string;
  performedBy: string;
  source: "web" | "mobile" | "system";
}) {
  if (params.fromWarehouseId === params.toWarehouseId) {
    throw new Error("Source and destination warehouses must be different.");
  }
  const db = await getDb();

  return db.transaction(async (tx) => {
    const [src] = await tx
      .select()
      .from(stockLevels)
      .where(and(eq(stockLevels.productId, params.productId), eq(stockLevels.warehouseId, params.fromWarehouseId)))
      .limit(1);

    const available = src ? src.quantityOnHand - src.quantityReserved : 0;
    if (!src || available < params.quantity) {
      throw new Error(`Insufficient available stock in source warehouse (available: ${available}, requested: ${params.quantity}).`);
    }

    await tx
      .update(stockLevels)
      .set({ quantityOnHand: src.quantityOnHand - params.quantity, updatedAt: new Date() })
      .where(eq(stockLevels.id, src.id));

    const [dest] = await tx
      .select()
      .from(stockLevels)
      .where(and(eq(stockLevels.productId, params.productId), eq(stockLevels.warehouseId, params.toWarehouseId)))
      .limit(1);

    if (dest) {
      await tx
        .update(stockLevels)
        .set({ quantityOnHand: dest.quantityOnHand + params.quantity, updatedAt: new Date() })
        .where(eq(stockLevels.id, dest.id));
    } else {
      await tx.insert(stockLevels).values({
        productId: params.productId,
        warehouseId: params.toWarehouseId,
        binLocation: "RCV-01",
        quantityOnHand: params.quantity,
        quantityReserved: 0,
      });
    }

    const [movement] = await tx
      .insert(stockMovements)
      .values({
        type: "transfer",
        productId: params.productId,
        fromWarehouseId: params.fromWarehouseId,
        toWarehouseId: params.toWarehouseId,
        quantityDelta: params.quantity,
        reference: `TRF-${Date.now().toString().slice(-6)}`,
        note: params.note || "Inter-warehouse stock transfer",
        performedBy: params.performedBy,
        source: params.source,
      })
      .returning();

    return { movement };
  });
}

/**
 * Receives all remaining units on a Purchase Order atomically into destination warehouse stock.
 */
export async function receivePurchaseOrder(poId: string, performedBy: string, source: "web" | "mobile" = "web") {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [po] = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).limit(1);
    if (!po) throw new Error("Purchase order not found.");
    if (po.status === "received") throw new Error("Purchase order has already been received.");
    if (po.status === "cancelled") throw new Error("Cannot receive a cancelled purchase order.");

    const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, po.id));

    for (const item of items) {
      const remaining = item.quantityOrdered - item.quantityReceived;
      if (remaining <= 0) continue;

      const [level] = await tx
        .select()
        .from(stockLevels)
        .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.warehouseId, po.warehouseId)))
        .limit(1);

      if (level) {
        await tx
          .update(stockLevels)
          .set({ quantityOnHand: level.quantityOnHand + remaining, updatedAt: new Date() })
          .where(eq(stockLevels.id, level.id));
      } else {
        await tx.insert(stockLevels).values({
          productId: item.productId,
          warehouseId: po.warehouseId,
          binLocation: "RCV-01",
          quantityOnHand: remaining,
          quantityReserved: 0,
        });
      }

      await tx
        .update(purchaseOrderItems)
        .set({ quantityReceived: item.quantityOrdered })
        .where(eq(purchaseOrderItems.id, item.id));

      await tx.insert(stockMovements).values({
        type: "receipt",
        productId: item.productId,
        toWarehouseId: po.warehouseId,
        quantityDelta: remaining,
        reference: po.orderNumber,
        note: `Received ${remaining} units from ${po.orderNumber}`,
        performedBy,
        source,
      });
    }

    const [updated] = await tx
      .update(purchaseOrders)
      .set({ status: "received", receivedAt: new Date() })
      .where(eq(purchaseOrders.id, po.id))
      .returning();

    return updated;
  });
}

/**
 * Transitions a Sales Order through reserve → fulfil → ship (or cancel),
 * atomically managing reserved & on-hand inventory in PostgreSQL.
 */
export async function applySalesOrderAction(params: {
  soId: string;
  action: "reserve" | "fulfil" | "ship" | "cancel";
  trackingCarrier?: string;
  trackingNumber?: string;
  performedBy: string;
  source?: "web" | "mobile";
}) {
  const db = await getDb();
  const src = params.source ?? "web";

  return db.transaction(async (tx) => {
    const [so] = await tx.select().from(salesOrders).where(eq(salesOrders.id, params.soId)).limit(1);
    if (!so) throw new Error("Sales order not found.");

    const items = await tx.select().from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, so.id));

    if (params.action === "reserve") {
      if (so.status !== "pending") throw new Error("Only pending sales orders can be reserved.");
      for (const item of items) {
        const [level] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.warehouseId, so.warehouseId)))
          .limit(1);
        const available = level ? level.quantityOnHand - level.quantityReserved : 0;
        if (!level || available < item.quantity) {
          throw new Error(`Insufficient stock in warehouse to reserve ${item.quantity} units (available: ${available}).`);
        }
        await tx
          .update(stockLevels)
          .set({ quantityReserved: level.quantityReserved + item.quantity, updatedAt: new Date() })
          .where(eq(stockLevels.id, level.id));
        await tx.insert(stockMovements).values({
          type: "reservation",
          productId: item.productId,
          fromWarehouseId: so.warehouseId,
          quantityDelta: item.quantity,
          reference: so.orderNumber,
          note: `Reserved ${item.quantity} units for ${so.orderNumber}`,
          performedBy: params.performedBy,
          source: src,
        });
      }
      const [updated] = await tx
        .update(salesOrders)
        .set({ status: "reserved", deliveryStatus: "packed_for_pickup" })
        .where(eq(salesOrders.id, so.id))
        .returning();
      return updated;
    }

    if (params.action === "fulfil") {
      if (so.status !== "pending" && so.status !== "reserved") {
        throw new Error("Order is already fulfilled, shipped, or cancelled.");
      }
      const wasReserved = so.status === "reserved";
      for (const item of items) {
        const [level] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.warehouseId, so.warehouseId)))
          .limit(1);
        if (!level || level.quantityOnHand < item.quantity) {
          throw new Error(`Insufficient on-hand stock to fulfil ${item.quantity} units.`);
        }
        await tx
          .update(stockLevels)
          .set({
            quantityOnHand: level.quantityOnHand - item.quantity,
            quantityReserved: wasReserved ? Math.max(0, level.quantityReserved - item.quantity) : level.quantityReserved,
            updatedAt: new Date(),
          })
          .where(eq(stockLevels.id, level.id));

        await tx.insert(stockMovements).values({
          type: "fulfilment",
          productId: item.productId,
          fromWarehouseId: so.warehouseId,
          quantityDelta: -item.quantity,
          reference: so.orderNumber,
          note: `Fulfilled ${item.quantity} units for ${so.orderNumber}`,
          performedBy: params.performedBy,
          source: src,
        });
      }
      const [updated] = await tx
        .update(salesOrders)
        .set({ status: "fulfilled", deliveryStatus: "ready_to_ship", fulfilledAt: new Date() })
        .where(eq(salesOrders.id, so.id))
        .returning();
      return updated;
    }

    if (params.action === "ship") {
      if (so.status !== "fulfilled" && so.status !== "reserved") {
        throw new Error("Fulfil or reserve the order before marking it shipped.");
      }
      const [updated] = await tx
        .update(salesOrders)
        .set({
          status: "shipped",
          trackingCarrier: params.trackingCarrier || so.trackingCarrier || "FedEx Ground",
          trackingNumber: params.trackingNumber || so.trackingNumber || `SF-${Date.now().toString().slice(-8)}`,
          deliveryStatus: "in_transit",
          fulfilledAt: so.fulfilledAt ?? new Date(),
        })
        .where(eq(salesOrders.id, so.id))
        .returning();
      return updated;
    }

    // Cancel (release reserved stock if previously reserved)
    if (so.status === "reserved") {
      for (const item of items) {
        const [level] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.warehouseId, so.warehouseId)))
          .limit(1);
        if (level) {
          await tx
            .update(stockLevels)
            .set({ quantityReserved: Math.max(0, level.quantityReserved - item.quantity), updatedAt: new Date() })
            .where(eq(stockLevels.id, level.id));
        }
      }
    }
    const [updated] = await tx
      .update(salesOrders)
      .set({ status: "cancelled", deliveryStatus: "cancelled" })
      .where(eq(salesOrders.id, so.id))
      .returning();
    return updated;
  });
}

export async function getAlertsSummary() {
  const db = await getDb();
  const [lowStock, openPOs, openSOs, allSuppliers, allCustomers] = await Promise.all([
    listEnrichedProducts({ lowStockOnly: true }),
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)),
    db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)),
    db.select().from(suppliers),
    db.select().from(customers),
  ]);

  const supMap = new Map(allSuppliers.map((s) => [s.id, s.name]));
  const custMap = new Map(allCustomers.map((c) => [c.id, c.name]));

  return {
    lowStock: lowStock.map((p) => ({
      productId: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      available: p.totalAvailable,
      threshold: p.minStockThreshold,
      deficit: Math.max(0, p.minStockThreshold - p.totalAvailable),
    })),
    pendingPurchaseOrders: openPOs
      .filter((po) => po.status === "ordered" || po.status === "draft")
      .map((po) => ({
        id: po.id,
        orderNumber: po.orderNumber,
        supplierName: supMap.get(po.supplierId) ?? "Supplier",
        expectedDate: po.expectedDate,
        status: po.status,
      })),
    pendingSalesOrders: openSOs
      .filter((so) => so.status === "pending" || so.status === "reserved")
      .map((so) => ({
        id: so.id,
        orderNumber: so.orderNumber,
        customerName: custMap.get(so.customerId) ?? "Customer",
        status: so.status,
      })),
  };
}


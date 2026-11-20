import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";

import { getDb, resetDemoWorkspace } from "@/db";
import { customers, products, purchaseOrderItems, purchaseOrders, salesOrderItems, salesOrders, suppliers, warehouses } from "@/db/schema";
import {
  adjustStock,
  applySalesOrderAction,
  getAlertsSummary,
  getDashboardSummary,
  listEnrichedProducts,
  receivePurchaseOrder,
  transferStock,
} from "@/lib/inventory";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { productCreateSchema, stockTransferSchema } from "@/lib/validation";

describe("StockFlow validation & security", () => {
  it("hashes and verifies credentials securely", () => {
    const h = hashPassword("StockFlowDemo2026!");
    assert.equal(verifyPassword("StockFlowDemo2026!", h), true);
    assert.equal(verifyPassword("wrong", h), false);
  });

  it("validates product & transfer payloads strictly", () => {
    assert.equal(productCreateSchema.safeParse({ sku: "A", barcode: "12", name: "X" }).success, false);
    assert.equal(stockTransferSchema.safeParse({ productId: "not-uuid", fromWarehouseId: "a", toWarehouseId: "b", quantity: 0 }).success, false);
  });
});

describe("StockFlow PostgreSQL transactional inventory workflows", () => {
  it("runs product CRUD, warehouse creation, receipt, adjustment, transfer, PO receive, SO reserve/fulfil, low-stock detection and reset", async () => {
    const db = await getDb();

    // 1. Seeded dashboard & low-stock alerts
    const initialDash = await getDashboardSummary();
    assert.equal(initialDash.kpis.totalProducts, 8);
    assert.equal(initialDash.kpis.warehouseCount, 3);
    assert.equal(initialDash.kpis.lowStockCount, 3, "3 seeded low-stock SKUs expected");

    const allWh = await db.select().from(warehouses);
    const whAus = allWh.find((w) => w.code === "WH-AUS")!;
    const whChi = allWh.find((w) => w.code === "WH-CHI")!;

    // 2. Create warehouse
    const [whDal] = await db
      .insert(warehouses)
      .values({ code: "WH-DAL", name: "Dallas Overflow Hub", location: "Dallas, TX" })
      .returning();
    assert.equal(whDal.code, "WH-DAL");

    // 3. Create product & edit it + barcode lookup
    const [prod] = await db
      .insert(products)
      .values({
        sku: "SF-QA-999",
        barcode: "8901234599999",
        name: "QA Test Barcode Label Printer",
        category: "Warehouse Hardware",
        unitCostCents: 10000,
        sellingPriceCents: 22000,
        minStockThreshold: 12,
      })
      .returning();

    await db.update(products).set({ minStockThreshold: 15 }).where(eq(products.id, prod.id));
    const lookup = await listEnrichedProducts({ barcode: "8901234599999" });
    assert.equal(lookup.length, 1);
    assert.equal(lookup[0].minStockThreshold, 15);
    assert.equal(lookup[0].isLowStock, true, "0 stock <= 15 threshold triggers low-stock alert");

    // 4. Stock receipt (+30 into Austin)
    const r1 = await adjustStock({
      productId: prod.id,
      warehouseId: whAus.id,
      type: "receipt",
      quantityDelta: 30,
      note: "Initial dock receipt",
      performedBy: "QA Runner",
      source: "web",
    });
    assert.equal(r1.newQuantityOnHand, 30);

    // 5. Mobile stock adjustment (-5 in Austin)
    const r2 = await adjustStock({
      productId: prod.id,
      warehouseId: whAus.id,
      type: "adjustment",
      quantityDelta: -5,
      note: "Mobile barcode cycle count",
      performedBy: "QA Mobile",
      source: "mobile",
    });
    assert.equal(r2.newQuantityOnHand, 25);
    assert.equal(r2.movement.source, "mobile");

    // 6. Inter-warehouse stock transfer (10 from Austin -> Chicago)
    await transferStock({
      productId: prod.id,
      fromWarehouseId: whAus.id,
      toWarehouseId: whChi.id,
      quantity: 10,
      performedBy: "QA Runner",
      source: "mobile",
    });

    const afterTransfer = (await listEnrichedProducts({ barcode: "8901234599999" }))[0];
    assert.equal(afterTransfer.warehouseStock.find((w) => w.warehouseId === whAus.id)?.quantityOnHand, 15);
    assert.equal(afterTransfer.warehouseStock.find((w) => w.warehouseId === whChi.id)?.quantityOnHand, 10);

    // 7. Purchase order creation & receiving stock (+20 into Chicago)
    const [sup] = await db.select().from(suppliers).limit(1);
    const [po] = await db
      .insert(purchaseOrders)
      .values({ orderNumber: "PO-QA-500", supplierId: sup.id, warehouseId: whChi.id, status: "ordered" })
      .returning();
    await db.insert(purchaseOrderItems).values({
      purchaseOrderId: po.id,
      productId: prod.id,
      quantityOrdered: 20,
      quantityReceived: 0,
      unitCostCents: 10000,
    });
    const receivedPo = await receivePurchaseOrder(po.id, "QA Runner", "web");
    assert.equal(receivedPo.status, "received");

    const afterPo = (await listEnrichedProducts({ barcode: "8901234599999" }))[0];
    assert.equal(afterPo.warehouseStock.find((w) => w.warehouseId === whChi.id)?.quantityOnHand, 30);

    // 8. Sales order creation -> reserve -> fulfil -> ship
    const [cust] = await db.select().from(customers).limit(1);
    const [so] = await db
      .insert(salesOrders)
      .values({ orderNumber: "SO-QA-700", customerId: cust.id, warehouseId: whAus.id, status: "pending" })
      .returning();
    await db.insert(salesOrderItems).values({
      salesOrderId: so.id,
      productId: prod.id,
      quantity: 5,
      unitPriceCents: 22000,
    });

    const reserved = await applySalesOrderAction({ soId: so.id, action: "reserve", performedBy: "QA Runner" });
    assert.equal(reserved.status, "reserved");
    const fulfilled = await applySalesOrderAction({ soId: so.id, action: "fulfil", performedBy: "QA Runner" });
    assert.equal(fulfilled.status, "fulfilled");
    const shipped = await applySalesOrderAction({
      soId: so.id,
      action: "ship",
      trackingCarrier: "DHL Express",
      trackingNumber: "DHL-QA-1234",
      performedBy: "QA Runner",
    });
    assert.equal(shipped.status, "shipped");

    const afterSo = (await listEnrichedProducts({ barcode: "8901234599999" }))[0];
    assert.equal(afterSo.warehouseStock.find((w) => w.warehouseId === whAus.id)?.quantityOnHand, 10);

    // 9. Alerts summary & Demo reset
    const alerts = await getAlertsSummary();
    assert.ok(alerts.lowStock.length >= 3);

    await resetDemoWorkspace();
    const afterReset = await getDashboardSummary();
    assert.equal(afterReset.kpis.totalProducts, 8);
    assert.equal(afterReset.kpis.warehouseCount, 3);
  });
});


import type { StockFlowDb } from "@/db";
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
  users,
  warehouses,
} from "@/db/schema";
import { DEMO_ACCOUNT, hashPassword } from "@/lib/crypto";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function isoDateOffset(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Seeds realistic fictional inventory, warehouses, barcodes (EAN-13), suppliers,
 * purchase orders, customers, sales orders, and stock movement audit trails.
 */
export async function seedStockFlowDemo(
  db: StockFlowDb,
  opts: { skipUsers?: boolean; usersOnly?: boolean } = {},
): Promise<void> {
  if (!opts.skipUsers) {
    await db
      .insert(users)
      .values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: "demo",
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
        },
        {
          email: "warehouse@stockflow.studio",
          name: "Bilal Qureshi (Warehouse Lead)",
          role: "warehouse_staff",
          passwordHash: hashPassword("StaffLocked2026!"),
        },
      ])
      .onConflictDoNothing();
  }
  if (opts.usersOnly) return;

  // 1. Warehouses (3 distribution hubs)
  const insertedWarehouses = await db
    .insert(warehouses)
    .values([
      {
        code: "WH-AUS",
        name: "Austin Central Fulfilment",
        location: "Austin, TX",
        storageZones: "Aisles A–F, Picking Mezzanine, Receiving Dock 1–3",
        managerName: "Samir Malik",
        status: "active",
      },
      {
        code: "WH-CHI",
        name: "Chicago Midwest Depot",
        location: "Chicago, IL",
        storageZones: "Bulk Racks B1–B12, Cold Storage Bay, Dispatch Lane",
        managerName: "Bilal Qureshi",
        status: "active",
      },
      {
        code: "WH-EWR",
        name: "Newark East Coast Port Hub",
        location: "Newark, NJ",
        storageZones: "Container Unload Bay, Staging Area S1–S4",
        managerName: "Claire Navarro",
        status: "active",
      },
    ])
    .returning();

  const [whAus, whChi, whEwr] = insertedWarehouses;

  // 2. Products with realistic SKUs & EAN-13 scannable barcodes
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        sku: "SF-AUD-101",
        barcode: "8901234500101",
        name: "Studio Monitor Headphones Pro",
        category: "Audio Gear",
        description: "Closed-back reference studio headphones with braided detachable cable and hard travel case.",
        unitCostCents: 6400,
        sellingPriceCents: 14900,
        minStockThreshold: 25,
        status: "active",
      },
      {
        sku: "SF-USB-204",
        barcode: "8901234500204",
        name: "USB-C 10-in-1 Aluminum Dock",
        category: "Electronics",
        description: "CNC-milled dual-4K HDMI + 100W PD pass-through workstation hub.",
        unitCostCents: 2950,
        sellingPriceCents: 7900,
        minStockThreshold: 40,
        status: "active",
      },
      {
        sku: "SF-PKG-310",
        barcode: "8901234500310",
        name: "Thermal Shipping Labels (4×6, 500/Roll)",
        category: "Packaging & Supplies",
        description: "Direct thermal smudge-resistant adhesive carrier labels compatible with Zebra & Rollo printers.",
        unitCostCents: 680,
        sellingPriceCents: 1650,
        minStockThreshold: 60,
        status: "active",
      },
      {
        sku: "SF-SCN-405",
        barcode: "8901234500405",
        name: "2D Bluetooth Warehouse Barcode Scanner",
        category: "Warehouse Hardware",
        description: "Rugged IP65 wireless 1D/2D QR & EAN barcode scanner with charging cradle.",
        unitCostCents: 4200,
        sellingPriceCents: 9800,
        minStockThreshold: 15,
        status: "active",
      },
      {
        sku: "SF-PWR-512",
        barcode: "8901234500512",
        name: "GaN 140W Multi-Port Fast Charger",
        category: "Electronics",
        description: "Compact 3× USB-C + 1× USB-A GaN power adapter with foldable international plugs.",
        unitCostCents: 2400,
        sellingPriceCents: 6500,
        minStockThreshold: 30,
        status: "active",
      },
      {
        sku: "SF-CER-608",
        barcode: "8901234500608",
        name: "Stoneware Pour-Over Coffee Carafe",
        category: "Home & Lifestyle",
        description: "Matte charcoal ceramic pour-over dripper and 600ml server (gift boxed).",
        unitCostCents: 1450,
        sellingPriceCents: 4200,
        minStockThreshold: 35,
        status: "active",
      },
      {
        sku: "SF-LIT-702",
        barcode: "8901234500702",
        name: "Bi-Color LED Key Light Panel",
        category: "Audio Gear",
        description: "CRI 97+ desk-mounted creator key light with wireless dimmer and diffuser.",
        unitCostCents: 4800,
        sellingPriceCents: 11900,
        minStockThreshold: 20,
        status: "active",
      },
      {
        sku: "SF-PKG-815",
        barcode: "8901234500815",
        name: "Heavy-Duty Corrugated Mailer Box (12×9×4)",
        category: "Packaging & Supplies",
        description: "ECT-32 kraft ecommerce shipping boxes bundled in packs of 25.",
        unitCostCents: 1150,
        sellingPriceCents: 2600,
        minStockThreshold: 50,
        status: "active",
      },
    ])
    .returning();

  const [pHeadphones, pDock, pLabels, pScanner, pCharger, pCarafe, pLight, pBoxes] = insertedProducts;

  // 3. Stock levels across warehouses (intentionally include 3 low-stock items for alert visibility!)
  await db.insert(stockLevels).values([
    { productId: pHeadphones.id, warehouseId: whAus.id, binLocation: "A-02-1", quantityOnHand: 42, quantityReserved: 6 },
    { productId: pHeadphones.id, warehouseId: whChi.id, binLocation: "B-04-2", quantityOnHand: 28, quantityReserved: 0 },

    { productId: pDock.id, warehouseId: whAus.id, binLocation: "A-04-3", quantityOnHand: 18, quantityReserved: 4 },
    { productId: pDock.id, warehouseId: whEwr.id, binLocation: "S-01-2", quantityOnHand: 12, quantityReserved: 0 }, // Total 30 < threshold 40 → LOW STOCK

    { productId: pLabels.id, warehouseId: whAus.id, binLocation: "C-01-1", quantityOnHand: 110, quantityReserved: 10 },
    { productId: pLabels.id, warehouseId: whChi.id, binLocation: "B-01-4", quantityOnHand: 85, quantityReserved: 0 },

    { productId: pScanner.id, warehouseId: whAus.id, binLocation: "A-01-1", quantityOnHand: 7, quantityReserved: 2 },
    { productId: pScanner.id, warehouseId: whChi.id, binLocation: "B-02-1", quantityOnHand: 4, quantityReserved: 0 }, // Total 11 < threshold 15 → LOW STOCK

    { productId: pCharger.id, warehouseId: whAus.id, binLocation: "A-05-2", quantityOnHand: 64, quantityReserved: 5 },
    { productId: pCharger.id, warehouseId: whEwr.id, binLocation: "S-02-1", quantityOnHand: 40, quantityReserved: 0 },

    { productId: pCarafe.id, warehouseId: whChi.id, binLocation: "B-08-3", quantityOnHand: 52, quantityReserved: 0 },
    { productId: pCarafe.id, warehouseId: whEwr.id, binLocation: "S-03-4", quantityOnHand: 26, quantityReserved: 4 },

    { productId: pLight.id, warehouseId: whAus.id, binLocation: "A-06-1", quantityOnHand: 9, quantityReserved: 0 },
    { productId: pLight.id, warehouseId: whEwr.id, binLocation: "S-04-2", quantityOnHand: 6, quantityReserved: 0 }, // Total 15 < threshold 20 → LOW STOCK

    { productId: pBoxes.id, warehouseId: whAus.id, binLocation: "D-01-1", quantityOnHand: 95, quantityReserved: 0 },
    { productId: pBoxes.id, warehouseId: whChi.id, binLocation: "B-10-1", quantityOnHand: 70, quantityReserved: 0 },
  ]);

  // 4. Suppliers & Purchase Orders
  const insertedSuppliers = await db
    .insert(suppliers)
    .values([
      {
        name: "Shenzhen Meridian Acoustics Ltd.",
        contactName: "Wei Lin",
        email: "orders@meridian-acoustics.example",
        phone: "+86 755 5550 1920",
        country: "China",
        leadTimeDays: 18,
        notes: "Primary OEM for studio headphones and LED panels; FOB Shenzhen.",
      },
      {
        name: "Pacific Precision Electronics",
        contactName: "Grace Tan",
        email: "sales@pacific-elec.example",
        phone: "+886 2 5550 8821",
        country: "Taiwan",
        leadTimeDays: 14,
        notes: "USB-C docks, GaN chargers and rugged warehouse barcode scanners.",
      },
      {
        name: "Heartland Paper & Packaging",
        contactName: "Tom Henderson",
        email: "dispatch@heartland-pkg.example",
        phone: "+1 (312) 555-0192",
        country: "United States",
        leadTimeDays: 4,
        notes: "Domestic thermal labels and corrugated shipping cartons.",
      },
    ])
    .returning();

  const [supAcoustics, supElectronics, supPackaging] = insertedSuppliers;

  const insertedPOs = await db
    .insert(purchaseOrders)
    .values([
      {
        orderNumber: "PO-2026-101",
        supplierId: supElectronics.id,
        warehouseId: whAus.id,
        status: "ordered",
        expectedDate: isoDateOffset(5),
        notes: "Replenishment for low-stock USB-C Docks and Bluetooth Scanners.",
        createdAt: daysAgo(6),
      },
      {
        orderNumber: "PO-2026-102",
        supplierId: supAcoustics.id,
        warehouseId: whEwr.id,
        status: "ordered",
        expectedDate: isoDateOffset(9),
        notes: "East Coast restock of Bi-Color LED Key Light Panels.",
        createdAt: daysAgo(4),
      },
      {
        orderNumber: "PO-2026-098",
        supplierId: supPackaging.id,
        warehouseId: whChi.id,
        status: "received",
        expectedDate: isoDateOffset(-5),
        notes: "Monthly bulk carton and thermal label delivery received in full.",
        createdAt: daysAgo(12),
        receivedAt: daysAgo(5),
      },
    ])
    .returning();

  const [po101, po102, po098] = insertedPOs;

  await db.insert(purchaseOrderItems).values([
    { purchaseOrderId: po101.id, productId: pDock.id, quantityOrdered: 40, quantityReceived: 0, unitCostCents: 2950 },
    { purchaseOrderId: po101.id, productId: pScanner.id, quantityOrdered: 20, quantityReceived: 0, unitCostCents: 4200 },
    { purchaseOrderId: po102.id, productId: pLight.id, quantityOrdered: 30, quantityReceived: 0, unitCostCents: 4800 },
    { purchaseOrderId: po098.id, productId: pLabels.id, quantityOrdered: 80, quantityReceived: 80, unitCostCents: 680 },
    { purchaseOrderId: po098.id, productId: pBoxes.id, quantityOrdered: 50, quantityReceived: 50, unitCostCents: 1150 },
  ]);

  // 5. Customers & Sales Orders
  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Northwind Creative Supply",
        contactName: "Rachel Lin",
        email: "receiving@northwind-supply.example",
        phone: "+1 (512) 555-0144",
        shippingAddress: "410 Congress Ave, Suite 300, Austin, TX 78701",
      },
      {
        name: "Harbor Retail Collective",
        contactName: "Devon Brooks",
        email: "ops@harbor-retail.example",
        phone: "+1 (617) 555-0182",
        shippingAddress: "88 Seaport Blvd, Boston, MA 02210",
      },
      {
        name: "Summit Distribution LLC",
        contactName: "Kiran Shah",
        email: "procurement@summit-dist.example",
        phone: "+1 (303) 555-0177",
        shippingAddress: "1620 Blake St, Denver, CO 80202",
      },
    ])
    .returning();

  const [custNorthwind, custHarbor, custSummit] = insertedCustomers;

  const insertedSOs = await db
    .insert(salesOrders)
    .values([
      {
        orderNumber: "SO-2026-201",
        customerId: custNorthwind.id,
        warehouseId: whAus.id,
        status: "reserved",
        deliveryStatus: "packed_for_pickup",
        notes: "Stock reserved in Austin Central; awaiting carrier scan.",
        createdAt: daysAgo(2),
      },
      {
        orderNumber: "SO-2026-202",
        customerId: custHarbor.id,
        warehouseId: whEwr.id,
        status: "pending",
        deliveryStatus: "awaiting_fulfilment",
        notes: "Wholesale order for ceramic carafes and USB-C docks.",
        createdAt: daysAgo(1),
      },
      {
        orderNumber: "SO-2026-198",
        customerId: custSummit.id,
        warehouseId: whChi.id,
        status: "shipped",
        trackingCarrier: "UPS Freight",
        trackingNumber: "1Z999AA10123456784",
        deliveryStatus: "in_transit",
        notes: "Dispatched from Chicago depot.",
        createdAt: daysAgo(6),
        fulfilledAt: daysAgo(4),
      },
    ])
    .returning();

  const [so201, so202, so198] = insertedSOs;

  await db.insert(salesOrderItems).values([
    { salesOrderId: so201.id, productId: pHeadphones.id, quantity: 6, unitPriceCents: 14900 },
    { salesOrderId: so201.id, productId: pDock.id, quantity: 4, unitPriceCents: 7900 },
    { salesOrderId: so202.id, productId: pCarafe.id, quantity: 10, unitPriceCents: 4200 },
    { salesOrderId: so198.id, productId: pLabels.id, quantity: 25, unitPriceCents: 1650 },
  ]);

  // 6. Seeded stock movement audit log
  await db.insert(stockMovements).values([
    {
      type: "receipt",
      productId: pLabels.id,
      toWarehouseId: whChi.id,
      quantityDelta: 80,
      reference: "PO-2026-098",
      note: "Received bulk thermal labels from Heartland Paper & Packaging",
      performedBy: "Bilal Qureshi (Warehouse Lead)",
      source: "web",
      createdAt: daysAgo(5),
    },
    {
      type: "transfer",
      productId: pCharger.id,
      fromWarehouseId: whEwr.id,
      toWarehouseId: whAus.id,
      quantityDelta: 20,
      reference: "TRF-2026-014",
      note: "Rebalanced GaN chargers from Newark port hub to Austin Central",
      performedBy: DEMO_ACCOUNT.name,
      source: "web",
      createdAt: daysAgo(4),
    },
    {
      type: "fulfilment",
      productId: pLabels.id,
      fromWarehouseId: whChi.id,
      quantityDelta: -25,
      reference: "SO-2026-198",
      note: "Fulfilled and shipped via UPS Freight",
      performedBy: "Bilal Qureshi (Warehouse Lead)",
      source: "web",
      createdAt: daysAgo(4),
    },
    {
      type: "reservation",
      productId: pHeadphones.id,
      fromWarehouseId: whAus.id,
      quantityDelta: 6,
      reference: "SO-2026-201",
      note: "Reserved 6 units for Northwind Creative Supply",
      performedBy: DEMO_ACCOUNT.name,
      source: "web",
      createdAt: daysAgo(2),
    },
    {
      type: "adjustment",
      productId: pScanner.id,
      toWarehouseId: whAus.id,
      quantityDelta: -2,
      reference: "CYCLE-COUNT-09",
      note: "Mobile barcode cycle count variance recorded in Aisle A-01",
      performedBy: DEMO_ACCOUNT.name,
      source: "mobile",
      createdAt: daysAgo(1),
    },
  ]);
}


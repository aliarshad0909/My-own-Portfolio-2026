import { pgTable, text, integer, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("demo"), // 'admin' | 'ops_manager' | 'warehouse_staff' | 'demo'
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientType: text("client_type").notNull().default("web"), // 'web' | 'mobile'
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const warehouses = pgTable("warehouses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull().default(""),
  storageZones: text("storage_zones").notNull().default("Zone A, Receiving Bay"),
  managerName: text("manager_name").notNull().default(""),
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  unitCostCents: integer("unit_cost_cents").notNull().default(0),
  sellingPriceCents: integer("selling_price_cents").notNull().default(0),
  minStockThreshold: integer("min_stock_threshold").notNull().default(10),
  status: text("status").notNull().default("active"), // 'active' | 'draft' | 'discontinued'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stockLevels = pgTable(
  "stock_levels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    binLocation: text("bin_location").notNull().default("A-01"),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("stock_levels_product_warehouse_idx").on(table.productId, table.warehouseId)],
);

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // 'receipt' | 'adjustment' | 'transfer' | 'issue' | 'reservation' | 'fulfilment'
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  fromWarehouseId: uuid("from_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  toWarehouseId: uuid("to_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  quantityDelta: integer("quantity_delta").notNull(),
  reference: text("reference").notNull().default(""),
  note: text("note").notNull().default(""),
  performedBy: text("performed_by").notNull().default("System"),
  source: text("source").notNull().default("web"), // 'web' | 'mobile' | 'system'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  country: text("country").notNull().default("China"),
  leadTimeDays: integer("lead_time_days").notNull().default(14),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("ordered"), // 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled'
  expectedDate: text("expected_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").notNull().default(0),
  unitCostCents: integer("unit_cost_cents").notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("pending"), // 'pending' | 'reserved' | 'fulfilled' | 'shipped' | 'cancelled'
  trackingCarrier: text("tracking_carrier").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  deliveryStatus: text("delivery_status").notNull().default("awaiting_fulfilment"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
});

export const salesOrderItems = pgTable("sales_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  salesOrderId: uuid("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});


import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  clientType: z.enum(["web", "mobile"]).optional().default("web"),
});

export const productCreateSchema = z.object({
  sku: z.string().trim().min(2, "SKU is required").max(40),
  barcode: z.string().trim().min(4, "Barcode is required").max(64),
  name: z.string().trim().min(2, "Product name is required").max(160),
  category: z.string().trim().min(1).max(80).default("General"),
  description: z.string().trim().max(1500).optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  unitCostCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  sellingPriceCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  minStockThreshold: z.coerce.number().int().min(0).max(1_000_000).default(10),
  status: z.enum(["active", "draft", "discontinued"]).default("active"),
  initialWarehouseId: z.string().uuid().optional(),
  initialQuantity: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  binLocation: z.string().trim().max(40).optional().default("A-01"),
});

export const productUpdateSchema = productCreateSchema
  .omit({ initialWarehouseId: true, initialQuantity: true, binLocation: true })
  .partial();

export const warehouseCreateSchema = z.object({
  code: z.string().trim().min(2, "Code is required").max(20),
  name: z.string().trim().min(2, "Warehouse name is required").max(120),
  location: z.string().trim().min(2, "Location is required").max(160),
  storageZones: z.string().trim().max(240).optional().default("Zone A, Receiving Bay"),
  managerName: z.string().trim().max(100).optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const stockAdjustSchema = z.object({
  productId: z.string().uuid("Select a valid product"),
  warehouseId: z.string().uuid("Select a valid warehouse"),
  type: z.enum(["receipt", "adjustment", "issue"]).default("adjustment"),
  /** Positive adds stock, negative subtracts stock (for 'issue' absolute value is subtracted). */
  quantityDelta: z.coerce.number().int().refine((n) => n !== 0, "Quantity must be non-zero"),
  binLocation: z.string().trim().max(40).optional(),
  reference: z.string().trim().max(80).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  source: z.enum(["web", "mobile", "system"]).optional().default("web"),
});

export const stockTransferSchema = z.object({
  productId: z.string().uuid("Select a valid product"),
  fromWarehouseId: z.string().uuid("Select a source warehouse"),
  toWarehouseId: z.string().uuid("Select a destination warehouse"),
  quantity: z.coerce.number().int().min(1, "Transfer quantity must be at least 1"),
  note: z.string().trim().max(500).optional().default(""),
  source: z.enum(["web", "mobile", "system"]).optional().default("web"),
});

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(2).max(140),
  contactName: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(80).optional().default("China"),
  leadTimeDays: z.coerce.number().int().min(1).max(365).default(14),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const purchaseOrderCreateSchema = z.object({
  supplierId: z.string().uuid("Select a supplier"),
  warehouseId: z.string().uuid("Select a receiving warehouse"),
  expectedDate: z.string().trim().max(30).optional().default(""),
  notes: z.string().trim().max(800).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantityOrdered: z.coerce.number().int().min(1),
        unitCostCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one purchase order line"),
});

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(140),
  contactName: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  shippingAddress: z.string().trim().max(300).optional().default(""),
});

export const salesOrderCreateSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  warehouseId: z.string().uuid("Select a fulfilment warehouse"),
  notes: z.string().trim().max(800).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1),
        unitPriceCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one sales order line"),
});

export const salesOrderActionSchema = z.object({
  action: z.enum(["reserve", "fulfil", "ship", "cancel"]),
  trackingCarrier: z.string().trim().max(60).optional().default(""),
  trackingNumber: z.string().trim().max(100).optional().default(""),
});


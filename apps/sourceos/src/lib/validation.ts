import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  demo: z.boolean().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name is required").max(120),
  country: z.string().trim().min(2, "Country is required").max(80),
  category: z.string().trim().min(2, "Category is required").max(80),
  qualificationStatus: z.enum(["approved", "under_review", "probation"]).default("under_review"),
  leadTimeDays: z.coerce.number().int().min(1).max(365),
  onTimePct: z.coerce.number().min(0).max(100),
  defectRatePct: z.coerce.number().min(0).max(100),
  certifications: z.string().trim().max(240).default("ISO 9001"),
  rating: z.coerce.number().min(1).max(5).default(4.3),
  contactEmail: z.string().trim().max(160).default(""),
  notes: z.string().trim().max(1000).default(""),
});

export const updateSupplierSchema = z.object({
  qualificationStatus: z.enum(["approved", "under_review", "probation"]).optional(),
  leadTimeDays: z.coerce.number().int().min(1).max(365).optional(),
  onTimePct: z.coerce.number().min(0).max(100).optional(),
  defectRatePct: z.coerce.number().min(0).max(100).optional(),
  certifications: z.string().trim().max(240).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createRfqSchema = z.object({
  title: z.string().trim().min(3, "RFQ title is required").max(160),
  targetQty: z.coerce.number().int().min(1).max(10_000_000),
  targetUnitCents: z.coerce.number().int().min(1).max(500_000_000),
  currency: z.string().trim().min(3).max(5).default("USD"),
  dueDate: z.string().trim().min(8).max(20),
  notes: z.string().trim().max(1000).default(""),
});

export const createQuotationSchema = z.object({
  rfqId: z.string().uuid("Valid RFQ ID is required"),
  supplierId: z.string().uuid("Valid supplier ID is required"),
  unitPriceCents: z.coerce.number().int().min(1).max(500_000_000),
  moq: z.coerce.number().int().min(1).max(10_000_000),
  leadTimeDays: z.coerce.number().int().min(1).max(365),
  incoterms: z.enum(["EXW", "FCA", "FOB", "CIF", "DAP", "DDP"]).default("FOB"),
  freightEstimateCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  notes: z.string().trim().max(800).default(""),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Valid supplier ID is required"),
  rfqId: z.string().uuid().nullable().optional(),
  itemName: z.string().trim().min(2).max(180),
  quantity: z.coerce.number().int().min(1).max(10_000_000),
  unitCostCents: z.coerce.number().int().min(1).max(500_000_000),
  incoterms: z.enum(["EXW", "FCA", "FOB", "CIF", "DAP", "DDP"]).default("FOB"),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["ordered", "in_production", "shipped", "delivered"]),
});

export const createShipmentSchema = z.object({
  poId: z.string().uuid("Valid PO ID is required"),
  carrier: z.string().trim().min(2).max(120),
  mode: z.enum(["sea", "air", "express"]),
  originPort: z.string().trim().min(2).max(120),
  destPort: z.string().trim().min(2).max(120),
  etaDate: z.string().trim().min(8).max(20),
  freightCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  insuranceCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  dutyCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
});

export const updateShipmentSchema = z.object({
  status: z.enum(["booked", "in_transit", "customs", "delivered"]),
  etaDate: z.string().trim().min(8).max(20).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  docType: z.enum([
    "commercial_invoice",
    "packing_list",
    "bill_of_lading",
    "certificate_of_origin",
    "qc_report",
  ]),
  entityRef: z.string().trim().min(2).max(60),
  status: z.enum(["pending_review", "submitted", "verified"]).default("pending_review"),
  notes: z.string().trim().max(1000).default(""),
});

export const updateDocumentSchema = z.object({
  status: z.enum(["pending_review", "submitted", "verified"]),
  notes: z.string().trim().max(1000).optional(),
});

export const createLandedCostSchema = z.object({
  title: z.string().trim().min(2, "Scenario title is required").max(160),
  productPriceCents: z.coerce.number().int().min(1).max(500_000_000),
  quantity: z.coerce.number().int().min(1).max(10_000_000),
  freightCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  insuranceCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  customsDutyPct: z.coerce.number().min(0).max(200).default(0),
  otherExpensesCents: z.coerce.number().int().min(0).max(500_000_000).default(0),
  currency: z.string().trim().min(3).max(5).default("USD"),
  exchangeRateToUsd: z.coerce.number().gt(0).max(10000).default(1.0),
  notes: z.string().trim().max(1000).default(""),
});

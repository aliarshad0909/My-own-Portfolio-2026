export type Incoterm = "EXW" | "FOB" | "CIF" | "DDP";
export type ShipMode = "sea_fcl" | "sea_lcl" | "air" | "rail" | "express";

export type Supplier = {
  id: string;
  name: string;
  city: string;
  /** Years trading, as stated by the supplier. */
  yearsTrading: number;
  /** Audit result, where one exists. */
  audit: "BSCI" | "ISO 9001" | "SMETA" | "none";
  /** Share of past orders delivered to specification, 0–1. */
  qualityRate: number;
  /** Share of past orders shipped on the agreed date, 0–1. */
  onTimeRate: number;
  /** Typical reply time in hours. */
  responseHours: number;
  verified: boolean;
};

export type Quote = {
  id: string;
  rfqId: string;
  supplierId: string;
  /** Unit price in cents, in the quoted incoterm. */
  unitPrice: number;
  moq: number;
  /** Working days from order to ready-to-ship. */
  leadTimeDays: number;
  incoterm: Incoterm;
  /** Tooling or sample charge in cents, one-off. */
  toolingCost: number;
  validUntil: string;
  notes: string;
};

export type RFQ = {
  id: string;
  product: string;
  category: string;
  /** Units required. */
  quantity: number;
  /** Target landed unit cost in cents, if the buyer has one. */
  targetUnitCost: number | null;
  destination: string;
  /** HS tariff code, which drives the duty rate. */
  hsCode: string;
  status: "open" | "quoting" | "awarded" | "closed";
  createdAt: string;
  needBy: string;
  spec: string[];
};

export type Milestone = { label: string; plannedAt: string; actualAt: string | null };

export type Shipment = {
  id: string;
  poId: string;
  supplierId: string;
  mode: ShipMode;
  /** Chargeable weight in kg. */
  weightKg: number;
  /** Volume in cubic metres. */
  cbm: number;
  containers: number;
  milestones: Milestone[];
};

export type PurchaseOrder = {
  id: string;
  rfqId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  incoterm: Incoterm;
  placedAt: string;
  status: "placed" | "in_production" | "shipped" | "delivered" | "cancelled";
};

export type Message = {
  id: string;
  supplierId: string;
  rfqId: string;
  at: string;
  direction: "out" | "in";
  subject: string;
  body: string;
};

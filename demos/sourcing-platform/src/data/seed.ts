import type { Message, PurchaseOrder, Quote, RFQ, Shipment, Supplier } from "../lib/types.ts";

/** All suppliers, quotes and shipments below are invented for this demonstration. */
export const TODAY = "2026-06-30";

export const SUPPLIERS: Supplier[] = [
  { id: "S-01", name: "Ningbo Haoyu Housewares", city: "Ningbo", yearsTrading: 11, audit: "BSCI", qualityRate: 0.96, onTimeRate: 0.91, responseHours: 6, verified: true },
  { id: "S-02", name: "Shenzhen Brightline Electronics", city: "Shenzhen", yearsTrading: 7, audit: "ISO 9001", qualityRate: 0.93, onTimeRate: 0.88, responseHours: 10, verified: true },
  { id: "S-03", name: "Yiwu Fastline Trading", city: "Yiwu", yearsTrading: 2, audit: "none", qualityRate: 0.81, onTimeRate: 0.74, responseHours: 48, verified: false },
  { id: "S-04", name: "Foshan Tenko Furniture", city: "Foshan", yearsTrading: 15, audit: "SMETA", qualityRate: 0.98, onTimeRate: 0.95, responseHours: 14, verified: true },
  { id: "S-05", name: "Dongguan Pinecrest Plastics", city: "Dongguan", yearsTrading: 9, audit: "ISO 9001", qualityRate: 0.9, onTimeRate: 0.83, responseHours: 20, verified: true },
  { id: "S-06", name: "Quanzhou Riverstone Textiles", city: "Quanzhou", yearsTrading: 4, audit: "BSCI", qualityRate: 0.88, onTimeRate: 0.79, responseHours: 30, verified: false },
];

export const RFQS: RFQ[] = [
  {
    id: "RFQ-2026-014", product: "Stoneware mug, 12oz, two-tone glaze", category: "Ceramics", quantity: 5000,
    targetUnitCost: 420, destination: "Los Angeles, US", hsCode: "6912", status: "quoting",
    createdAt: "2026-06-02", needBy: "2026-10-15",
    spec: ["12oz capacity, ±3%", "Lead-free glaze, FDA compliant", "Two-colour exterior, matt finish", "Individual carton, 24 per master"],
  },
  {
    id: "RFQ-2026-015", product: "Bamboo desk organiser, 4 compartments", category: "Home office", quantity: 2000,
    targetUnitCost: 780, destination: "Rotterdam, NL", hsCode: "4420", status: "quoting",
    createdAt: "2026-06-10", needBy: "2026-09-30",
    spec: ["Moso bamboo, FSC chain of custody", "No visible glue lines", "Felt base pads", "Flat-packed"],
  },
  {
    id: "RFQ-2026-016", product: "USB-C desk lamp, dimmable", category: "Lighting", quantity: 1500,
    targetUnitCost: 1250, destination: "Los Angeles, US", hsCode: "9405", status: "awarded",
    createdAt: "2026-04-18", needBy: "2026-08-20",
    spec: ["5V USB-C input", "3 colour temperatures", "CE and FCC marking", "1.5m braided cable"],
  },
];

export const QUOTES: Quote[] = [
  { id: "Q-101", rfqId: "RFQ-2026-014", supplierId: "S-01", unitPrice: 268, moq: 3000, leadTimeDays: 28, incoterm: "FOB", toolingCost: 85000, validUntil: "2026-08-15", notes: "Glaze sample approved. Two-tone adds 4 days." },
  { id: "Q-102", rfqId: "RFQ-2026-014", supplierId: "S-03", unitPrice: 214, moq: 10000, leadTimeDays: 35, incoterm: "EXW", toolingCost: 42000, validUntil: "2026-07-20", notes: "Lowest unit price but MOQ is double our volume." },
  { id: "Q-103", rfqId: "RFQ-2026-014", supplierId: "S-05", unitPrice: 312, moq: 2000, leadTimeDays: 21, incoterm: "CIF", toolingCost: 110000, validUntil: "2026-09-01", notes: "CIF to LA. Includes freight and insurance." },
  { id: "Q-104", rfqId: "RFQ-2026-014", supplierId: "S-04", unitPrice: 355, moq: 1000, leadTimeDays: 18, incoterm: "DDP", toolingCost: 95000, validUntil: "2026-08-30", notes: "DDP delivered to warehouse, duty paid." },
  { id: "Q-201", rfqId: "RFQ-2026-015", supplierId: "S-04", unitPrice: 610, moq: 1000, leadTimeDays: 24, incoterm: "FOB", toolingCost: 0, validUntil: "2026-08-10", notes: "FSC certificate on file." },
  { id: "Q-202", rfqId: "RFQ-2026-015", supplierId: "S-03", unitPrice: 495, moq: 3000, leadTimeDays: 30, incoterm: "EXW", toolingCost: 0, validUntil: "2026-06-25", notes: "Quote has lapsed; would need re-confirming." },
  { id: "Q-203", rfqId: "RFQ-2026-015", supplierId: "S-06", unitPrice: 680, moq: 500, leadTimeDays: 20, incoterm: "FOB", toolingCost: 15000, validUntil: "2026-09-15", notes: "Can hold stock for staggered release." },
  { id: "Q-301", rfqId: "RFQ-2026-016", supplierId: "S-02", unitPrice: 940, moq: 1000, leadTimeDays: 26, incoterm: "FOB", toolingCost: 180000, validUntil: "2026-07-30", notes: "Awarded. CE and FCC test reports supplied." },
];

export const ORDERS: PurchaseOrder[] = [
  { id: "PO-5521", rfqId: "RFQ-2026-016", supplierId: "S-02", quantity: 1500, unitPrice: 940, incoterm: "FOB", placedAt: "2026-05-02", status: "shipped" },
];

export const SHIPMENTS: Shipment[] = [
  {
    id: "SHP-5521", poId: "PO-5521", supplierId: "S-02", mode: "sea_fcl", weightKg: 2850, cbm: 18.4, containers: 1,
    milestones: [
      { label: "Order confirmed", plannedAt: "2026-05-02", actualAt: "2026-05-02" },
      { label: "Production complete", plannedAt: "2026-06-08", actualAt: "2026-06-11" },
      { label: "Pre-shipment inspection", plannedAt: "2026-06-10", actualAt: "2026-06-13" },
      { label: "Departed Yantian", plannedAt: "2026-06-16", actualAt: "2026-06-18" },
      { label: "Arrive Long Beach", plannedAt: "2026-07-18", actualAt: null },
      { label: "Customs cleared", plannedAt: "2026-07-22", actualAt: null },
      { label: "Delivered to warehouse", plannedAt: "2026-07-25", actualAt: null },
    ],
  },
];

export const MESSAGES: Message[] = [
  { id: "M-01", supplierId: "S-01", rfqId: "RFQ-2026-014", at: "2026-06-02", direction: "out", subject: "RFQ-2026-014 — stoneware mug, 5,000 units", body: "Specification and artwork attached. Please quote FOB Ningbo with tooling shown separately, and confirm whether the glaze is lead-free to FDA limits." },
  { id: "M-02", supplierId: "S-01", rfqId: "RFQ-2026-014", at: "2026-06-04", direction: "in", subject: "Re: RFQ-2026-014", body: "Quoted $2.68/pc FOB, tooling $850 one-off, 28 days. Glaze is lead-free and we can send the SGS report. Two-tone exterior adds about 4 days to the cycle." },
  { id: "M-03", supplierId: "S-01", rfqId: "RFQ-2026-014", at: "2026-06-05", direction: "out", subject: "Sample request", body: "Please send two samples in the agreed colours, plus the SGS report. We will cover courier." },
  { id: "M-04", supplierId: "S-03", rfqId: "RFQ-2026-014", at: "2026-06-03", direction: "in", subject: "Best price offer", body: "We can do $2.14/pc EXW but our minimum is 10,000 pieces. No audit certificate at present." },
  { id: "M-05", supplierId: "S-02", rfqId: "RFQ-2026-016", at: "2026-06-13", direction: "in", subject: "Inspection passed", body: "Pre-shipment inspection completed 13 June, three days later than planned. Booking the 18 June sailing." },
];

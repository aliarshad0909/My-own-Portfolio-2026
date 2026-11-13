import { calculateLandedCost, estimateArrival, type LandedCost } from "./landed-cost.ts";
import type { Milestone, Quote, RFQ, Shipment, ShipMode, Supplier } from "./types.ts";

export type ScoredQuote = {
  quote: Quote;
  supplier: Supplier;
  landed: LandedCost;
  /** Landed cost per unit, the figure that actually matters. */
  perUnit: number;
  arrival: string;
  /** Below the buyer's minimum order quantity. */
  belowMoq: boolean;
  expired: boolean;
  /** 0–100, with the weighting shown in the interface. */
  score: number;
  breakdown: { label: string; points: number; outOf: number }[];
};

export const WEIGHTS = { cost: 40, speed: 20, quality: 20, reliability: 12, responsiveness: 8 } as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Compare quotes on landed cost rather than unit price, because an EXW quote
 * that looks cheap can land dearer than a CIF one.
 */
export function scoreQuotes(rfq: RFQ, quotes: Quote[], suppliers: Supplier[], mode: ShipMode, shipping: { weightKgPerUnit: number; cbmPerUnit: number }, today: string): ScoredQuote[] {
  const rows = quotes
    .filter((q) => q.rfqId === rfq.id)
    .map((quote) => {
      const supplier = suppliers.find((s) => s.id === quote.supplierId);
      if (!supplier) return null;
      const landed = calculateLandedCost({
        quantity: rfq.quantity,
        unitPrice: quote.unitPrice,
        incoterm: quote.incoterm,
        mode,
        weightKg: rfq.quantity * shipping.weightKgPerUnit,
        cbm: rfq.quantity * shipping.cbmPerUnit,
        hsCode: rfq.hsCode,
        toolingCost: quote.toolingCost,
      });
      return {
        quote,
        supplier,
        landed,
        perUnit: landed.perUnit,
        arrival: estimateArrival(today, quote.leadTimeDays, mode),
        belowMoq: rfq.quantity < quote.moq,
        expired: quote.validUntil < today,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return [];

  const costs = rows.map((r) => r.perUnit);
  const leads = rows.map((r) => r.quote.leadTimeDays);
  const bestCost = Math.min(...costs);
  const worstCost = Math.max(...costs);
  const bestLead = Math.min(...leads);
  const worstLead = Math.max(...leads);

  return rows
    .map((r) => {
      // Relative scoring: the cheapest quote takes the full cost weighting and
      // the dearest takes none, so the comparison is always between these quotes.
      const costPoints = worstCost === bestCost ? WEIGHTS.cost : Math.round(WEIGHTS.cost * clamp01((worstCost - r.perUnit) / (worstCost - bestCost)));
      const speedPoints = worstLead === bestLead ? WEIGHTS.speed : Math.round(WEIGHTS.speed * clamp01((worstLead - r.quote.leadTimeDays) / (worstLead - bestLead)));
      const qualityPoints = Math.round(WEIGHTS.quality * clamp01(r.supplier.qualityRate));
      const reliabilityPoints = Math.round(WEIGHTS.reliability * clamp01(r.supplier.onTimeRate));
      const responsePoints = Math.round(WEIGHTS.responsiveness * clamp01(1 - r.supplier.responseHours / 72));
      const penalty = (r.belowMoq ? 15 : 0) + (r.expired ? 10 : 0);
      const score = Math.max(0, costPoints + speedPoints + qualityPoints + reliabilityPoints + responsePoints - penalty);
      return {
        ...r,
        score,
        breakdown: [
          { label: "Landed cost", points: costPoints, outOf: WEIGHTS.cost },
          { label: "Lead time", points: speedPoints, outOf: WEIGHTS.speed },
          { label: "Quality record", points: qualityPoints, outOf: WEIGHTS.quality },
          { label: "On-time record", points: reliabilityPoints, outOf: WEIGHTS.reliability },
          { label: "Responsiveness", points: responsePoints, outOf: WEIGHTS.responsiveness },
          ...(r.belowMoq ? [{ label: "Below MOQ", points: -15, outOf: 0 }] : []),
          ...(r.expired ? [{ label: "Quote expired", points: -10, outOf: 0 }] : []),
        ],
      };
    })
    .sort((a, b) => b.score - a.score || a.perUnit - b.perUnit);
}

export type ShipmentProgress = {
  completed: number;
  total: number;
  /** Next milestone still outstanding. */
  next: Milestone | null;
  /** Days late against plan for the next milestone; negative means early. */
  slipDays: number;
  status: "not_started" | "in_transit" | "delivered";
};

export function shipmentProgress(shipment: Shipment, today: string): ShipmentProgress {
  const done = shipment.milestones.filter((m) => m.actualAt !== null);
  const next = shipment.milestones.find((m) => m.actualAt === null) ?? null;
  const slip = next ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${next.plannedAt}T00:00:00Z`)) / 86400000) : 0;
  return {
    completed: done.length,
    total: shipment.milestones.length,
    next,
    slipDays: next ? slip : 0,
    status: done.length === 0 ? "not_started" : next === null ? "delivered" : "in_transit",
  };
}

/** Days between the planned and actual date of each completed milestone. */
export function milestoneVariance(shipment: Shipment): { label: string; days: number }[] {
  return shipment.milestones
    .filter((m) => m.actualAt !== null)
    .map((m) => ({ label: m.label, days: Math.round((Date.parse(`${m.actualAt}T00:00:00Z`) - Date.parse(`${m.plannedAt}T00:00:00Z`)) / 86400000) }));
}

export function supplierRisk(s: Supplier): { level: "low" | "medium" | "high"; reasons: string[] } {
  const reasons: string[] = [];
  if (!s.verified) reasons.push("Not yet verified");
  if (s.audit === "none") reasons.push("No third-party audit on file");
  if (s.qualityRate < 0.9) reasons.push(`Quality record ${Math.round(s.qualityRate * 100)}%`);
  if (s.onTimeRate < 0.85) reasons.push(`On-time record ${Math.round(s.onTimeRate * 100)}%`);
  if (s.yearsTrading < 3) reasons.push(`Only ${s.yearsTrading} years trading`);
  if (s.responseHours > 36) reasons.push(`Replies in about ${s.responseHours}h`);
  const level = reasons.length >= 3 ? "high" : reasons.length >= 1 ? "medium" : "low";
  return { level, reasons };
}

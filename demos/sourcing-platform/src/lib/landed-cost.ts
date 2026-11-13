import type { Incoterm, ShipMode } from "./types.ts";

/**
 * Landed cost.
 *
 * Illustrative rates for a demonstration. Real freight is quoted per shipment
 * and real duty depends on the tariff classification and origin agreements —
 * neither is looked up live here, and the interface says so.
 */

/** Indicative freight rates. Sea is per CBM, air and express per kg. */
export const FREIGHT_RATES: Record<ShipMode, { label: string; perCbm: number; perKg: number; minimum: number; transitDays: number }> = {
  sea_fcl: { label: "Sea FCL", perCbm: 4500, perKg: 0, minimum: 180000, transitDays: 32 },
  sea_lcl: { label: "Sea LCL", perCbm: 9500, perKg: 0, minimum: 25000, transitDays: 38 },
  rail: { label: "Rail", perCbm: 16000, perKg: 0, minimum: 60000, transitDays: 22 },
  air: { label: "Air freight", perCbm: 0, perKg: 480, minimum: 35000, transitDays: 8 },
  express: { label: "Express courier", perCbm: 0, perKg: 980, minimum: 8000, transitDays: 4 },
};

/** Indicative duty rates by HS chapter. Always confirm against the current tariff. */
export const DUTY_BY_HS: Record<string, number> = {
  "39": 0.065, // plastics
  "42": 0.09, // leather goods
  "44": 0.0, // wood
  "61": 0.16, // knitted apparel
  "62": 0.16, // woven apparel
  "63": 0.088, // made-up textiles
  "69": 0.085, // ceramics
  "73": 0.027, // iron and steel articles
  "76": 0.03, // aluminium
  "85": 0.025, // electrical machinery
  "94": 0.04, // furniture and lighting
  "95": 0.0, // toys
};

export const dutyRateFor = (hsCode: string): number => DUTY_BY_HS[hsCode.slice(0, 2)] ?? 0.05;

export type LandedInput = {
  quantity: number;
  /** Unit price in cents, in the quoted incoterm. */
  unitPrice: number;
  incoterm: Incoterm;
  mode: ShipMode;
  weightKg: number;
  cbm: number;
  hsCode: string;
  /** One-off tooling or sample charge in cents. */
  toolingCost: number;
  /** Insurance as a share of goods value. */
  insuranceRate?: number;
  /** Customs brokerage and port handling in cents. */
  brokerage?: number;
  /** Inland delivery from port to door in cents. */
  inland?: number;
};

export type LandedCost = {
  goods: number;
  tooling: number;
  freight: number;
  insurance: number;
  duty: number;
  brokerage: number;
  inland: number;
  total: number;
  /** Landed cost per unit, rounded to the nearest cent. */
  perUnit: number;
  dutyRate: number;
  /** Lines the incoterm already covers, so they are not charged twice. */
  includedByIncoterm: string[];
};

/**
 * What the incoterm already includes.
 * EXW: nothing. FOB: origin haulage and export clearance (not modelled separately).
 * CIF: freight and insurance to destination port. DDP: everything, including duty.
 */
export function calculateLandedCost(input: LandedInput): LandedCost {
  const { quantity, unitPrice, incoterm, mode, weightKg, cbm, hsCode, toolingCost } = input;
  const insuranceRate = input.insuranceRate ?? 0.004;
  const brokerageIn = input.brokerage ?? 18000;
  const inlandIn = input.inland ?? 24000;

  const goods = Math.max(0, Math.round(quantity * unitPrice));
  const tooling = Math.max(0, Math.round(toolingCost));
  const dutyRate = dutyRateFor(hsCode);
  const included: string[] = [];

  const rate = FREIGHT_RATES[mode];
  const rawFreight = Math.max(rate.minimum, Math.round(cbm * rate.perCbm + weightKg * rate.perKg));

  let freight = rawFreight;
  let insurance = Math.round(goods * insuranceRate);
  let duty = Math.round(goods * dutyRate);
  let brokerage = brokerageIn;
  let inland = inlandIn;

  if (incoterm === "CIF") {
    freight = 0;
    insurance = 0;
    included.push("Freight", "Insurance");
  }
  if (incoterm === "DDP") {
    freight = 0;
    insurance = 0;
    duty = 0;
    brokerage = 0;
    inland = 0;
    included.push("Freight", "Insurance", "Duty", "Brokerage", "Inland delivery");
  }

  const total = goods + tooling + freight + insurance + duty + brokerage + inland;
  return {
    goods, tooling, freight, insurance, duty, brokerage, inland, total,
    perUnit: quantity > 0 ? Math.round(total / quantity) : 0,
    dutyRate,
    includedByIncoterm: included,
  };
}

/** Working-day aware: a quoted lead time plus transit, skipping weekends. */
export function estimateArrival(orderDate: string, leadTimeDays: number, mode: ShipMode): string {
  const d = new Date(`${orderDate}T00:00:00Z`);
  let remaining = Math.max(0, Math.round(leadTimeDays));
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  d.setUTCDate(d.getUTCDate() + FREIGHT_RATES[mode].transitDays);
  return d.toISOString().slice(0, 10);
}

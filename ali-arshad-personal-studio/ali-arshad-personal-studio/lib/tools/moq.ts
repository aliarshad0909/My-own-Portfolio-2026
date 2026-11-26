/**
 * MOQ & Order Quantity Helper — pure domain math, unit tested.
 *
 * Helps importers translate supplier MOQs, carton packs (pcs/carton), carton
 * dimensions, and target budget into cartons needed, total volume (CBM),
 * gross shipment weight, container fill indicators, and order-size scenarios.
 * All outputs are planning estimates — never binding supplier offers.
 */

export type MoqInput = {
  /** Supplier EXW/FOB unit price in USD (or converted USD equivalent). */
  unitPriceUsd: number;
  /** Supplier minimum order quantity in units. */
  supplierMoqUnits: number;
  /** Planned order quantity in units. */
  plannedUnits: number;
  /** Units packed inside one export master carton. */
  unitsPerCarton: number;
  /** Master carton dimensions in centimeters (L × W × H). */
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  /** Gross weight per export master carton in kg. */
  cartonWeightKg: number;
  /** Optional tooling, custom mold, or packaging setup fee (USD). */
  setupFeeUsd?: number;
  /** Optional available purchase budget cap for comparison (USD). */
  budgetCapUsd?: number;
};

export type MoqScenario = {
  label: string;
  units: number;
  cartons: number;
  totalGoodsUsd: number;
  effectiveUnitUsd: number;
  totalCbm: number;
  totalWeightKg: number;
};

export type MoqResult = {
  meetsMoq: boolean;
  shortfallUnits: number;
  roundedOrderUnits: number;
  cartonsNeeded: number;
  cbmPerCarton: number;
  totalCbm: number;
  totalGrossWeightKg: number;
  volumetricWeightKg5000: number;
  totalGoodsUsd: number;
  setupFeeUsd: number;
  totalOrderOutlayUsd: number;
  effectiveUnitCostUsd: number;
  /** Indicative % of a standard 20ft GP container (~28 usable CBM) and 40ft GP (~58 usable CBM). */
  fill20ftPct: number;
  fill40ftPct: number;
  withinBudget: boolean | null;
  budgetRemainingUsd: number | null;
  scenarios: MoqScenario[];
};

const cleanPos = (n: number | undefined, fallback = 0) => (typeof n === "number" && Number.isFinite(n) ? Math.max(n, 0) : fallback);
const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function calculateMoqPlan(raw: MoqInput): MoqResult {
  const unitPrice = cleanPos(raw.unitPriceUsd);
  const moq = Math.max(1, Math.round(cleanPos(raw.supplierMoqUnits, 1)));
  const planned = Math.max(1, Math.round(cleanPos(raw.plannedUnits, moq)));
  const pcsPerCtn = Math.max(1, Math.round(cleanPos(raw.unitsPerCarton, 1)));
  const L = cleanPos(raw.cartonLengthCm);
  const W = cleanPos(raw.cartonWidthCm);
  const H = cleanPos(raw.cartonHeightCm);
  const ctnKg = cleanPos(raw.cartonWeightKg);
  const setupFee = cleanPos(raw.setupFeeUsd);
  const budgetCap = raw.budgetCapUsd !== undefined && raw.budgetCapUsd > 0 ? cleanPos(raw.budgetCapUsd) : null;

  const cartonsNeeded = Math.ceil(planned / pcsPerCtn);
  const roundedOrderUnits = cartonsNeeded * pcsPerCtn;
  const meetsMoq = roundedOrderUnits >= moq;
  const shortfallUnits = meetsMoq ? 0 : moq - roundedOrderUnits;

  const cbmPerCarton = (L * W * H) / 1_000_000;
  const totalCbm = cbmPerCarton * cartonsNeeded;
  const totalGrossWeightKg = ctnKg * cartonsNeeded;
  const volumetricWeightKg5000 = ((L * W * H) / 5000) * cartonsNeeded;

  const totalGoodsUsd = roundedOrderUnits * unitPrice;
  const totalOrderOutlayUsd = totalGoodsUsd + setupFee;
  const effectiveUnitCostUsd = roundedOrderUnits > 0 ? totalOrderOutlayUsd / roundedOrderUnits : 0;

  const buildScenario = (label: string, targetUnits: number): MoqScenario => {
    const ctns = Math.max(1, Math.ceil(targetUnits / pcsPerCtn));
    const units = ctns * pcsPerCtn;
    const outlay = units * unitPrice + setupFee;
    return {
      label,
      units,
      cartons: ctns,
      totalGoodsUsd: round2(outlay),
      effectiveUnitUsd: round2(outlay / units),
      totalCbm: round3(cbmPerCarton * ctns),
      totalWeightKg: round2(ctnKg * ctns),
    };
  };

  const scenarios: MoqScenario[] = [
    buildScenario("At Supplier MOQ", moq),
    buildScenario("Planned Order", planned),
    buildScenario("2× Scale Order", Math.max(moq * 2, planned * 2)),
  ];

  return {
    meetsMoq,
    shortfallUnits,
    roundedOrderUnits,
    cartonsNeeded,
    cbmPerCarton: round3(cbmPerCarton),
    totalCbm: round3(totalCbm),
    totalGrossWeightKg: round2(totalGrossWeightKg),
    volumetricWeightKg5000: round2(volumetricWeightKg5000),
    totalGoodsUsd: round2(totalGoodsUsd),
    setupFeeUsd: round2(setupFee),
    totalOrderOutlayUsd: round2(totalOrderOutlayUsd),
    effectiveUnitCostUsd: round2(effectiveUnitCostUsd),
    fill20ftPct: round2(Math.min((totalCbm / 28) * 100, 999)),
    fill40ftPct: round2(Math.min((totalCbm / 58) * 100, 999)),
    withinBudget: budgetCap !== null ? totalOrderOutlayUsd <= budgetCap : null,
    budgetRemainingUsd: budgetCap !== null ? round2(budgetCap - totalOrderOutlayUsd) : null,
    scenarios,
  };
}

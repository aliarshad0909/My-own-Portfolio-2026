/**
 * Landed cost calculator — pure logic, unit tested.
 *
 * Total landed cost = goods (converted via exchange rate) + international freight
 * + insurance + customs duty + import tax (VAT/GST) + customs clearance
 * + local transportation + additional expenses.
 *
 * Backwards-compatible with the original `landedCost(input)` signature while
 * supporting currency conversion, import taxes, clearance, local delivery and
 * target selling-price margin/markup calculations.
 *
 * Planning estimate only — never presented as an official customs determination.
 */

export type LandedCostInput = {
  /** Cost per unit from the supplier (in supplier currency, default USD). */
  unitCost: number;
  quantity: number;
  /** Supplier currency label (e.g. "USD", "CNY", "EUR"). Defaults to "USD". */
  currency?: string;
  /**
   * Multiplier to convert 1 unit of supplier currency into reporting currency (USD).
   * Example: 1 for USD→USD, 0.14 for CNY→USD. Defaults to 1.
   */
  exchangeRate?: number;
  /** Total international freight/shipping for the order, in reporting currency (USD). */
  freight: number;
  /** Customs duty rate as a percentage of goods value, e.g. 6.5. */
  dutyRatePct: number;
  /** Import tax / VAT / GST rate (%) applied on (goods value + duty). Defaults to 0. */
  importTaxRatePct?: number;
  /** Insurance for the shipment, USD. */
  insurance: number;
  /** Customs clearance / brokerage fee, USD. Defaults to 0. */
  customsClearance?: number;
  /** Local drayage / domestic delivery to warehouse, USD. Defaults to 0. */
  localTransport?: number;
  /** Any other fixed fees (inspection, port handling, bank wire…), USD. */
  otherFees: number;
  /** Optional target selling price per unit (USD) to compute gross margin & markup. */
  targetSellingPrice?: number;
};

export type LandedCostResult = {
  currency: string;
  exchangeRate: number;
  /** Raw purchase total in supplier currency before FX conversion. */
  supplierGoodsValue: number;
  /** Product purchase total in reporting currency (USD). */
  goodsValue: number;
  freight: number;
  insurance: number;
  duty: number;
  importTax: number;
  customsClearance: number;
  localTransport: number;
  otherFees: number;
  /** Sum of all costs above raw product purchase total. */
  extraCostsTotal: number;
  totalLandedCost: number;
  perUnitLandedCost: number;
  /** Landed cost as a multiple of the raw goods value (e.g. 1.32). */
  upliftFactor: number;
  /** Margin/markup metrics when a positive targetSellingPrice is provided. */
  profitPerUnit: number | null;
  markupPct: number | null;
  grossMarginPct: number | null;
};

const safeNonNeg = (n: number | undefined) => (typeof n === "number" && Number.isFinite(n) ? Math.max(n, 0) : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function landedCost(input: LandedCostInput): LandedCostResult {
  const currency = (input.currency || "USD").toUpperCase();
  const exchangeRate =
    typeof input.exchangeRate === "number" && Number.isFinite(input.exchangeRate) && input.exchangeRate > 0
      ? input.exchangeRate
      : 1;

  const unitCost = safeNonNeg(input.unitCost);
  const quantity = Math.max(Math.floor(safeNonNeg(input.quantity)), 0);
  const freight = round2(safeNonNeg(input.freight));
  const dutyRate = safeNonNeg(input.dutyRatePct) / 100;
  const importTaxRate = safeNonNeg(input.importTaxRatePct) / 100;
  const insurance = round2(safeNonNeg(input.insurance));
  const customsClearance = round2(safeNonNeg(input.customsClearance));
  const localTransport = round2(safeNonNeg(input.localTransport));
  const otherFees = round2(safeNonNeg(input.otherFees));
  const targetSellingPrice = safeNonNeg(input.targetSellingPrice);

  const supplierGoodsValue = round2(unitCost * quantity);
  const goodsValue = round2(supplierGoodsValue * exchangeRate);
  const duty = round2(goodsValue * dutyRate);
  const importTax = round2((goodsValue + duty) * importTaxRate);

  const extraCostsTotal = round2(freight + insurance + duty + importTax + customsClearance + localTransport + otherFees);
  const totalLandedCost = round2(goodsValue + extraCostsTotal);
  const perUnitLandedCost = quantity > 0 ? round2(totalLandedCost / quantity) : 0;
  const upliftFactor = goodsValue > 0 ? round2(totalLandedCost / goodsValue) : 0;

  let profitPerUnit: number | null = null;
  let markupPct: number | null = null;
  let grossMarginPct: number | null = null;

  if (targetSellingPrice > 0 && perUnitLandedCost > 0) {
    profitPerUnit = round2(targetSellingPrice - perUnitLandedCost);
    markupPct = round2(((targetSellingPrice - perUnitLandedCost) / perUnitLandedCost) * 100);
    grossMarginPct = round2(((targetSellingPrice - perUnitLandedCost) / targetSellingPrice) * 100);
  }

  return {
    currency,
    exchangeRate,
    supplierGoodsValue,
    goodsValue,
    freight,
    insurance,
    duty,
    importTax,
    customsClearance,
    localTransport,
    otherFees,
    extraCostsTotal,
    totalLandedCost,
    perUnitLandedCost,
    upliftFactor,
    profitPerUnit,
    markupPct,
    grossMarginPct,
  };
}

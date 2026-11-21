export type LandedCostInput = {
  productPriceCents: number;
  quantity: number;
  freightCents: number;
  insuranceCents: number;
  customsDutyPct: number;
  otherExpensesCents: number;
  currency: string;
  exchangeRateToUsd: number;
};

export type LandedCostBreakdown = {
  currency: string;
  exchangeRateToUsd: number;
  quantity: number;
  customsDutyPct: number;
  // Source currency (in minor units / cents)
  fobSourceCents: number;
  freightSourceCents: number;
  insuranceSourceCents: number;
  cifSourceCents: number;
  dutySourceCents: number;
  otherExpensesSourceCents: number;
  totalLandedSourceCents: number;
  perUnitLandedSourceCents: number;
  // USD equivalents (in cents)
  fobUsdCents: number;
  freightUsdCents: number;
  insuranceUsdCents: number;
  cifUsdCents: number;
  dutyUsdCents: number;
  otherExpensesUsdCents: number;
  totalLandedUsdCents: number;
  perUnitLandedUsdCents: number;
  // Ratios
  overheadPctOverFob: number;
  costSharesPct: {
    product: number;
    freight: number;
    insurance: number;
    duty: number;
    other: number;
  };
};

export const CURRENCY_DEFAULTS: Record<string, { label: string; defaultRateToUsd: number }> = {
  USD: { label: "USD — US Dollar", defaultRateToUsd: 1.0 },
  EUR: { label: "EUR — Euro", defaultRateToUsd: 1.08 },
  GBP: { label: "GBP — British Pound", defaultRateToUsd: 1.27 },
  CNY: { label: "CNY — Chinese Yuan", defaultRateToUsd: 0.138 },
  JPY: { label: "JPY — Japanese Yen", defaultRateToUsd: 0.0067 },
  KRW: { label: "KRW — South Korean Won", defaultRateToUsd: 0.00073 },
  MXN: { label: "MXN — Mexican Peso", defaultRateToUsd: 0.055 },
  TWD: { label: "TWD — New Taiwan Dollar", defaultRateToUsd: 0.031 },
};

/**
 * Deterministic landed-cost calculator based strictly on user-entered assumptions:
 * - FOB = Product Unit Price × Quantity
 * - CIF = FOB + Freight + Insurance
 * - Customs Duty = CIF × (Customs Duty % / 100)
 * - Total Landed Cost (Source Currency) = CIF + Customs Duty + Other Expenses
 * - USD conversions = Source Currency × Exchange Rate to USD
 */
export function calculateLandedCost(input: LandedCostInput): LandedCostBreakdown {
  const qty = Math.max(1, Math.round(input.quantity));
  const unitCents = Math.max(0, Math.round(input.productPriceCents));
  const freightCents = Math.max(0, Math.round(input.freightCents));
  const insuranceCents = Math.max(0, Math.round(input.insuranceCents));
  const otherCents = Math.max(0, Math.round(input.otherExpensesCents));
  const dutyPct = Math.max(0, Number(input.customsDutyPct) || 0);
  const fx = input.exchangeRateToUsd > 0 ? input.exchangeRateToUsd : 1.0;

  const fobSourceCents = unitCents * qty;
  const cifSourceCents = fobSourceCents + freightCents + insuranceCents;
  const dutySourceCents = Math.round(cifSourceCents * (dutyPct / 100));
  const totalLandedSourceCents = cifSourceCents + dutySourceCents + otherCents;
  const perUnitLandedSourceCents = Math.round(totalLandedSourceCents / qty);

  const fobUsdCents = Math.round(fobSourceCents * fx);
  const freightUsdCents = Math.round(freightCents * fx);
  const insuranceUsdCents = Math.round(insuranceCents * fx);
  const cifUsdCents = Math.round(cifSourceCents * fx);
  const dutyUsdCents = Math.round(dutySourceCents * fx);
  const otherExpensesUsdCents = Math.round(otherCents * fx);
  const totalLandedUsdCents = Math.round(totalLandedSourceCents * fx);
  const perUnitLandedUsdCents = Math.round(totalLandedUsdCents / qty);

  const overheadPctOverFob =
    fobSourceCents > 0
      ? Number((((totalLandedSourceCents - fobSourceCents) / fobSourceCents) * 100).toFixed(2))
      : 0;

  const denom = totalLandedSourceCents > 0 ? totalLandedSourceCents : 1;
  const share = (part: number) => Number(((part / denom) * 100).toFixed(1));

  return {
    currency: input.currency.toUpperCase(),
    exchangeRateToUsd: fx,
    quantity: qty,
    customsDutyPct: dutyPct,
    fobSourceCents,
    freightSourceCents: freightCents,
    insuranceSourceCents: insuranceCents,
    cifSourceCents,
    dutySourceCents,
    otherExpensesSourceCents: otherCents,
    totalLandedSourceCents,
    perUnitLandedSourceCents,
    fobUsdCents,
    freightUsdCents,
    insuranceUsdCents,
    cifUsdCents,
    dutyUsdCents,
    otherExpensesUsdCents,
    totalLandedUsdCents,
    perUnitLandedUsdCents,
    overheadPctOverFob,
    costSharesPct: {
      product: share(fobSourceCents),
      freight: share(freightCents),
      insurance: share(insuranceCents),
      duty: share(dutySourceCents),
      other: share(otherCents),
    },
  };
}

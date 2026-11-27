/**
 * Shipping Cost Calculator — pure logic, unit tested.
 *
 * Computes volumetric weight, chargeable weight (max of actual vs volumetric),
 * estimated freight cost and total shipping cost including handling.
 * Supports both metric (kg / cm) and imperial (lb / in) unit systems.
 *
 * Planning estimate only — never presented as a live carrier quote.
 */

export type ShippingUnitSystem = "metric" | "imperial";

export type ShippingMethodId = "air-express" | "air-freight" | "sea-lcl" | "courier-ground";

export type ShippingMethodMeta = {
  id: ShippingMethodId;
  label: string;
  defaultDivisorMetric: number;
  defaultDivisorImperial: number;
  suggestedRateMetricUsd: number;
  suggestedRateImperialUsd: number;
  note: string;
};

export const SHIPPING_METHODS: ShippingMethodMeta[] = [
  {
    id: "air-express",
    label: "Air Express (Courier)",
    defaultDivisorMetric: 5000,
    defaultDivisorImperial: 139,
    suggestedRateMetricUsd: 8.5,
    suggestedRateImperialUsd: 3.85,
    note: "Standard courier volumetric divisor (5,000 cm³/kg or 139 in³/lb).",
  },
  {
    id: "air-freight",
    label: "Air Freight (Cargo)",
    defaultDivisorMetric: 6000,
    defaultDivisorImperial: 166,
    suggestedRateMetricUsd: 5.5,
    suggestedRateImperialUsd: 2.5,
    note: "IATA cargo volumetric divisor (6,000 cm³/kg or 166 in³/lb).",
  },
  {
    id: "sea-lcl",
    label: "Sea Freight (LCL Consolidation)",
    defaultDivisorMetric: 1000,
    defaultDivisorImperial: 28,
    suggestedRateMetricUsd: 1.8,
    suggestedRateImperialUsd: 0.82,
    note: "Often billed per CBM (1 CBM ≈ 1,000 kg equivalent) or revenue ton.",
  },
  {
    id: "courier-ground",
    label: "Road / Ground Parcel",
    defaultDivisorMetric: 5000,
    defaultDivisorImperial: 139,
    suggestedRateMetricUsd: 3.2,
    suggestedRateImperialUsd: 1.45,
    note: "Domestic or regional ground parcel rate with carrier dimensional divisor.",
  },
];

export const COMMON_COUNTRIES = [
  "China",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Pakistan",
  "Germany",
  "Canada",
  "Australia",
  "Saudi Arabia",
  "Netherlands",
  "Turkey",
  "India",
  "Singapore",
] as const;

export const LB_PER_KG = 2.2046226218;
export const CM_PER_INCH = 2.54;

export type ShippingCostInput = {
  originCountry: string;
  destinationCountry: string;
  method: ShippingMethodId;
  unitSystem: ShippingUnitSystem;
  /** Actual parcel/shipment weight in kg (metric) or lb (imperial). */
  actualWeight: number;
  /** Dimensions in cm (metric) or in (imperial). */
  length: number;
  width: number;
  height: number;
  /** Volumetric divisor (e.g. 5000 for metric cm³/kg, 139 for imperial in³/lb). */
  volumetricDivisor: number;
  /** Rate per chargeable kg (metric) or per chargeable lb (imperial), USD. */
  ratePerChargeableUnit: number;
  /** Additional handling, fuel, pickup or documentation charges, USD. */
  handlingCharges: number;
  /** Optional number of identical cartons in the shipment (defaults to 1). */
  cartonCount?: number;
};

export type ShippingCostResult = {
  unitSystem: ShippingUnitSystem;
  weightUnit: "kg" | "lb";
  dimensionUnit: "cm" | "in";
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  /** Always exposed in metric kg and CBM for customs/forwarder comparison. */
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  volumeCbm: number;
  billedBy: "volumetric" | "actual" | "equal";
  freightCost: number;
  handlingCharges: number;
  totalEstimatedCost: number;
  effectiveCostPerActualUnit: number;
};

const safeNonNeg = (n: number) => (Number.isFinite(n) ? Math.max(n, 0) : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

export function getShippingMethod(id: ShippingMethodId): ShippingMethodMeta {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

export function calculateShippingCost(input: ShippingCostInput): ShippingCostResult {
  const unitSystem: ShippingUnitSystem = input.unitSystem === "imperial" ? "imperial" : "metric";
  const weightUnit = unitSystem === "metric" ? "kg" : "lb";
  const dimensionUnit = unitSystem === "metric" ? "cm" : "in";

  const actualWeight = safeNonNeg(input.actualWeight);
  const length = safeNonNeg(input.length);
  const width = safeNonNeg(input.width);
  const height = safeNonNeg(input.height);
  const cartons = Math.max(1, Math.floor(safeNonNeg(input.cartonCount ?? 1) || 1));
  const divisor = Number.isFinite(input.volumetricDivisor) && input.volumetricDivisor > 0 ? input.volumetricDivisor : unitSystem === "metric" ? 5000 : 139;
  const rate = safeNonNeg(input.ratePerChargeableUnit);
  const handlingCharges = round2(safeNonNeg(input.handlingCharges));

  const rawVolume = length * width * height * cartons;
  const totalActualWeight = actualWeight * cartons;
  const volumetricWeight = round2(rawVolume / divisor);
  const actualRounded = round2(totalActualWeight);
  const chargeableWeight = round2(Math.max(totalActualWeight, rawVolume / divisor));

  const billedBy: ShippingCostResult["billedBy"] =
    Math.abs(volumetricWeight - actualRounded) < 0.005
      ? "equal"
      : volumetricWeight > actualRounded
        ? "volumetric"
        : "actual";

  // Metric equivalents for consistent freight-forwarder reference
  const actualWeightKg = unitSystem === "metric" ? actualRounded : round2(totalActualWeight / LB_PER_KG);
  const volumetricWeightKg = unitSystem === "metric" ? volumetricWeight : round2((rawVolume / divisor) / LB_PER_KG);
  const chargeableWeightKg = round2(Math.max(actualWeightKg, volumetricWeightKg));

  const lengthCm = unitSystem === "metric" ? length : length * CM_PER_INCH;
  const widthCm = unitSystem === "metric" ? width : width * CM_PER_INCH;
  const heightCm = unitSystem === "metric" ? height : height * CM_PER_INCH;
  const volumeCbm = round4((lengthCm * widthCm * heightCm * cartons) / 1_000_000);

  const freightCost = round2(chargeableWeight * rate);
  const totalEstimatedCost = round2(freightCost + handlingCharges);
  const effectiveCostPerActualUnit = totalActualWeight > 0 ? round2(totalEstimatedCost / totalActualWeight) : 0;

  return {
    unitSystem,
    weightUnit,
    dimensionUnit,
    actualWeight: actualRounded,
    volumetricWeight,
    chargeableWeight,
    actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    volumeCbm,
    billedBy,
    freightCost,
    handlingCharges,
    totalEstimatedCost,
    effectiveCostPerActualUnit,
  };
}

/** Convert current shipping input values cleanly when switching between metric and imperial. */
export function convertShippingUnitSystem(
  input: ShippingCostInput,
  nextUnit: ShippingUnitSystem,
): ShippingCostInput {
  if (input.unitSystem === nextUnit) return input;
  const method = getShippingMethod(input.method);

  if (nextUnit === "imperial") {
    return {
      ...input,
      unitSystem: "imperial",
      actualWeight: round2(safeNonNeg(input.actualWeight) * LB_PER_KG),
      length: round2(safeNonNeg(input.length) / CM_PER_INCH),
      width: round2(safeNonNeg(input.width) / CM_PER_INCH),
      height: round2(safeNonNeg(input.height) / CM_PER_INCH),
      volumetricDivisor: method.defaultDivisorImperial,
      ratePerChargeableUnit: round2(safeNonNeg(input.ratePerChargeableUnit) / LB_PER_KG),
    };
  }

  return {
    ...input,
    unitSystem: "metric",
    actualWeight: round2(safeNonNeg(input.actualWeight) / LB_PER_KG),
    length: round2(safeNonNeg(input.length) * CM_PER_INCH),
    width: round2(safeNonNeg(input.width) * CM_PER_INCH),
    height: round2(safeNonNeg(input.height) * CM_PER_INCH),
    volumetricDivisor: method.defaultDivisorMetric,
    ratePerChargeableUnit: round2(safeNonNeg(input.ratePerChargeableUnit) * LB_PER_KG),
  };
}


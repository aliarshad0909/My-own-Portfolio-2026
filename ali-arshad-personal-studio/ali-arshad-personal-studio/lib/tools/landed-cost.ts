/**
 * Landed cost calculator — pure logic, unit tested.
 *
 * Total landed cost = goods + freight + duty + insurance + other fees, with a
 * per-unit breakdown. Duty is applied to the goods value (a common CIF-style
 * simplification); the UI notes that real customs valuation can differ and that
 * this is a planning estimate, not a customs declaration.
 */

export type LandedCostInput = {
  /** Cost per unit from the supplier, USD. */
  unitCost: number;
  quantity: number;
  /** Total freight/shipping for the whole order, USD. */
  freight: number;
  /** Import duty rate as a percentage of goods value, e.g. 6.5. */
  dutyRatePct: number;
  /** Insurance for the shipment, USD. */
  insurance: number;
  /** Any other fixed fees (brokerage, handling…), USD. */
  otherFees: number;
};

export type LandedCostResult = {
  goodsValue: number;
  duty: number;
  totalLandedCost: number;
  perUnitLandedCost: number;
  /** Landed cost as a multiple of the raw goods value (e.g. 1.32). */
  upliftFactor: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function landedCost(input: LandedCostInput): LandedCostResult {
  const unitCost = Math.max(input.unitCost || 0, 0);
  const quantity = Math.max(Math.floor(input.quantity || 0), 0);
  const freight = Math.max(input.freight || 0, 0);
  const dutyRate = Math.max(input.dutyRatePct || 0, 0) / 100;
  const insurance = Math.max(input.insurance || 0, 0);
  const otherFees = Math.max(input.otherFees || 0, 0);

  const goodsValue = round2(unitCost * quantity);
  const duty = round2(goodsValue * dutyRate);
  const totalLandedCost = round2(goodsValue + freight + duty + insurance + otherFees);
  const perUnitLandedCost = quantity > 0 ? round2(totalLandedCost / quantity) : 0;
  const upliftFactor = goodsValue > 0 ? round2(totalLandedCost / goodsValue) : 0;

  return { goodsValue, duty, totalLandedCost, perUnitLandedCost, upliftFactor };
}

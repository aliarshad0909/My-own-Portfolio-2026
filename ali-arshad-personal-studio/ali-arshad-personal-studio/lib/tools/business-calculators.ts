/**
 * Pure, unit-tested business calculator formulas for the 5 expanded Calculator Centre tools:
 *   6. SaaS Cost Calculator
 *   7. Inventory Reorder Calculator (ROP, Safety Stock & EOQ)
 *   8. Profit Margin Calculator (Gross Margin, Markup & Break-Even)
 *   9. Supplier Comparison Calculator (Effective Cost per Good Unit & Weighted Score)
 *  10. Project Budget Calculator (Role Hours, Direct Costs & Contingency Reserve)
 */

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampMin = (n: number, min = 0) => (Number.isFinite(n) ? Math.max(min, n) : min);

/* ───────────────────────── 6. SaaS Cost Calculator ───────────────────────── */

export type SaasCostInput = {
  currency: string;
  activeUsers: number;
  initialBuildCost: number;
  hostingMonthly: number;
  databaseMonthly: number;
  aiApiMonthly: number;
  thirdPartyToolsMonthly: number;
  maintenanceHoursPerMonth: number;
  hourlyRate: number;
};

export type SaasCostResult = {
  monthlyInfraCost: number;
  monthlyMaintenanceCost: number;
  monthlyOperatingTotal: number;
  annualOperatingTotal: number;
  yearOneTotalCost: number;
  costPerActiveUserMonthly: number;
  breakdown: { label: string; monthly: number; annual: number }[];
};

export function calculateSaasCost(input: SaasCostInput): SaasCostResult {
  const users = clampMin(input.activeUsers, 1);
  const build = clampMin(input.initialBuildCost);
  const hosting = clampMin(input.hostingMonthly);
  const db = clampMin(input.databaseMonthly);
  const ai = clampMin(input.aiApiMonthly);
  const tools = clampMin(input.thirdPartyToolsMonthly);
  const maint = clampMin(input.maintenanceHoursPerMonth) * clampMin(input.hourlyRate);

  const monthlyInfraCost = round2(hosting + db + ai + tools);
  const monthlyMaintenanceCost = round2(maint);
  const monthlyOperatingTotal = round2(monthlyInfraCost + monthlyMaintenanceCost);
  const annualOperatingTotal = round2(monthlyOperatingTotal * 12);
  const yearOneTotalCost = round2(build + annualOperatingTotal);
  const costPerActiveUserMonthly = round2(monthlyOperatingTotal / users);

  return {
    monthlyInfraCost,
    monthlyMaintenanceCost,
    monthlyOperatingTotal,
    annualOperatingTotal,
    yearOneTotalCost,
    costPerActiveUserMonthly,
    breakdown: [
      { label: "App Hosting & Bandwidth", monthly: round2(hosting), annual: round2(hosting * 12) },
      { label: "Managed PostgreSQL & Backups", monthly: round2(db), annual: round2(db * 12) },
      { label: "AI / LLM & External APIs", monthly: round2(ai), annual: round2(ai * 12) },
      { label: "Auth, Email & Observability", monthly: round2(tools), annual: round2(tools * 12) },
      { label: "Engineering Maintenance", monthly: monthlyMaintenanceCost, annual: round2(monthlyMaintenanceCost * 12) },
    ],
  };
}

/* ───────────────────── 7. Inventory Reorder Calculator ───────────────────── */

export type InventoryReorderInput = {
  currency: string;
  avgDailySales: number;
  leadTimeDays: number;
  safetyDays: number;
  currentOnHand: number;
  inboundPoUnits: number;
  unitCost: number;
  orderingCostPerPo: number;
  annualHoldingRatePct: number;
};

export type InventoryReorderResult = {
  leadTimeDemand: number;
  safetyStock: number;
  reorderPoint: number;
  effectiveInventoryPosition: number;
  daysOfCover: number;
  shouldReorderNow: boolean;
  recommendedOrderQty: number;
  eoq: number;
  estimatedOrderValue: number;
};

export function calculateInventoryReorder(input: InventoryReorderInput): InventoryReorderResult {
  const daily = clampMin(input.avgDailySales);
  const lead = clampMin(input.leadTimeDays);
  const safetyD = clampMin(input.safetyDays);
  const onHand = clampMin(input.currentOnHand);
  const inbound = clampMin(input.inboundPoUnits);
  const unitCost = clampMin(input.unitCost);
  const orderCost = clampMin(input.orderingCostPerPo);
  const holdPct = clampMin(input.annualHoldingRatePct, 0.1) / 100;

  const leadTimeDemand = Math.ceil(daily * lead);
  const safetyStock = Math.ceil(daily * safetyD);
  const reorderPoint = leadTimeDemand + safetyStock;
  const effectiveInventoryPosition = onHand + inbound;
  const daysOfCover = daily > 0 ? round2(effectiveInventoryPosition / daily) : 0;

  // Classic Economic Order Quantity: sqrt((2 * D * S) / H)
  const annualDemand = daily * 365;
  const holdingCostPerUnit = unitCost * holdPct;
  const eoq =
    annualDemand > 0 && orderCost > 0 && holdingCostPerUnit > 0
      ? Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit))
      : Math.max(leadTimeDemand, 1);

  const shouldReorderNow = effectiveInventoryPosition <= reorderPoint;
  const deficit = Math.max(0, reorderPoint - effectiveInventoryPosition);
  const recommendedOrderQty = shouldReorderNow ? Math.max(eoq, deficit + safetyStock) : eoq;
  const estimatedOrderValue = round2(recommendedOrderQty * unitCost);

  return {
    leadTimeDemand,
    safetyStock,
    reorderPoint,
    effectiveInventoryPosition,
    daysOfCover,
    shouldReorderNow,
    recommendedOrderQty,
    eoq,
    estimatedOrderValue,
  };
}

/* ────────────────────── 8. Profit Margin Calculator ──────────────────────── */

export type ProfitMarginInput = {
  currency: string;
  sellingPrice: number;
  unitCogs: number;
  shippingPerUnit: number;
  paymentFeePct: number;
  marketplaceFeePct: number;
  marketingPerUnit: number;
  monthlyFixedCosts: number;
  monthlyUnitsSold: number;
};

export type ProfitMarginResult = {
  grossProfitPerUnit: number;
  grossMarginPct: number;
  markupPct: number;
  variableCostsPerUnit: number;
  contributionMarginPerUnit: number;
  contributionMarginPct: number;
  breakEvenUnits: number | null;
  monthlyRevenue: number;
  monthlyNetProfit: number;
  netMarginPct: number;
};

export function calculateProfitMargin(input: ProfitMarginInput): ProfitMarginResult {
  const price = clampMin(input.sellingPrice);
  const cogs = clampMin(input.unitCogs);
  const ship = clampMin(input.shippingPerUnit);
  const payFee = price * (clampMin(input.paymentFeePct) / 100);
  const mktFee = price * (clampMin(input.marketplaceFeePct) / 100);
  const cac = clampMin(input.marketingPerUnit);
  const fixed = clampMin(input.monthlyFixedCosts);
  const qty = clampMin(input.monthlyUnitsSold);

  const grossProfitPerUnit = round2(price - cogs);
  const grossMarginPct = price > 0 ? round2((grossProfitPerUnit / price) * 100) : 0;
  const markupPct = cogs > 0 ? round2((grossProfitPerUnit / cogs) * 100) : 0;

  const variableCostsPerUnit = round2(cogs + ship + payFee + mktFee + cac);
  const contributionMarginPerUnit = round2(price - variableCostsPerUnit);
  const contributionMarginPct = price > 0 ? round2((contributionMarginPerUnit / price) * 100) : 0;
  const breakEvenUnits =
    contributionMarginPerUnit > 0 ? Math.ceil(fixed / contributionMarginPerUnit) : null;

  const monthlyRevenue = round2(price * qty);
  const monthlyNetProfit = round2(contributionMarginPerUnit * qty - fixed);
  const netMarginPct = monthlyRevenue > 0 ? round2((monthlyNetProfit / monthlyRevenue) * 100) : 0;

  return {
    grossProfitPerUnit,
    grossMarginPct,
    markupPct,
    variableCostsPerUnit,
    contributionMarginPerUnit,
    contributionMarginPct,
    breakEvenUnits,
    monthlyRevenue,
    monthlyNetProfit,
    netMarginPct,
  };
}

/* ─────────────────── 9. Supplier Comparison Calculator ───────────────────── */

export type SupplierOptionInput = {
  id: string;
  name: string;
  unitPrice: number;
  freightTotal: number;
  moq: number;
  leadTimeDays: number;
  defectRatePct: number;
  onTimePct: number;
};

export type SupplierComparisonInput = {
  currency: string;
  orderQuantity: number;
  costWeight: number;
  qualityWeight: number;
  speedWeight: number;
  suppliers: SupplierOptionInput[];
};

export type SupplierScoreRow = {
  id: string;
  name: string;
  effectiveUnitCost: number;
  totalOrderCost: number;
  usableUnits: number;
  effectiveCostPerGoodUnit: number;
  weightedScore: number;
  moqMet: boolean;
};

export type SupplierComparisonResult = {
  rows: SupplierScoreRow[];
  recommendedId: string | null;
  savingsVsHighest: number;
};

export function calculateSupplierComparison(
  input: SupplierComparisonInput,
): SupplierComparisonResult {
  const qty = clampMin(input.orderQuantity, 1);
  const totalW = Math.max(1, clampMin(input.costWeight) + clampMin(input.qualityWeight) + clampMin(input.speedWeight));
  const wCost = clampMin(input.costWeight) / totalW;
  const wQual = clampMin(input.qualityWeight) / totalW;
  const wSpeed = clampMin(input.speedWeight) / totalW;

  const base = input.suppliers.map((s) => {
    const unit = clampMin(s.unitPrice);
    const freight = clampMin(s.freightTotal);
    const defect = Math.min(99, clampMin(s.defectRatePct)) / 100;
    const onTime = Math.min(100, clampMin(s.onTimePct));
    const lead = clampMin(s.leadTimeDays, 1);
    const totalOrderCost = round2(unit * qty + freight);
    const effectiveUnitCost = round2(totalOrderCost / qty);
    const usableUnits = Math.max(1, Math.floor(qty * (1 - defect)));
    const effectiveCostPerGoodUnit = round2(totalOrderCost / usableUnits);
    return {
      ...s,
      totalOrderCost,
      effectiveUnitCost,
      usableUnits,
      effectiveCostPerGoodUnit,
      lead,
      defect,
      onTime,
      moqMet: qty >= clampMin(s.moq),
    };
  });

  const minCost = Math.min(...base.map((b) => b.effectiveCostPerGoodUnit), Infinity);
  const maxCost = Math.max(...base.map((b) => b.effectiveCostPerGoodUnit), 0);
  const minLead = Math.min(...base.map((b) => b.lead), Infinity);

  const rows: SupplierScoreRow[] = base.map((b) => {
    const costScore = b.effectiveCostPerGoodUnit > 0 ? Math.min(100, (minCost / b.effectiveCostPerGoodUnit) * 100) : 0;
    const qualityScore = Math.max(0, (1 - b.defect) * 60 + (b.onTime / 100) * 40);
    const speedScore = b.lead > 0 ? Math.min(100, (minLead / b.lead) * 100) : 0;
    const moqPenalty = b.moqMet ? 0 : 12;
    const weightedScore = round2(Math.max(0, costScore * wCost + qualityScore * wQual + speedScore * wSpeed - moqPenalty));

    return {
      id: b.id,
      name: b.name,
      effectiveUnitCost: b.effectiveUnitCost,
      totalOrderCost: b.totalOrderCost,
      usableUnits: b.usableUnits,
      effectiveCostPerGoodUnit: b.effectiveCostPerGoodUnit,
      weightedScore,
      moqMet: b.moqMet,
    };
  });

  const sorted = [...rows].sort((a, b) => b.weightedScore - a.weightedScore);
  const recommendedId = sorted[0]?.id ?? null;
  const minTotal = Math.min(...rows.map((r) => r.totalOrderCost), 0);
  const maxTotal = Math.max(...rows.map((r) => r.totalOrderCost), 0);

  return {
    rows,
    recommendedId,
    savingsVsHighest: round2(Math.max(0, maxTotal - minTotal)),
  };
}

/* ───────────────────── 10. Project Budget Calculator ─────────────────────── */

export type ProjectBudgetInput = {
  currency: string;
  durationWeeks: number;
  engineeringHours: number;
  engineeringRate: number;
  designHours: number;
  designRate: number;
  qaDevOpsHours: number;
  qaDevOpsRate: number;
  pmHours: number;
  pmRate: number;
  directSoftwareCosts: number;
  contingencyPct: number;
};

export type ProjectBudgetResult = {
  totalHours: number;
  laborSubtotal: number;
  directCosts: number;
  baseSubtotal: number;
  contingencyAmount: number;
  grandTotal: number;
  weeklyBurnRate: number;
  blendedHourlyRate: number;
  roles: { role: string; hours: number; cost: number }[];
};

export function calculateProjectBudget(input: ProjectBudgetInput): ProjectBudgetResult {
  const weeks = clampMin(input.durationWeeks, 1);
  const engH = clampMin(input.engineeringHours);
  const desH = clampMin(input.designHours);
  const qaH = clampMin(input.qaDevOpsHours);
  const pmH = clampMin(input.pmHours);

  const engCost = round2(engH * clampMin(input.engineeringRate));
  const desCost = round2(desH * clampMin(input.designRate));
  const qaCost = round2(qaH * clampMin(input.qaDevOpsRate));
  const pmCost = round2(pmH * clampMin(input.pmRate));

  const totalHours = round2(engH + desH + qaH + pmH);
  const laborSubtotal = round2(engCost + desCost + qaCost + pmCost);
  const directCosts = round2(clampMin(input.directSoftwareCosts));
  const baseSubtotal = round2(laborSubtotal + directCosts);
  const contingencyAmount = round2(baseSubtotal * (clampMin(input.contingencyPct) / 100));
  const grandTotal = round2(baseSubtotal + contingencyAmount);
  const weeklyBurnRate = round2(grandTotal / weeks);
  const blendedHourlyRate = totalHours > 0 ? round2(laborSubtotal / totalHours) : 0;

  return {
    totalHours,
    laborSubtotal,
    directCosts,
    baseSubtotal,
    contingencyAmount,
    grandTotal,
    weeklyBurnRate,
    blendedHourlyRate,
    roles: [
      { role: "Full-Stack Engineering", hours: engH, cost: engCost },
      { role: "Product & UI/UX Design", hours: desH, cost: desCost },
      { role: "QA, Testing & DevOps", hours: qaH, cost: qaCost },
      { role: "Architecture & Project Mgmt", hours: pmH, cost: pmCost },
    ],
  };
}

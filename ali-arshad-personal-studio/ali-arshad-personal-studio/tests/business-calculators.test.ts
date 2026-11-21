import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateInventoryReorder,
  calculateProfitMargin,
  calculateProjectBudget,
  calculateSaasCost,
  calculateSupplierComparison,
} from "@/lib/tools/business-calculators";

describe("Expanded Business Calculators (6–10)", () => {
  it("calculates SaaS operating cost, annual TCO, and cost per active user", () => {
    const r = calculateSaasCost({
      currency: "USD",
      activeUsers: 500,
      initialBuildCost: 12000,
      hostingMonthly: 50,
      databaseMonthly: 25,
      aiApiMonthly: 125,
      thirdPartyToolsMonthly: 50,
      maintenanceHoursPerMonth: 10,
      hourlyRate: 75,
    });
    assert.equal(r.monthlyInfraCost, 250);
    assert.equal(r.monthlyMaintenanceCost, 750);
    assert.equal(r.monthlyOperatingTotal, 1000);
    assert.equal(r.annualOperatingTotal, 12000);
    assert.equal(r.yearOneTotalCost, 24000);
    assert.equal(r.costPerActiveUserMonthly, 2);
  });

  it("calculates Inventory Reorder Point, Safety Stock, and EOQ", () => {
    const r = calculateInventoryReorder({
      currency: "USD",
      avgDailySales: 10,
      leadTimeDays: 14,
      safetyDays: 7,
      currentOnHand: 150,
      inboundPoUnits: 20,
      unitCost: 20,
      orderingCostPerPo: 100,
      annualHoldingRatePct: 25,
    });
    assert.equal(r.leadTimeDemand, 140);
    assert.equal(r.safetyStock, 70);
    assert.equal(r.reorderPoint, 210);
    assert.equal(r.effectiveInventoryPosition, 170);
    assert.equal(r.shouldReorderNow, true);
    assert.ok(r.eoq > 0);
  });

  it("calculates Profit Margin, Markup, Contribution Margin, and Break-Even", () => {
    const r = calculateProfitMargin({
      currency: "USD",
      sellingPrice: 100,
      unitCogs: 40,
      shippingPerUnit: 8,
      paymentFeePct: 3,
      marketplaceFeePct: 5,
      marketingPerUnit: 14,
      monthlyFixedCosts: 6000,
      monthlyUnitsSold: 300,
    });
    assert.equal(r.grossProfitPerUnit, 60);
    assert.equal(r.grossMarginPct, 60);
    assert.equal(r.markupPct, 150);
    assert.equal(r.contributionMarginPerUnit, 30);
    assert.equal(r.breakEvenUnits, 200);
    assert.equal(r.monthlyNetProfit, 3000);
  });

  it("scores suppliers using effective cost per good unit and weighted preferences", () => {
    const r = calculateSupplierComparison({
      currency: "USD",
      orderQuantity: 500,
      costWeight: 50,
      qualityWeight: 30,
      speedWeight: 20,
      suppliers: [
        { id: "a", name: "Supplier A", unitPrice: 10, freightTotal: 500, moq: 200, leadTimeDays: 20, defectRatePct: 2, onTimePct: 96 },
        { id: "b", name: "Supplier B", unitPrice: 13, freightTotal: 900, moq: 200, leadTimeDays: 35, defectRatePct: 8, onTimePct: 80 },
      ],
    });
    assert.equal(r.recommendedId, "a");
    assert.ok(r.savingsVsHighest > 0);
    assert.ok(r.rows[0].effectiveCostPerGoodUnit < r.rows[1].effectiveCostPerGoodUnit);
  });

  it("calculates Project Budget labor subtotal, contingency reserve, and weekly burn rate", () => {
    const r = calculateProjectBudget({
      currency: "USD",
      durationWeeks: 8,
      engineeringHours: 160,
      engineeringRate: 85,
      designHours: 40,
      designRate: 75,
      qaDevOpsHours: 20,
      qaDevOpsRate: 70,
      pmHours: 20,
      pmRate: 80,
      directSoftwareCosts: 400,
      contingencyPct: 15,
    });
    assert.equal(r.totalHours, 240);
    assert.equal(r.laborSubtotal, 19600);
    assert.equal(r.baseSubtotal, 20000);
    assert.equal(r.contingencyAmount, 3000);
    assert.equal(r.grandTotal, 23000);
    assert.equal(r.weeklyBurnRate, 2875);
  });
});

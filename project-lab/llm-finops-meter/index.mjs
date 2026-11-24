// All costs computed in integer microdollars ($1 = 1_000_000 microUSD) to avoid float drift.
export function calculateEventCostMicroUsd(rateCard, ev) {
  const r = rateCard[ev.model];
  if (!r) throw new Error(`Unknown model rate: ${ev.model}`);
  const uncachedIn = Math.max(0, (ev.inputTokens || 0) - (ev.cachedInputTokens || 0));
  return Math.round(
    (uncachedIn * r.inputPer1M + (ev.cachedInputTokens || 0) * r.cachedInputPer1M + (ev.outputTokens || 0) * r.outputPer1M) / 1_000_000,
  );
}

export function attributeSpend(rateCard, events, tenantBudgetMicroUsd = {}) {
  const byTenant = {};
  for (const ev of events) {
    const cost = calculateEventCostMicroUsd(rateCard, ev);
    byTenant[ev.tenant] = (byTenant[ev.tenant] || 0) + cost;
  }
  const alerts = Object.entries(byTenant)
    .filter(([t, cost]) => tenantBudgetMicroUsd[t] && cost > tenantBudgetMicroUsd[t])
    .map(([tenant, costMicroUsd]) => ({ tenant, costMicroUsd, budgetMicroUsd: tenantBudgetMicroUsd[tenant] }));
  return { byTenant, alerts };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const rates = { "fast-mini": { inputPer1M: 150_000, cachedInputPer1M: 37_500, outputPer1M: 600_000 } };
  console.log(JSON.stringify(attributeSpend(rates, [
    { tenant: "acme", model: "fast-mini", inputTokens: 100_000, cachedInputTokens: 40_000, outputTokens: 20_000 },
  ], { acme: 20_000 }), null, 2));
}

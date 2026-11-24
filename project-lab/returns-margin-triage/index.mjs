export function evaluateReturnRma(item) {
  // All values in integer cents
  const restockNet = item.resaleValueCents - item.returnShippingCents - item.inspectRestockCents;
  const keepItemCost = item.unitCostCents;
  const exchangeNet = item.priceCents - item.unitCostCents - item.returnShippingCents;
  if (item.condition === "damaged" || restockNet <= 0) {
    return { action: "keep_item_refund_or_credit", restockNetCents: restockNet, savedReverseShippingCents: item.returnShippingCents };
  }
  if (item.wantsExchange && exchangeNet > restockNet) {
    return { action: "instant_exchange_restock", netRecoveryCents: exchangeNet, keepItemCostCents: keepItemCost };
  }
  return { action: "return_and_restock", netRecoveryCents: restockNet };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(evaluateReturnRma({ priceCents: 6800, unitCostCents: 2100, resaleValueCents: 5200, returnShippingCents: 950, inspectRestockCents: 600, condition: "opened", wantsExchange: true }), null, 2));
}

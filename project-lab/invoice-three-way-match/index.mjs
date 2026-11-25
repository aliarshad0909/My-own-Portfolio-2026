export function reconcileThreeWay({ poLines, receiptBySku, invoiceLines, priceTolerancePct = 2 }) {
  const poMap = new Map(poLines.map((l) => [l.sku, l]));
  const discrepancies = [];
  for (const inv of invoiceLines) {
    const po = poMap.get(inv.sku);
    const received = receiptBySku[inv.sku] ?? 0;
    if (!po) { discrepancies.push({ sku: inv.sku, code: "unlisted_on_po" }); continue; }
    if (inv.qty > received) discrepancies.push({ sku: inv.sku, code: "billed_above_received", billed: inv.qty, received });
    const maxAllowedPrice = Math.round(po.unitPriceCents * (1 + priceTolerancePct / 100));
    if (inv.unitPriceCents > maxAllowedPrice) {
      discrepancies.push({ sku: inv.sku, code: "price_variance_exceeded", poCents: po.unitPriceCents, invCents: inv.unitPriceCents });
    }
  }
  return { verdict: discrepancies.length === 0 ? "auto_approve" : "hold_for_ap_review", discrepancies };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(reconcileThreeWay({
    poLines: [{ sku: "VALVE-9", qty: 50, unitPriceCents: 1800 }],
    receiptBySku: { "VALVE-9": 50 },
    invoiceLines: [{ sku: "VALVE-9", qty: 50, unitPriceCents: 1820 }],
  }), null, 2));
}

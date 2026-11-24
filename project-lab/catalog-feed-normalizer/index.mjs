export function isValidEan13(code) {
  const s = String(code || "").replace(/\D/g, "");
  if (s.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === Number(s[12]);
}

export function normalizeCatalogFeed(rows) {
  const seen = new Set();
  const valid = [];
  const rejected = [];
  for (const r of rows) {
    const sku = String(r.sku || "").trim().toUpperCase();
    const errs = [];
    if (!sku) errs.push("missing_sku");
    if (seen.has(sku)) errs.push("duplicate_sku");
    if (r.ean && !isValidEan13(r.ean)) errs.push("invalid_ean13");
    const priceCents = Math.round(Number(String(r.price || "").replace(/[^0-9.]/g, "")) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) errs.push("invalid_price");
    if (errs.length > 0) rejected.push({ sku, errs });
    else { seen.add(sku); valid.push({ sku, title: String(r.title || "").trim().slice(0, 150), priceCents, ean: r.ean || null }); }
  }
  return { valid, rejected };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(normalizeCatalogFeed([{ sku: "mug-01", title: "Stoneware Mug", price: "$24.50", ean: "4006381333931" }]), null, 2));
}

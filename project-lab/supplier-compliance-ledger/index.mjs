export function evaluateSupplierCompliance(supplier, referenceIso = "2026-11-24") {
  const refMs = Date.parse(referenceIso);
  let shipHold = false;
  let penalty = 0;
  const docs = supplier.certificates.map((cert) => {
    const daysLeft = Math.floor((Date.parse(cert.expiresAt) - refMs) / 86_400_000);
    const status = daysLeft < 0 ? "expired" : daysLeft <= 30 ? "critical_30d" : daysLeft <= 60 ? "warn_60d" : "healthy";
    if (status === "expired" && cert.mandatory) { shipHold = true; penalty += 45; }
    else if (status === "critical_30d") penalty += 20;
    else if (status === "warn_60d") penalty += 10;
    return { name: cert.name, mandatory: cert.mandatory, daysLeft, status };
  });
  return { supplier: supplier.name, shipHold, complianceScore: Math.max(0, 100 - penalty), docs };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(evaluateSupplierCompliance({
    name: "Synthetic Factory A",
    certificates: [{ name: "ISO 9001", mandatory: true, expiresAt: "2027-06-01" }, { name: "RoHS", mandatory: true, expiresAt: "2026-12-10" }],
  }), null, 2));
}

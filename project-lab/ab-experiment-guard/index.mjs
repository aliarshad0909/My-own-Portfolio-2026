export function evaluateExperiment({ controlN, controlConv, variantN, variantConv, minPerArm = 500 }) {
  const total = controlN + variantN;
  const expected = total / 2;
  const srmChi2 = ((controlN - expected) ** 2) / expected + ((variantN - expected) ** 2) / expected;
  if (srmChi2 > 10.83) return { status: "invalid_srm", srmChi2: Number(srmChi2.toFixed(2)) };
  if (controlN < minPerArm || variantN < minPerArm) return { status: "underpowered", srmChi2: Number(srmChi2.toFixed(2)) };
  const p1 = controlConv / controlN;
  const p2 = variantConv / variantN;
  const pPool = (controlConv + variantConv) / total;
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlN + 1 / variantN));
  const z = se === 0 ? 0 : (p2 - p1) / se;
  const significant = Math.abs(z) >= 1.96;
  return {
    status: significant ? (z > 0 ? "ship_variant" : "keep_control") : "inconclusive",
    liftPct: Number((((p2 - p1) / Math.max(1e-9, p1)) * 100).toFixed(2)),
    zScore: Number(z.toFixed(2)),
    srmChi2: Number(srmChi2.toFixed(2)),
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(evaluateExperiment({ controlN: 2000, controlConv: 200, variantN: 2020, variantConv: 255 }), null, 2));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng, mean, std) {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + z * std);
}

export function simulateSafetyStock({ dailyMean, dailyStd, leadDaysMean, leadDaysStd, trials = 1500, seed = 42 }) {
  const rng = mulberry32(seed);
  const totals = [];
  for (let i = 0; i < trials; i += 1) {
    const days = Math.max(1, Math.round(normal(rng, leadDaysMean, leadDaysStd)));
    let demand = 0;
    for (let d = 0; d < days; d += 1) demand += normal(rng, dailyMean, dailyStd);
    totals.push(Math.round(demand));
  }
  totals.sort((a, b) => a - b);
  const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
  const p95 = totals[Math.floor(totals.length * 0.95)];
  const p99 = totals[Math.floor(totals.length * 0.99)];
  return { avgLeadDemand: avg, reorderPointP95: p95, safetyStockP95: Math.max(0, p95 - avg), reorderPointP99: p99 };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(simulateSafetyStock({ dailyMean: 18, dailyStd: 5, leadDaysMean: 14, leadDaysStd: 4 }), null, 2));
}

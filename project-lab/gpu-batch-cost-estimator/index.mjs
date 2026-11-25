export function estimateGpuWorkload({ paramsBillions, bitsPerWeight = 4, kvCacheGb = 2.0, vramGb = 24, hoursNeeded = 4, hourlyRateUsd = 0.85 }) {
  const weightsGb = Number(((paramsBillions * bitsPerWeight) / 8).toFixed(2));
  const totalGb = Number((weightsGb + kvCacheGb + 1.5).toFixed(2)); // 1.5 GB CUDA runtime overhead
  const fits = totalGb <= vramGb * 0.92;
  return {
    weightsGb,
    estimatedVramGb: totalGb,
    vramGb,
    fits,
    headroomGb: Number((vramGb - totalGb).toFixed(2)),
    estimatedCostUsd: Number((hoursNeeded * hourlyRateUsd).toFixed(2)),
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(estimateGpuWorkload({ paramsBillions: 14, bitsPerWeight: 4, vramGb: 24, hoursNeeded: 3, hourlyRateUsd: 0.9 }), null, 2));
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

export function planRenditions({ srcWidth, srcHeight, durationSec, maxMobileMb = 2.5 }) {
  const aspect = srcWidth / srcHeight;
  const heights = [1080, 720, 480].filter((h) => h <= srcHeight);
  const bitratesKbps = { 1080: 2600, 720: 1400, 480: 750 };
  return heights.map((h) => {
    const w = even(h * aspect);
    const kbps = bitratesKbps[h] || 900;
    const estMb = Number((((kbps * 1000) / 8) * durationSec / (1024 * 1024)).toFixed(2));
    return {
      label: `${h}p`,
      width: w,
      height: even(h),
      bitrateKbps: kbps,
      estimatedMb: estMb,
      withinMobileBudget: estMb <= maxMobileMb,
      ffmpegArgs: `-vf scale=${w}:${even(h)} -c:v libx264 -pix_fmt yuv420p -movflags +faststart -b:v ${kbps}k`,
    };
  });
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(planRenditions({ srcWidth: 1920, srcHeight: 1080, durationSec: 6 }), null, 2));
}

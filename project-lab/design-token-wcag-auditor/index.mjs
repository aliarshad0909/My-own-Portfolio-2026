function lum(hex) {
  const h = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((s) => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function contrastRatio(fg, bg) {
  const l1 = lum(fg), l2 = lum(bg);
  return Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
}

export function auditCssTokens(cssText, pairs) {
  const vars = {};
  for (const m of cssText.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})/gi)) vars[m[1]] = m[2];
  const results = pairs.map(({ fg, bg, min = 4.5 }) => {
    const ratio = contrastRatio(vars[fg], vars[bg]);
    return { fg, bg, ratio, pass: ratio >= min };
  });
  return { allPass: results.every((r) => r.pass), results };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(auditCssTokens(":root { --bg: #090c11; --text: #f8f5ef; --coral: #ff7a5c; --ink: #140f0d; }", [{ fg: "--text", bg: "--bg" }, { fg: "--ink", bg: "--coral" }]), null, 2));
}

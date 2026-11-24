export function luhnValid(digits) {
  const clean = digits.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0, alt = false;
  for (let i = clean.length - 1; i >= 0; i -= 1) {
    let n = Number(clean[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function redactPii(text) {
  const map = {};
  let idx = 0;
  const token = (kind, val) => {
    const k = `[${kind}_${++idx}]`;
    map[k] = val;
    return k;
  };
  let out = text
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, (m) => token("EMAIL", m))
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, (m) => token("SSN", m))
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, (m) => (luhnValid(m) ? token("CARD", m) : m));
  return { redacted: out, tokenCount: idx, restoreMap: map };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(redactPii("Contact jane.doe@example.com about SSN 123-45-6789."), null, 2));
}

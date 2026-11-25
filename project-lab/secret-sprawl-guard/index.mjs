export function shannonEntropy(str) {
  const counts = {};
  for (const ch of str) counts[ch] = (counts[ch] || 0) + 1;
  let h = 0;
  for (const n of Object.values(counts)) {
    const p = n / str.length;
    h -= p * Math.log2(p);
  }
  return Number(h.toFixed(2));
}

const RULES = [
  { id: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: "stripe-live", re: /\bsk_live_[0-9a-zA-Z]{16,}\b/g },
  { id: "github-pat", re: /\bghp_[0-9a-zA-Z]{20,}\b/g },
  { id: "private-key", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
];

export function scanTextForSecrets(text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.includes("secret-guard:ignore")) return;
    for (const rule of RULES) {
      for (const m of line.matchAll(rule.re)) {
        findings.push({ ruleId: rule.id, line: idx + 1, entropy: shannonEntropy(m[0]) });
      }
    }
  });
  return findings;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify({ sampleFindings: scanTextForSecrets("SAFE_KEY=replace_me\nTEST=AKIA1234567890ABCDEF # secret-guard:ignore") }));
}

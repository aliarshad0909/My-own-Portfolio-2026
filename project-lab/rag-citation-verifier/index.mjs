const tokens = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3));
const nums = (s) => (String(s).match(/\b\d+(?:\.\d+)?\b/g) || []);

export function verifyRagAnswer(answer, sourcesById) {
  const sentences = answer.split(/(?<=[.!?])\s+/).filter(Boolean);
  const checks = sentences.map((sentence) => {
    const ids = [...sentence.matchAll(/\[([a-z0-9_-]+)\]/gi)].map((m) => m[1]);
    if (ids.length === 0) return { sentence, grounded: false, reason: "missing_citation" };
    const corpus = ids.map((id) => sourcesById[id] || "").join(" ");
    const srcNums = new Set(nums(corpus));
    const missingNums = nums(sentence).filter((n) => !srcNums.has(n));
    if (missingNums.length > 0) return { sentence, grounded: false, reason: `unverified_numbers:${missingNums.join(",")}` };
    const sToks = tokens(sentence.replace(/\[[a-z0-9_-]+\]/gi, ""));
    const cToks = tokens(corpus);
    let hits = 0;
    for (const t of sToks) if (cToks.has(t)) hits += 1;
    const overlap = sToks.size === 0 ? 1 : hits / sToks.size;
    return { sentence, grounded: overlap >= 0.4, overlap: Number(overlap.toFixed(2)) };
  });
  return { allGrounded: checks.every((c) => c.grounded), checks };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(verifyRagAnswer("Refunds are accepted within 30 days with receipt [doc-1].", { "doc-1": "Customers may request refunds within 30 days with an original receipt." }), null, 2));
}

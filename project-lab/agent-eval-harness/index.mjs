export function evaluateCase(testCase, output) {
  const text = String(output.text || "").toLowerCase();
  const mustHave = (testCase.requiredTerms || []).filter((t) => !text.includes(t.toLowerCase()));
  const forbiddenHit = (testCase.forbiddenTerms || []).filter((t) => text.includes(t.toLowerCase()));
  const abstentionOk = testCase.expectAbstain ? Boolean(output.abstained) : !output.abstained;
  const passed = mustHave.length === 0 && forbiddenHit.length === 0 && abstentionOk;
  return { id: testCase.id, passed, missingTerms: mustHave, forbiddenHit, abstentionOk };
}

export function runEvalSuite(cases, baselineOutputs, candidateOutputs) {
  const baseResults = cases.map((c) => evaluateCase(c, baselineOutputs[c.id] || {}));
  const candResults = cases.map((c) => evaluateCase(c, candidateOutputs[c.id] || {}));
  const regressions = cases
    .filter((_, i) => baseResults[i].passed && !candResults[i].passed)
    .map((c) => c.id);
  const baseRate = baseResults.filter((r) => r.passed).length / Math.max(1, cases.length);
  const candRate = candResults.filter((r) => r.passed).length / Math.max(1, cases.length);
  return { baseRate, candRate, regressions, candResults };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const suite = [
    { id: "refund-30d", requiredTerms: ["30 days", "original receipt"], forbiddenTerms: ["guaranteed cash"], expectAbstain: false },
    { id: "legal-advice", requiredTerms: [], forbiddenTerms: ["i advise you"], expectAbstain: true },
  ];
  const report = runEvalSuite(
    suite,
    { "refund-30d": { text: "Returns accepted within 30 days with original receipt.", abstained: false }, "legal-advice": { text: "Escalating to human specialist.", abstained: true } },
    { "refund-30d": { text: "Returns accepted within 30 days with original receipt.", abstained: false }, "legal-advice": { text: "Escalating to support team.", abstained: true } },
  );
  console.log(JSON.stringify(report, null, 2));
}

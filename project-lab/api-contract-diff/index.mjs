export function diffOpenApiSpecs(base, candidate) {
  const breaking = [];
  const additive = [];
  for (const [route, methods] of Object.entries(base.paths || {})) {
    for (const [method, spec] of Object.entries(methods)) {
      const next = candidate.paths?.[route]?.[method];
      if (!next) { breaking.push(`Removed endpoint ${method.toUpperCase()} ${route}`); continue; }
      const baseReq = new Set(spec.requiredParams || []);
      for (const p of next.requiredParams || []) {
        if (!baseReq.has(p)) breaking.push(`Newly required param '${p}' on ${method.toUpperCase()} ${route}`);
      }
      const nextResp = new Set(next.responseFields || []);
      for (const f of spec.responseFields || []) {
        if (!nextResp.has(f)) breaking.push(`Removed response field '${f}' on ${method.toUpperCase()} ${route}`);
      }
      for (const f of next.responseFields || []) {
        if (!(spec.responseFields || []).includes(f)) additive.push(`Added response field '${f}' on ${method.toUpperCase()} ${route}`);
      }
    }
  }
  return { hasBreakingChanges: breaking.length > 0, breaking, additive };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(diffOpenApiSpecs(
    { paths: { "/api/v1/skus": { get: { requiredParams: [], responseFields: ["id", "sku"] } } } },
    { paths: { "/api/v1/skus": { get: { requiredParams: [], responseFields: ["id", "sku", "warehouse"] } } } },
  ), null, 2));
}

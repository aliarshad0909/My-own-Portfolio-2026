export function lintPostgresMigration(sql) {
  const issues = [];
  const upper = sql.toUpperCase();
  if (/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!CONCURRENTLY)/.test(upper)) {
    issues.push({ severity: "error", code: "non_concurrent_index", advice: "Use CREATE INDEX CONCURRENTLY to avoid blocking table writes." });
  }
  if (/ALTER\s+TABLE[\s\S]+ADD\s+COLUMN[\s\S]+NOT\s+NULL(?![\s\S]*DEFAULT)/.test(upper)) {
    issues.push({ severity: "error", code: "not_null_without_default", advice: "Add nullable column, backfill, then add NOT VALID check constraint." });
  }
  if (/DROP\s+(TABLE|COLUMN)\b/.test(upper)) {
    issues.push({ severity: "warning", code: "destructive_drop", advice: "Verify no live application code reads this object before dropping." });
  }
  return { safe: issues.every((i) => i.severity !== "error"), issues };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(lintPostgresMigration("CREATE INDEX CONCURRENTLY idx_orders_org ON orders(org_id);"), null, 2));
}

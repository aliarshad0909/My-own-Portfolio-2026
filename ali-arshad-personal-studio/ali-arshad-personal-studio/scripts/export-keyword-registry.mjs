/**
 * Export the typed keyword registry to docs/seo/keyword-registry.csv.
 *
 * The registry in lib/seo/keyword-registry.ts is the source of truth; this CSV
 * is a generated view for spreadsheets and non-technical review. Regenerate it
 * whenever the registry changes:
 *
 *   node --import ./scripts/alias-hook-register.mjs scripts/export-keyword-registry.mjs
 *
 * (run via `npm run seo:csv`).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs", "seo", "keyword-registry.csv");

const columns = [
  "id",
  "keyword",
  "intent",
  "cluster",
  "primary_url",
  "supporting",
  "state",
  "evidence_required",
  "evidence_have",
  "evidence_satisfied",
  "links_to",
  "links_from",
  "notes",
];

/** RFC-4180 quoting: wrap in quotes and double any inner quotes. */
function cell(value) {
  const s = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const rows = KEYWORD_REGISTRY.map((k) => {
  const satisfied = k.evidenceRequired.every((r) => k.evidenceHave.includes(r));
  return [
    k.id,
    k.keyword,
    k.intent,
    k.cluster,
    k.primaryUrl,
    k.supporting ?? [],
    k.state,
    k.evidenceRequired,
    k.evidenceHave,
    satisfied ? "yes" : "no",
    k.linksTo,
    k.linksFrom,
    k.notes ?? "",
  ].map(cell).join(",");
});

const csv = [columns.join(","), ...rows].join("\n") + "\n";
writeFileSync(out, csv, "utf8");
console.log(`Wrote ${KEYWORD_REGISTRY.length} rows to ${path.relative(root, out)}`);

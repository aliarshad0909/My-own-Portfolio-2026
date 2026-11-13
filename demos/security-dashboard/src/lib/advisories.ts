/**
 * Dependency advisory analysis.
 *
 * Input is the JSON from `npm audit --json`, which the user runs themselves.
 * This tool does not resolve packages, contact a registry, or decide whether a
 * version is vulnerable — it reads the report npm produced and makes it
 * legible: severity rollup, which direct dependency pulls each problem in, and
 * what a fix would cost.
 */

import type { Severity } from "./certificate.ts";

export type Advisory = {
  name: string;
  severity: Severity;
  via: string[];
  /** Direct dependencies whose tree contains this package. */
  effects: string[];
  range: string;
  isDirect: boolean;
  fixAvailable: boolean;
  fixIsBreaking: boolean;
  fixVersion: string | null;
  titles: string[];
  urls: string[];
};

export type AuditSummary = {
  advisories: Advisory[];
  counts: Record<Severity, number>;
  totalDependencies: number | null;
  fixable: number;
  breakingFixes: number;
  unfixable: number;
  worst: Severity | null;
};

const SEVERITY_MAP: Record<string, Severity> = {
  critical: "critical", high: "high", moderate: "medium", low: "low", info: "info",
};

const RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4, pass: 5 };

export class AuditError extends Error {}

export function parseAudit(json: string): AuditSummary {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new AuditError(`That is not valid JSON: ${(err as Error).message}`);
  }

  const vulnerabilities = data.vulnerabilities as Record<string, Record<string, unknown>> | undefined;
  if (!vulnerabilities || typeof vulnerabilities !== "object") {
    if (data.advisories) throw new AuditError("This looks like npm 6 audit output. This tool reads npm 7+ format — run `npm audit --json` with a current npm.");
    throw new AuditError("No `vulnerabilities` key found. Paste the output of `npm audit --json`.");
  }

  const advisories: Advisory[] = [];
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    const severity = SEVERITY_MAP[String(entry.severity)] ?? "info";
    const viaRaw = Array.isArray(entry.via) ? entry.via : [];
    const titles: string[] = [];
    const urls: string[] = [];
    const via: string[] = [];
    for (const v of viaRaw) {
      if (typeof v === "string") via.push(v);
      else if (v && typeof v === "object") {
        const o = v as { title?: string; url?: string; name?: string };
        if (o.title) titles.push(o.title);
        if (o.url) urls.push(o.url);
        if (o.name) via.push(o.name);
      }
    }
    const fix = entry.fixAvailable;
    const fixAvailable = fix === true || (fix !== undefined && fix !== false && typeof fix === "object");
    const fixObject = typeof fix === "object" && fix !== null ? (fix as { name?: string; version?: string; isSemVerMajor?: boolean }) : null;

    advisories.push({
      name,
      severity,
      via: [...new Set(via)],
      effects: Array.isArray(entry.effects) ? (entry.effects as string[]) : [],
      range: String(entry.range ?? "*"),
      isDirect: entry.isDirect === true,
      fixAvailable,
      fixIsBreaking: fixObject?.isSemVerMajor === true,
      fixVersion: fixObject?.version ?? null,
      titles,
      urls,
    });
  }

  advisories.sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.name.localeCompare(b.name));

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, pass: 0 } as Record<Severity, number>;
  for (const a of advisories) counts[a.severity]++;

  const metadata = data.metadata as { dependencies?: { total?: number } | number } | undefined;
  const totalDependencies =
    typeof metadata?.dependencies === "number"
      ? metadata.dependencies
      : typeof metadata?.dependencies?.total === "number"
        ? metadata.dependencies.total
        : null;

  return {
    advisories,
    counts,
    totalDependencies,
    fixable: advisories.filter((a) => a.fixAvailable && !a.fixIsBreaking).length,
    breakingFixes: advisories.filter((a) => a.fixAvailable && a.fixIsBreaking).length,
    unfixable: advisories.filter((a) => !a.fixAvailable).length,
    worst: advisories[0]?.severity ?? null,
  };
}

/**
 * Which direct dependencies does each advisory sit under? npm's `effects`
 * chain gives the edges; this walks them to the roots so the user knows what
 * they actually have to upgrade.
 */
export function rootsFor(summary: AuditSummary, name: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  const entry = summary.advisories.find((a) => a.name === name);
  if (!entry) return [];
  if (entry.isDirect || entry.effects.length === 0) return [name];
  const roots = new Set<string>();
  for (const effect of entry.effects) for (const r of rootsFor(summary, effect, seen)) roots.add(r);
  return roots.size > 0 ? [...roots] : [name];
}

/** A sentence a human can act on, rather than a severity count. */
export function recommendation(summary: AuditSummary): string {
  if (summary.advisories.length === 0) return "No advisories in this report.";
  const parts: string[] = [];
  if (summary.fixable > 0) parts.push(`${summary.fixable} can be fixed with \`npm audit fix\``);
  if (summary.breakingFixes > 0) parts.push(`${summary.breakingFixes} need a major-version upgrade`);
  if (summary.unfixable > 0) parts.push(`${summary.unfixable} have no fix published yet`);
  return `${summary.advisories.length} advisor${summary.advisories.length === 1 ? "y" : "ies"}: ${parts.join(", ")}.`;
}

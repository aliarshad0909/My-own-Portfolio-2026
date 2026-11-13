import "./styles.css";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { analyseResponse, type Report } from "./lib/headers.ts";
import { assessCertificate, parseCertificate, SEVERITY_ORDER, type Certificate, type Finding, type Severity } from "./lib/certificate.ts";
import { AuditError, parseAudit, recommendation, rootsFor, type AuditSummary } from "./lib/advisories.ts";
import { SAMPLE_AUDIT, SAMPLE_HEADERS } from "./data/samples.ts";
import { FIXTURE_HISTORY, load, save, seriesFor, targets, trend, type Entry } from "./data/watchlist.ts";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "headers", label: "Response headers" },
  { id: "certificate", label: "Certificate" },
  { id: "dependencies", label: "Dependencies" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info", pass: "Pass",
};

/* ------------------------------------------------------------------ */

function Findings({ findings, testId }: { findings: Finding[]; testId: string }) {
  const [hidePasses, setHidePasses] = useState(false);
  const ordered = useMemo(
    () => [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)),
    [findings],
  );
  const shown = hidePasses ? ordered.filter((f) => f.severity !== "pass") : ordered;

  return (
    <>
      <label className="toggle">
        <input type="checkbox" checked={hidePasses} onChange={(e) => setHidePasses(e.target.checked)} />
        Hide passing checks
      </label>
      <ul className="findings" data-testid={testId}>
        {shown.map((f, i) => (
          <li key={`${f.title}-${i}`} data-severity={f.severity}>
            <span className="sev" data-severity={f.severity}>{SEVERITY_LABEL[f.severity]}</span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.detail}</p>
            </div>
          </li>
        ))}
        {shown.length === 0 ? <li className="empty">Nothing to show with passes hidden.</li> : null}
      </ul>
    </>
  );
}

function CountBar({ counts }: { counts: Record<Severity, number> }) {
  const total = SEVERITY_ORDER.reduce((n, s) => n + counts[s], 0) || 1;
  return (
    <div className="countbar" role="img" aria-label={SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${SEVERITY_LABEL[s].toLowerCase()}`).join(", ")}>
      {SEVERITY_ORDER.map((s) => counts[s] > 0 ? <span key={s} data-severity={s} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${counts[s]} ${SEVERITY_LABEL[s]}`} /> : null)}
    </div>
  );
}

function Grade({ report }: { report: Report }) {
  return (
    <div className="grade" data-testid="grade">
      <div className="grade__letter" data-grade={report.grade}>{report.grade}</div>
      <div className="grade__meta">
        <strong>{report.score} / 100</strong>
        <span>{report.headerCount} header{report.headerCount === 1 ? "" : "s"} parsed{report.status ? ` · HTTP ${report.status}` : ""}</span>
        <CountBar counts={report.counts} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HeadersTab({ onRecord }: { onRecord: (target: string, report: Report) => void }) {
  const [text, setText] = useState(SAMPLE_HEADERS.typical);
  const [target, setTarget] = useState("example-shop.test");
  const [saved, setSaved] = useState<string | null>(null);

  const report = useMemo(() => (text.trim() === "" ? null : analyseResponse(text)), [text]);

  return (
    <section className="stack" aria-labelledby="h-headers">
      <header className="head">
        <h2 id="h-headers">Response headers</h2>
        <p className="lede">
          Paste a response head — <code>curl -sSI https://your-site.example</code>, or copy it from devtools. Analysis happens in this page; nothing is
          sent anywhere and nothing is fetched.
        </p>
      </header>

      <div className="samples">
        <span>Load a sample:</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setText(SAMPLE_HEADERS.hardened)}>Hardened</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setText(SAMPLE_HEADERS.typical)}>Typical</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setText(SAMPLE_HEADERS.bare)}>No headers at all</button>
      </div>

      <label className="field">
        <span>Response head</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} spellCheck={false} data-testid="headers-input" />
      </label>

      {report ? (
        <>
          <Grade report={report} />
          {report.warnings.length > 0 ? (
            <ul className="warnings">{report.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          ) : null}

          <div className="record">
            <label className="field field--inline">
              <span>Record this result against</span>
              <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="a target you own" />
            </label>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => { onRecord(target.trim() || "unnamed target", report); setSaved(target); setTimeout(() => setSaved(null), 2400); }}
            >
              {saved ? "Recorded" : "Add to watchlist"}
            </button>
          </div>

          <Findings findings={report.findings} testId="header-findings" />
        </>
      ) : (
        <p className="muted">Paste a response head above.</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

const SAMPLE_CERT_NOTE = "Paste a PEM certificate. To get one: openssl s_client -connect your-host.example:443 -servername your-host.example </dev/null | openssl x509";

function CertificateTab() {
  const [pem, setPem] = useState("");
  const [hostname, setHostname] = useState("");
  const [result, setResult] = useState<{ cert: Certificate; findings: Finding[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null); setResult(null);
    try {
      const cert = parseCertificate(pem);
      setResult({ cert, findings: assessCertificate(cert, new Date(), hostname.trim() || undefined) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="stack" aria-labelledby="h-cert">
      <header className="head">
        <h2 id="h-cert">Certificate</h2>
        <p className="lede">
          Reads what a certificate asserts: subject, issuer, validity window, key size, signature algorithm and the names it covers. The DER parser is in
          this page — nothing is uploaded.
        </p>
      </header>

      <div className="notice" role="note">
        <strong>What this cannot do.</strong> A page cannot verify a signature chain, reach a trusted root store, or check revocation (OCSP, CRL). Those
        checks need a TLS client. This reads the document and flags what is checkable from the document alone.
      </div>

      <label className="field">
        <span>Certificate (PEM)</span>
        <textarea value={pem} onChange={(e) => { setPem(e.target.value); setError(null); }} rows={10} spellCheck={false}
          placeholder={"-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"} data-testid="cert-input" />
      </label>
      <p className="muted"><code>{SAMPLE_CERT_NOTE}</code></p>

      <div className="record">
        <label className="field field--inline">
          <span>Check it covers (optional)</span>
          <input type="text" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="www.your-host.example" data-testid="cert-host" />
        </label>
        <button type="button" className="btn btn--sm" onClick={run} disabled={pem.trim() === ""}>Analyse certificate</button>
      </div>

      {error ? <p className="failure" role="alert" data-testid="cert-error">{error}</p> : null}

      {result ? (
        <>
          <dl className="facts" data-testid="cert-facts">
            <div><dt>Subject</dt><dd>{result.cert.subjectText}</dd></div>
            <div><dt>Issuer</dt><dd>{result.cert.issuerText}</dd></div>
            <div><dt>Valid from</dt><dd>{result.cert.notBefore.toISOString().replace("T", " ").slice(0, 19)} UTC</dd></div>
            <div><dt>Valid to</dt><dd>{result.cert.notAfter.toISOString().replace("T", " ").slice(0, 19)} UTC</dd></div>
            <div><dt>Key</dt><dd>{result.cert.publicKey.algorithm}{result.cert.publicKey.bits ? ` ${result.cert.publicKey.bits}-bit` : ""}</dd></div>
            <div><dt>Signature</dt><dd>{result.cert.signatureAlgorithm.name}</dd></div>
            <div><dt>Serial</dt><dd className="mono break">{result.cert.serialNumber}</dd></div>
            <div><dt>Names</dt><dd>{result.cert.sans.join(", ") || "none"}</dd></div>
          </dl>
          <Findings findings={result.findings} testId="cert-findings" />
        </>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function DependenciesTab() {
  const [json, setJson] = useState("");
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (value: string) => {
    setError(null); setSummary(null);
    try {
      setSummary(parseAudit(value));
    } catch (err) {
      setError(err instanceof AuditError ? err.message : String(err));
    }
  };

  return (
    <section className="stack" aria-labelledby="h-deps">
      <header className="head">
        <h2 id="h-deps">Dependencies</h2>
        <p className="lede">
          Reads the report from <code>npm audit --json</code>, which you run. This page does not resolve packages, contact a registry or decide what is
          vulnerable — npm did that; this makes the answer legible.
        </p>
      </header>

      <div className="samples">
        <span>Try it:</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setJson(SAMPLE_AUDIT); run(SAMPLE_AUDIT); }}>Load a sample report</button>
      </div>

      <label className="field">
        <span>npm audit JSON</span>
        <textarea value={json} onChange={(e) => { setJson(e.target.value); setError(null); }} rows={8} spellCheck={false} data-testid="audit-input" />
      </label>
      <button type="button" className="btn btn--sm" onClick={() => run(json)} disabled={json.trim() === ""}>Analyse report</button>

      {error ? <p className="failure" role="alert" data-testid="audit-error">{error}</p> : null}

      {summary ? (
        <>
          <div className="summary" data-testid="audit-summary">
            <p className="summary__line">{recommendation(summary)}</p>
            {summary.totalDependencies !== null ? <p className="muted">{summary.totalDependencies.toLocaleString("en-US")} dependencies in the tree.</p> : null}
            <CountBar counts={summary.counts} />
          </div>

          <div className="table-wrap">
            <table className="table" data-testid="audit-table">
              <caption className="sr">Advisories, with severity, the direct dependency that pulls each one in, and whether a fix exists</caption>
              <thead>
                <tr><th scope="col">Package</th><th scope="col">Severity</th><th scope="col">Affected range</th><th scope="col">Pulled in by</th><th scope="col">Fix</th></tr>
              </thead>
              <tbody>
                {summary.advisories.map((a) => (
                  <tr key={a.name}>
                    <th scope="row">
                      <span className="mono">{a.name}</span>
                      {a.titles.length ? <span className="advisory-title">{a.titles[0]}</span> : null}
                    </th>
                    <td><span className="sev" data-severity={a.severity}>{SEVERITY_LABEL[a.severity]}</span></td>
                    <td className="mono">{a.range}</td>
                    <td>{a.isDirect ? <em>direct dependency</em> : rootsFor(summary, a.name).join(", ")}</td>
                    <td>
                      {!a.fixAvailable ? <span className="pill" data-tone="bad">none published</span>
                        : a.fixIsBreaking ? <span className="pill" data-tone="warn">major upgrade{a.fixVersion ? ` → ${a.fixVersion}` : ""}</span>
                        : <span className="pill" data-tone="ok">npm audit fix</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Trend({ series }: { series: Entry[] }) {
  if (series.length < 2) return <p className="muted">One result recorded. Record another to see a trend.</p>;
  const w = 520, h = 120, pad = 10;
  const xs = (i: number) => pad + (i / (series.length - 1)) * (w - pad * 2);
  const ys = (score: number) => h - pad - (score / 100) * (h - pad * 2);
  const path = series.map((e, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(e.score).toFixed(1)}`).join(" ");
  const t = trend(series)!;

  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Score over ${series.length} recorded results, from ${series[0].score} to ${series[series.length - 1].score}`}>
        <line x1={pad} y1={ys(90)} x2={w - pad} y2={ys(90)} className="trend__guide" />
        <path d={path} className="trend__line" />
        {series.map((e, i) => <circle key={e.id} cx={xs(i)} cy={ys(e.score)} r="3.5" className="trend__dot" />)}
      </svg>
      <figcaption>
        {series.length} results · {t.direction === "up" ? `up ${t.delta} points` : t.direction === "down" ? `down ${Math.abs(t.delta)} points` : "unchanged"} since{" "}
        {new Date(series[0].at).toISOString().slice(0, 10)}
      </figcaption>
      <table className="sr">
        <caption>Recorded scores</caption>
        <tbody>{series.map((e) => <tr key={e.id}><th scope="row">{new Date(e.at).toISOString().slice(0, 10)}</th><td>{e.score}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

function Overview({ entries, durable, onClear }: { entries: Entry[]; durable: boolean; onClear: () => void }) {
  const names = targets(entries);
  const [selected, setSelected] = useState(names[0] ?? "");
  const active = names.includes(selected) ? selected : names[0] ?? "";
  const series = seriesFor(entries, active);
  const latest = series[series.length - 1];

  return (
    <section className="stack" aria-labelledby="h-overview">
      <header className="head">
        <h2 id="h-overview">Watchlist</h2>
        <p className="lede">
          Results you have recorded, so a grade can be tracked over time. Every entry exists because someone pasted a response into this page — nothing is
          scanned, polled or fetched.
        </p>
      </header>

      <div className="notice notice--scope" role="note">
        <strong>Scope.</strong> This tool analyses data you provide about systems you are responsible for. It performs no network reconnaissance, no port
        scanning and no probing of third-party infrastructure.
      </div>

      {!durable ? <p className="warnings">Browser storage is unavailable here, so this watchlist lasts until you reload.</p> : null}

      {names.length === 0 ? (
        <p className="muted">Nothing recorded yet. Analyse a response head and add it to the watchlist.</p>
      ) : (
        <>
          <div className="tabs tabs--inline" role="group" aria-label="Targets">
            {names.map((n) => (
              <button key={n} type="button" className="chip" aria-pressed={n === active} onClick={() => setSelected(n)}>
                {n}{entries.find((e) => e.target === n)?.source === "fixture" ? <span className="chip__flag">fixture</span> : null}
              </button>
            ))}
          </div>

          {latest ? (
            <div className="latest" data-testid="latest">
              <div className="grade__letter" data-grade={latest.grade}>{latest.grade}</div>
              <div>
                <strong>{latest.score} / 100</strong>
                <p className="muted">Last recorded {new Date(latest.at).toISOString().slice(0, 10)}{latest.source === "fixture" ? " · invented example data" : ""}</p>
                <CountBar counts={latest.counts} />
              </div>
            </div>
          ) : null}

          <Trend series={series} />

          <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>Clear recorded results</button>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function App() {
  const [tab, setTab] = useState<TabId>("overview");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [durable, setDurable] = useState(true);

  useEffect(() => {
    const { entries: saved, durable: ok } = load();
    setDurable(ok);
    setEntries(saved.length > 0 ? saved : FIXTURE_HISTORY);
  }, []);

  const record = (target: string, report: Report) => {
    const entry: Entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      target, at: Date.now(), score: report.score, grade: report.grade, counts: report.counts, source: "pasted",
    };
    setEntries((prev) => { const next = [...prev, entry]; save(next); return next; });
    setTab("overview");
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <header className="top">
        <div className="shell top__inner">
          <h1 className="brand">
            <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
              <path d="M16 3l11 4v9c0 7-4.6 11.4-11 13-6.4-1.6-11-6-11-13V7z" fill="none" stroke="#6ea8ff" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M11 16.2l3.5 3.4L21.5 13" fill="none" stroke="#6ea8ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sentryline
          </h1>
          <p className="tagline">Defensive analysis of data you supply</p>
        </div>
        <nav className="tabs" aria-label="Sections">
          <div className="shell tabs__inner">
            {TABS.map((t) => (
              <button key={t.id} type="button" className="tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="main" className="shell">
        {tab === "overview" ? <Overview entries={entries} durable={durable} onClear={() => { setEntries([]); save([]); }} /> : null}
        {tab === "headers" ? <HeadersTab onRecord={record} /> : null}
        {tab === "certificate" ? <CertificateTab /> : null}
        {tab === "dependencies" ? <DependenciesTab /> : null}
      </main>

      <footer className="foot">
        <div className="shell">
          <p>
            Sentryline analyses data you paste in. It does not scan hosts, probe ports, enumerate subdomains or contact any third party, and it sends
            nothing off this page. Use it on systems you are responsible for.
          </p>
          <p>The watchlist history for <code>example-shop.test</code> is invented sample data, labelled as such wherever it appears.</p>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

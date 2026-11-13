import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { MESSAGES, ORDERS, QUOTES, RFQS, SHIPMENTS, SUPPLIERS, TODAY } from "./data/seed.ts";
import { FREIGHT_RATES, calculateLandedCost, dutyRateFor } from "./lib/landed-cost.ts";
import { WEIGHTS, milestoneVariance, scoreQuotes, shipmentProgress, supplierRisk } from "./lib/sourcing.ts";
import type { Incoterm, RFQ, ShipMode } from "./lib/types.ts";
import "./styles.css";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;

const TABS = ["Sourcing requests", "Compare quotes", "Landed cost", "Shipments", "Suppliers", "Messages"] as const;
type Tab = (typeof TABS)[number];

const SHIPPING_PER_UNIT: Record<string, { weightKgPerUnit: number; cbmPerUnit: number }> = {
  Ceramics: { weightKgPerUnit: 0.42, cbmPerUnit: 0.0021 },
  "Home office": { weightKgPerUnit: 0.75, cbmPerUnit: 0.0045 },
  Lighting: { weightKgPerUnit: 1.9, cbmPerUnit: 0.0123 },
};

function App() {
  const [tab, setTab] = useState<Tab>("Sourcing requests");
  const [rfqId, setRfqId] = useState(RFQS[0].id);
  const [mode, setMode] = useState<ShipMode>("sea_lcl");
  const rfq = RFQS.find((r) => r.id === rfqId) ?? RFQS[0];
  const shipping = SHIPPING_PER_UNIT[rfq.category] ?? { weightKgPerUnit: 0.5, cbmPerUnit: 0.003 };
  const scored = useMemo(() => scoreQuotes(rfq, QUOTES, SUPPLIERS, mode, shipping, TODAY), [rfq, mode, shipping]);

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration.</strong> Lantern Sourcing is a fictional agency. Suppliers, quotes and shipments are invented, and freight and duty use <strong>indicative rates, not live lookups</strong>.
      </p>
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Lantern Sourcing</h1>
            <p>China procurement desk · {TODAY}</p>
          </div>
        </div>
        <dl className="headline">
          <div><dt>Open RFQs</dt><dd>{RFQS.filter((r) => r.status !== "closed").length}</dd></div>
          <div><dt>Quotes in</dt><dd>{QUOTES.length}</dd></div>
          <div><dt>Suppliers</dt><dd>{SUPPLIERS.length}</dd></div>
          <div><dt>In transit</dt><dd>{SHIPMENTS.filter((s) => shipmentProgress(s, TODAY).status === "in_transit").length}</dd></div>
        </dl>
      </header>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t} type="button" className={`tab ${tab === t ? "is-on" : ""}`} aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      <main id="main" tabIndex={-1}>
        {tab !== "Suppliers" && tab !== "Shipments" && tab !== "Messages" ? (
          <div className="context">
            <label className="field">
              <span>Sourcing request</span>
              <select value={rfqId} onChange={(e: { target: { value: string } }) => setRfqId(e.target.value)}>
                {RFQS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.product}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Shipping mode</span>
              <select value={mode} onChange={(e: { target: { value: string } }) => setMode(e.target.value as ShipMode)}>
                {(Object.keys(FREIGHT_RATES) as ShipMode[]).map((m) => (
                  <option key={m} value={m}>
                    {FREIGHT_RATES[m].label} · ~{FREIGHT_RATES[m].transitDays}d transit
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {tab === "Sourcing requests" ? <Requests rfq={rfq} onOpen={(id) => { setRfqId(id); setTab("Compare quotes"); }} /> : null}
        {tab === "Compare quotes" ? <Compare rfq={rfq} scored={scored} mode={mode} /> : null}
        {tab === "Landed cost" ? <Calculator rfq={rfq} mode={mode} shipping={shipping} /> : null}
        {tab === "Shipments" ? <Shipments /> : null}
        {tab === "Suppliers" ? <Suppliers /> : null}
        {tab === "Messages" ? <Messages /> : null}
      </main>

      <footer className="foot">
        <p>
          <strong>What is real here.</strong> The landed-cost maths, the quote scoring and the milestone variance are genuine calculations you can check. The freight rates, duty percentages, suppliers and quotes are invented for the demonstration.
        </p>
        <p>
          <strong>What a live version needs.</strong> Freight is quoted per shipment by a forwarder, not read from a table. Duty depends on the exact tariff classification, origin and any trade agreement, and classification is the importer&rsquo;s legal responsibility. Some products cannot be exported or imported at all, or need licences, testing or certification — feasibility has to be confirmed before anything is committed.
        </p>
        <p>Built by Ali Arshad as a portfolio demonstration.</p>
      </footer>
    </>
  );
}

function Requests({ rfq, onOpen }: { rfq: RFQ; onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby="rfq-title">
      <h2 id="rfq-title">Sourcing requests</h2>
      <div className="cards">
        {RFQS.map((r) => {
          const quotes = QUOTES.filter((q) => q.rfqId === r.id);
          return (
            <article key={r.id} className={`card ${r.id === rfq.id ? "is-active" : ""}`}>
              <header>
                <div>
                  <h3>{r.product}</h3>
                  <p className="muted mono">{r.id} · {r.category}</p>
                </div>
                <span className={`status status--${r.status}`}>{r.status}</span>
              </header>
              <dl className="mini">
                <div><dt>Quantity</dt><dd>{num(r.quantity)}</dd></div>
                <div><dt>Destination</dt><dd>{r.destination}</dd></div>
                <div><dt>HS code</dt><dd>{r.hsCode} · duty {pct(dutyRateFor(r.hsCode))}</dd></div>
                <div><dt>Need by</dt><dd>{r.needBy}</dd></div>
                <div><dt>Target unit</dt><dd>{r.targetUnitCost ? money(r.targetUnitCost) : "—"}</dd></div>
                <div><dt>Quotes</dt><dd>{quotes.length}</dd></div>
              </dl>
              <details>
                <summary>Specification</summary>
                <ul className="spec">
                  {r.spec.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </details>
              <button type="button" className="btn btn--sm" onClick={() => onOpen(r.id)}>
                Compare {quotes.length} quote{quotes.length === 1 ? "" : "s"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Compare({ rfq, scored, mode }: { rfq: RFQ; scored: ReturnType<typeof scoreQuotes>; mode: ShipMode }) {
  const [open, setOpen] = useState<string | null>(scored[0]?.quote.id ?? null);
  if (scored.length === 0) return <p className="muted">No quotes have come in for this request yet.</p>;
  const best = scored[0];
  const cheapest = [...scored].sort((a, b) => a.perUnit - b.perUnit)[0];

  return (
    <section aria-labelledby="cmp-title">
      <div className="head">
        <div>
          <h2 id="cmp-title">Quote comparison — {rfq.product}</h2>
          <p className="muted">
            {num(rfq.quantity)} units to {rfq.destination} by {FREIGHT_RATES[mode].label}. Ranked on landed cost per unit, lead time and supplier record — weighting shown in each row.
          </p>
        </div>
      </div>

      {best.quote.id !== cheapest.quote.id ? (
        <p className="insight">
          <strong>{cheapest.supplier.name}</strong> is cheapest at {money(cheapest.perUnit)} per unit landed, but ranks below <strong>{best.supplier.name}</strong> at {money(best.perUnit)} once {cheapest.belowMoq ? "the minimum order quantity" : "supplier record"} and delivery are weighed in.
        </p>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Quotes for {rfq.id}</caption>
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col">Incoterm</th>
              <th scope="col" className="num">Unit price</th>
              <th scope="col" className="num">Landed / unit</th>
              <th scope="col" className="num">Total landed</th>
              <th scope="col" className="num">Lead</th>
              <th scope="col">Est. arrival</th>
              <th scope="col" className="num">Score</th>
              <th scope="col"><span className="sr">Detail</span></th>
            </tr>
          </thead>
          <tbody>
            {scored.map((s, i) => (
              <tr key={s.quote.id} className={i === 0 ? "is-best" : ""}>
                <th scope="row">
                  {s.supplier.name}
                  <small>
                    {s.supplier.city}
                    {s.belowMoq ? <span className="flag"> below MOQ of {num(s.quote.moq)}</span> : null}
                    {s.expired ? <span className="flag"> quote expired</span> : null}
                  </small>
                </th>
                <td><span className="term">{s.quote.incoterm}</span></td>
                <td className="num">{money(s.quote.unitPrice)}</td>
                <td className="num strong">{money(s.perUnit)}</td>
                <td className="num">{money(s.landed.total)}</td>
                <td className="num">{s.quote.leadTimeDays}d</td>
                <td className="mono">{s.arrival}</td>
                <td className="num"><span className={`score score--${s.score >= 70 ? "hi" : s.score >= 50 ? "mid" : "lo"}`}>{s.score}</span></td>
                <td>
                  <button type="button" className="btn btn--sm btn--ghost" aria-expanded={open === s.quote.id} onClick={() => setOpen(open === s.quote.id ? null : s.quote.id)}>
                    Detail<span className="sr"> for {s.supplier.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        (() => {
          const s = scored.find((x) => x.quote.id === open);
          if (!s) return null;
          const risk = supplierRisk(s.supplier);
          return (
            <div className="panel two">
              <div>
                <h3>Cost build-up — {s.supplier.name}</h3>
                <table className="table table--inner">
                  <caption className="sr">Landed cost build-up</caption>
                  <tbody>
                    <tr><th scope="row">Goods ({num(rfq.quantity)} × {money(s.quote.unitPrice)})</th><td className="num">{money(s.landed.goods)}</td></tr>
                    <tr><th scope="row">Tooling / samples</th><td className="num">{money(s.landed.tooling)}</td></tr>
                    <tr><th scope="row">Freight ({FREIGHT_RATES[mode].label})</th><td className="num">{s.landed.freight === 0 ? <em>in {s.quote.incoterm}</em> : money(s.landed.freight)}</td></tr>
                    <tr><th scope="row">Insurance</th><td className="num">{s.landed.insurance === 0 ? <em>in {s.quote.incoterm}</em> : money(s.landed.insurance)}</td></tr>
                    <tr><th scope="row">Duty ({pct(s.landed.dutyRate)} of goods)</th><td className="num">{s.landed.duty === 0 ? <em>in {s.quote.incoterm}</em> : money(s.landed.duty)}</td></tr>
                    <tr><th scope="row">Brokerage &amp; handling</th><td className="num">{s.landed.brokerage === 0 ? <em>in {s.quote.incoterm}</em> : money(s.landed.brokerage)}</td></tr>
                    <tr><th scope="row">Inland delivery</th><td className="num">{s.landed.inland === 0 ? <em>in {s.quote.incoterm}</em> : money(s.landed.inland)}</td></tr>
                    <tr className="total"><th scope="row">Total landed</th><td className="num">{money(s.landed.total)}</td></tr>
                    <tr className="total"><th scope="row">Per unit</th><td className="num">{money(s.perUnit)}</td></tr>
                  </tbody>
                </table>
                {rfq.targetUnitCost ? (
                  <p className={s.perUnit <= rfq.targetUnitCost ? "ok" : "over"}>
                    {s.perUnit <= rfq.targetUnitCost ? "Within" : "Over"} the {money(rfq.targetUnitCost)} target by {money(Math.abs(s.perUnit - rfq.targetUnitCost))} per unit.
                  </p>
                ) : null}
              </div>
              <div>
                <h3>Why it scored {s.score}</h3>
                <ul className="breakdown">
                  {s.breakdown.map((b) => (
                    <li key={b.label}>
                      <span>{b.label}</span>
                      <span className="track">
                        <span style={{ width: `${b.outOf > 0 ? (b.points / b.outOf) * 100 : 100}%` }} className={b.points < 0 ? "is-neg" : ""} />
                      </span>
                      <span className="mono">{b.points > 0 ? "+" : ""}{b.points}{b.outOf > 0 ? `/${b.outOf}` : ""}</span>
                    </li>
                  ))}
                </ul>
                <p className="muted">Weighting: cost {WEIGHTS.cost}, lead time {WEIGHTS.speed}, quality {WEIGHTS.quality}, on-time {WEIGHTS.reliability}, responsiveness {WEIGHTS.responsiveness}.</p>
                <h3>Supplier risk</h3>
                <p className={`risk risk--${risk.level}`}>{risk.level} risk</p>
                {risk.reasons.length > 0 ? (
                  <ul className="spec">
                    {risk.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Verified, audited, and a strong delivery record.</p>
                )}
                <p className="quote-note">&ldquo;{s.quote.notes}&rdquo;</p>
              </div>
            </div>
          );
        })()
      ) : null}
    </section>
  );
}

function Calculator({ rfq, mode, shipping }: { rfq: RFQ; mode: ShipMode; shipping: { weightKgPerUnit: number; cbmPerUnit: number } }) {
  const [qty, setQty] = useState(String(rfq.quantity));
  const [price, setPrice] = useState("2.68");
  const [incoterm, setIncoterm] = useState<Incoterm>("FOB");
  const [tooling, setTooling] = useState("850");
  const [hs, setHs] = useState(rfq.hsCode);

  const quantity = Math.max(0, Math.floor(Number(qty) || 0));
  const unitPrice = Math.round((Number(price) || 0) * 100);
  const result = calculateLandedCost({
    quantity, unitPrice, incoterm, mode,
    weightKg: quantity * shipping.weightKgPerUnit,
    cbm: quantity * shipping.cbmPerUnit,
    hsCode: hs,
    toolingCost: Math.round((Number(tooling) || 0) * 100),
  });
  const parts = [
    ["Goods", result.goods],
    ["Tooling", result.tooling],
    ["Freight", result.freight],
    ["Insurance", result.insurance],
    ["Duty", result.duty],
    ["Brokerage", result.brokerage],
    ["Inland", result.inland],
  ] as const;
  const max = Math.max(...parts.map(([, v]) => v), 1);

  return (
    <section aria-labelledby="calc-title">
      <div className="head">
        <div>
          <h2 id="calc-title">Landed cost calculator</h2>
          <p className="muted">Change any input and the build-up recalculates. Freight follows the mode selected above.</p>
        </div>
      </div>
      <div className="panel two">
        <form className="form-grid" onSubmit={(e: { preventDefault(): void }) => e.preventDefault()}>
          <label className="field">
            <span>Quantity</span>
            <input name="qty" inputMode="numeric" value={qty} onChange={(e: { target: { value: string } }) => setQty(e.target.value)} />
          </label>
          <label className="field">
            <span>Unit price (USD)</span>
            <input name="price" inputMode="decimal" value={price} onChange={(e: { target: { value: string } }) => setPrice(e.target.value)} />
          </label>
          <label className="field">
            <span>Incoterm</span>
            <select name="incoterm" value={incoterm} onChange={(e: { target: { value: string } }) => setIncoterm(e.target.value as Incoterm)}>
              {(["EXW", "FOB", "CIF", "DDP"] as Incoterm[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tooling (USD, one-off)</span>
            <input name="tooling" inputMode="decimal" value={tooling} onChange={(e: { target: { value: string } }) => setTooling(e.target.value)} />
          </label>
          <label className="field">
            <span>HS code</span>
            <input name="hs" value={hs} onChange={(e: { target: { value: string } }) => setHs(e.target.value)} />
            <small>Duty applied: {pct(result.dutyRate)}</small>
          </label>
          <p className="muted span2">
            Shipping volume is estimated from the product category: {shipping.weightKgPerUnit} kg and {shipping.cbmPerUnit} CBM per unit, so {num(quantity)} units is about {(quantity * shipping.cbmPerUnit).toFixed(1)} CBM.
          </p>
        </form>

        <div>
          <p className="big">
            {money(result.perUnit)} <small>landed per unit</small>
          </p>
          <p className="muted">{money(result.total)} total for {num(quantity)} units</p>
          {result.includedByIncoterm.length > 0 ? (
            <p className="note">{incoterm} already covers {result.includedByIncoterm.join(", ").toLowerCase()}, so those lines are zero rather than double-charged.</p>
          ) : null}
          <ul className="breakdown">
            {parts.map(([label, v]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="track"><span style={{ width: `${(v / max) * 100}%` }} /></span>
                <span className="mono">{money(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Shipments() {
  return (
    <section aria-labelledby="shp-title">
      <h2 id="shp-title">Shipments</h2>
      {SHIPMENTS.map((s) => {
        const p = shipmentProgress(s, TODAY);
        const variance = milestoneVariance(s);
        const po = ORDERS.find((o) => o.id === s.poId);
        const supplier = SUPPLIERS.find((x) => x.id === s.supplierId);
        const drift = variance.length > 0 ? variance[variance.length - 1].days : 0;
        return (
          <article key={s.id} className="panel">
            <div className="head">
              <div>
                <h3 className="mono">{s.id}</h3>
                <p className="muted">
                  {supplier?.name} · {FREIGHT_RATES[s.mode].label} · {s.containers} container · {s.cbm} CBM · {num(s.weightKg)} kg
                </p>
              </div>
              <span className={`status status--${p.status}`}>{p.status.replace("_", " ")}</span>
            </div>
            <div className="progress">
              <div className="progress__bar" aria-hidden="true">
                <span style={{ width: `${(p.completed / p.total) * 100}%` }} />
              </div>
              <p className="muted">
                {p.completed} of {p.total} milestones. Next: <strong>{p.next?.label}</strong> planned {p.next?.plannedAt}
                {drift > 0 ? ` · running ${drift} day${drift === 1 ? "" : "s"} behind plan` : drift < 0 ? ` · running ${-drift} days early` : " · on plan"}.
              </p>
            </div>
            <ol className="timeline">
              {s.milestones.map((m) => {
                const v = m.actualAt ? Math.round((Date.parse(`${m.actualAt}T00:00:00Z`) - Date.parse(`${m.plannedAt}T00:00:00Z`)) / 86400000) : null;
                return (
                  <li key={m.label} className={m.actualAt ? "is-done" : ""}>
                    <span className="dot" aria-hidden="true" />
                    <span className="timeline__label">{m.label}</span>
                    <span className="timeline__dates mono">
                      plan {m.plannedAt}
                      {m.actualAt ? ` · actual ${m.actualAt}` : ""}
                    </span>
                    {v !== null && v !== 0 ? <span className={v > 0 ? "late" : "early"}>{v > 0 ? `+${v}d` : `${v}d`}</span> : null}
                  </li>
                );
              })}
            </ol>
            {po ? <p className="muted">Against {po.id} · {num(po.quantity)} units at {money(po.unitPrice)} {po.incoterm}</p> : null}
          </article>
        );
      })}
    </section>
  );
}

function Suppliers() {
  return (
    <section aria-labelledby="sup-title">
      <h2 id="sup-title">Suppliers</h2>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Supplier directory</caption>
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col">City</th>
              <th scope="col" className="num">Years</th>
              <th scope="col">Audit</th>
              <th scope="col" className="num">Quality</th>
              <th scope="col" className="num">On time</th>
              <th scope="col" className="num">Replies in</th>
              <th scope="col">Risk</th>
            </tr>
          </thead>
          <tbody>
            {SUPPLIERS.map((s) => {
              const risk = supplierRisk(s);
              return (
                <tr key={s.id}>
                  <th scope="row">
                    {s.name}
                    <small>{s.verified ? "Verified" : "Not verified"}</small>
                  </th>
                  <td>{s.city}</td>
                  <td className="num">{s.yearsTrading}</td>
                  <td>{s.audit === "none" ? <span className="muted">none</span> : s.audit}</td>
                  <td className="num">{pct(s.qualityRate)}</td>
                  <td className="num">{pct(s.onTimeRate)}</td>
                  <td className="num">{s.responseHours}h</td>
                  <td>
                    <span className={`risk risk--${risk.level}`} title={risk.reasons.join("; ")}>{risk.level}</span>
                    {risk.reasons.length > 0 ? <small>{risk.reasons[0]}</small> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">Quality, on-time and response figures are seeded history for the demonstration. A live desk would calculate them from its own order record.</p>
    </section>
  );
}

function Messages() {
  const [supplier, setSupplier] = useState("");
  const list = MESSAGES.filter((m) => !supplier || m.supplierId === supplier);
  return (
    <section aria-labelledby="msg-title">
      <div className="head">
        <h2 id="msg-title">Supplier correspondence</h2>
        <label className="field">
          <span>Supplier</span>
          <select value={supplier} onChange={(e: { target: { value: string } }) => setSupplier(e.target.value)}>
            <option value="">All</option>
            {SUPPLIERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ol className="thread">
        {list.map((m) => (
          <li key={m.id} className={`msg msg--${m.direction}`}>
            <header>
              <strong>{m.direction === "out" ? "To" : "From"} {SUPPLIERS.find((s) => s.id === m.supplierId)?.name}</strong>
              <span className="mono muted">{m.at} · {m.rfqId}</span>
            </header>
            <p className="msg__subject">{m.subject}</p>
            <p>{m.body}</p>
          </li>
        ))}
      </ol>
      <p className="muted">A record kept against each RFQ so quotes, samples and commitments stay traceable. Nothing is emailed from this demo.</p>
    </section>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);

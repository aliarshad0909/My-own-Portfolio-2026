import { useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { ITEMS, SUPPLIERS, TODAY, seed } from "./data/seed.ts";
import { balances, post, transfer, valuation, withRunningBalance } from "./lib/ledger.ts";
import { createDraft, deriveStatus, poOutstanding, poValue, receive, reorderSuggestions } from "./lib/purchasing.ts";
import { abcAnalysis, movementSummary, stockReport, supplierReport } from "./lib/reports.ts";
import { ADJUSTMENT_REASONS, type Movement, type PurchaseOrder, type Warehouse } from "./lib/types.ts";
import "./styles.css";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (c: number) => (Math.abs(c) >= 100000 ? `$${(c / 100000).toFixed(1)}K` : money(c));
const num = (n: number) => n.toLocaleString("en-US");
const day = (iso: string) => iso.slice(0, 10);

const TABS = ["Inventory", "Purchase orders", "Receiving", "Suppliers", "Ledger", "Reports"] as const;
type Tab = (typeof TABS)[number];

const initial = seed();

function App() {
  const [movements, setMovements] = useState<Movement[]>(initial.movements);
  const [orders, setOrders] = useState<PurchaseOrder[]>(initial.orders);
  const [tab, setTab] = useState<Tab>("Inventory");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const say = (m: string) => { setToast(m); setError(""); setTimeout(() => setToast(""), 3600); };
  const fail = (m: string) => { setError(m); setToast(""); };

  const bal = useMemo(() => balances(movements), [movements]);
  const rows = useMemo(() => stockReport(ITEMS, movements, TODAY, orders), [movements, orders]);
  const abc = useMemo(() => abcAnalysis(rows), [rows]);
  const suggestions = useMemo(() => reorderSuggestions(ITEMS, bal, orders), [bal, orders]);
  const value = useMemo(() => valuation(movements, ITEMS), [movements]);
  const summary = useMemo(() => movementSummary(movements, 30, TODAY), [movements]);

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration.</strong> Meridian Works is a fictional manufacturer. All stock, suppliers and orders are synthetic data held in this browser.
      </p>
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Meridian Works</h1>
            <p>Inventory &amp; procurement · {TODAY}</p>
          </div>
        </div>
        <dl className="headline">
          <div>
            <dt>Stock value</dt>
            <dd>{compact(value.total)}</dd>
          </div>
          <div>
            <dt>Below reorder</dt>
            <dd className={suggestions.length > 0 ? "warn" : ""}>{suggestions.length}</dd>
          </div>
          <div>
            <dt>Open POs</dt>
            <dd>{orders.filter((o) => o.status === "sent" || o.status === "partial").length}</dd>
          </div>
          <div>
            <dt>Movements</dt>
            <dd>{num(movements.length)}</dd>
          </div>
        </dl>
      </header>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t} type="button" className={`tab ${tab === t ? "is-on" : ""}`} aria-current={tab === t ? "page" : undefined} onClick={() => { setTab(t); setError(""); }}>
            {t}
            {t === "Purchase orders" && suggestions.length > 0 ? <span className="dot" aria-label={`${suggestions.length} items need reordering`} /> : null}
          </button>
        ))}
      </nav>

      <main id="main" tabIndex={-1}>
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}

        {tab === "Inventory" ? <Inventory rows={rows} abc={abc} movements={movements} setMovements={setMovements} say={say} fail={fail} /> : null}
        {tab === "Purchase orders" ? <Orders orders={orders} setOrders={setOrders} suggestions={suggestions} say={say} /> : null}
        {tab === "Receiving" ? <Receiving orders={orders} setOrders={setOrders} movements={movements} setMovements={setMovements} say={say} fail={fail} /> : null}
        {tab === "Suppliers" ? <Suppliers orders={orders} /> : null}
        {tab === "Ledger" ? <Ledger movements={movements} /> : null}
        {tab === "Reports" ? <Reports rows={rows} abc={abc} value={value} summary={summary} /> : null}
      </main>

      {toast ? (
        <p className="toast" role="status">
          {toast}
        </p>
      ) : null}

      <footer className="foot">
        <p>
          <strong>How stock is counted.</strong> On-hand is never stored. Every receipt, issue, adjustment and transfer is appended to a movement ledger, and the balance is the sum of those movements — so the ledger and the stock figure can never disagree. Nothing may drive a balance negative, and a transfer is posted as a matched pair so stock is never created or destroyed.
        </p>
        <p>Built by Ali Arshad as a portfolio demonstration. No server, no database, no tracking.</p>
      </footer>
    </>
  );
}

type Say = (m: string) => void;

function Inventory({ rows, abc, movements, setMovements, say, fail }: { rows: ReturnType<typeof stockReport>; abc: Map<string, "A" | "B" | "C">; movements: Movement[]; setMovements: (m: Movement[]) => void; say: Say; fail: Say }) {
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [adjust, setAdjust] = useState<string | null>(null);
  const [form, setForm] = useState({ qty: "", reason: ADJUSTMENT_REASONS[0] as string, warehouse: "MAIN" as Warehouse });
  const [move, setMove] = useState({ qty: "", from: "MAIN" as Warehouse, to: "WEST" as Warehouse });

  const list = rows.filter((r) => (!lowOnly || r.belowReorder) && `${r.item.sku} ${r.item.name} ${r.item.category}`.toLowerCase().includes(q.toLowerCase()));
  const covered = rows.filter((r) => r.belowReorder && !r.needsOrder).length;

  const submitAdjust = (e: FormEvent, sku: string) => {
    e.preventDefault();
    const qty = Number(form.qty);
    if (!Number.isInteger(qty) || qty === 0) return fail("Enter a whole number other than zero. Use a minus sign to reduce stock.");
    const r = post(movements, { at: `${TODAY}T12:00:00Z`, sku, warehouse: form.warehouse, type: "adjustment", qty, reference: form.reason.toUpperCase().replace(/\s+/g, "-"), note: form.reason });
    if (!r.ok) return fail(r.error);
    setMovements(r.movements);
    setAdjust(null);
    setForm({ qty: "", reason: ADJUSTMENT_REASONS[0], warehouse: "MAIN" });
    say(`Adjusted ${sku} by ${qty > 0 ? "+" : ""}${qty} (${form.reason}).`);
  };

  const submitMove = (e: FormEvent, sku: string) => {
    e.preventDefault();
    const qty = Number(move.qty);
    if (!Number.isInteger(qty) || qty <= 0) return fail("Enter a positive whole number to transfer.");
    const r = transfer(movements, sku, move.from, move.to, qty, `${TODAY}T12:00:00Z`, `TR-${Date.now().toString(36).toUpperCase()}`);
    if (!r.ok) return fail(r.error);
    setMovements(r.movements);
    setAdjust(null);
    setMove({ qty: "", from: "MAIN", to: "WEST" });
    say(`Transferred ${qty} ${sku} from ${move.from} to ${move.to}.`);
  };

  return (
    <section aria-labelledby="inv-title">
      <div className="head">
        <h2 id="inv-title">Inventory</h2>
        <div className="filters">
          <label>
            <span className="sr">Search items</span>
            <input type="search" placeholder="Search SKU, name or category" value={q} onChange={(e: { target: { value: string } }) => setQ(e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={lowOnly} onChange={() => setLowOnly(!lowOnly)} />
            <span>Below reorder only</span>
          </label>
        </div>
      </div>
      <p className="muted" role="status">
        {list.length} of {rows.length} items
        {covered > 0 ? ` · ${covered} below reorder point but already covered by an open order` : ""}
      </p>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Inventory by SKU</caption>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Item</th>
              <th scope="col">ABC</th>
              <th scope="col" className="num">MAIN</th>
              <th scope="col" className="num">WEST</th>
              <th scope="col" className="num">Total</th>
              <th scope="col" className="num">On order</th>
              <th scope="col" className="num">Reorder pt</th>
              <th scope="col" className="num">Cover</th>
              <th scope="col" className="num">Value</th>
              <th scope="col"><span className="sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.item.sku} className={r.needsOrder ? "is-low" : r.belowReorder ? "is-covered" : ""}>
                <th scope="row" className="mono">{r.item.sku}</th>
                <td>
                  {r.item.name}
                  <small>{r.item.category} · {r.item.uom}</small>
                </td>
                <td><span className={`abc abc--${abc.get(r.item.sku)}`}>{abc.get(r.item.sku)}</span></td>
                <td className="num">{num(r.main)}</td>
                <td className="num">{num(r.west)}</td>
                <td className="num strong">{num(r.total)}</td>
                <td className="num">{r.onOrder > 0 ? <span className="oo" title={`${r.onOrder} on open purchase orders`}>{num(r.onOrder)}</span> : <span className="muted">—</span>}</td>
                <td className="num">{num(r.item.reorderPoint)}</td>
                <td className="num">{r.daysCover === null ? <span className="muted">—</span> : <span className={r.daysCover < 20 ? "warn" : ""}>{r.daysCover}d</span>}</td>
                <td className="num">{money(r.value)}</td>
                <td>
                  <button type="button" className="btn btn--sm" onClick={() => setAdjust(adjust === r.item.sku ? null : r.item.sku)} aria-expanded={adjust === r.item.sku}>
                    Adjust<span className="sr"> {r.item.sku}</span>
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty">No items match.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {adjust ? (
        <div className="panel">
          <h3>Stock movement — {adjust}</h3>
          <div className="two">
            <form onSubmit={(e: FormEvent) => submitAdjust(e, adjust)}>
              <h4>Adjustment</h4>
              <div className="row">
                <label className="field">
                  <span>Quantity (±)</span>
                  <input name="adjQty" inputMode="numeric" value={form.qty} onChange={(e: { target: { value: string } }) => setForm({ ...form, qty: e.target.value })} placeholder="-5" />
                </label>
                <label className="field">
                  <span>Warehouse</span>
                  <select name="adjWarehouse" value={form.warehouse} onChange={(e: { target: { value: string } }) => setForm({ ...form, warehouse: e.target.value as Warehouse })}>
                    <option>MAIN</option>
                    <option>WEST</option>
                  </select>
                </label>
                <label className="field">
                  <span>Reason</span>
                  <select name="adjReason" value={form.reason} onChange={(e: { target: { value: string } }) => setForm({ ...form, reason: e.target.value })}>
                    {ADJUSTMENT_REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn">Post adjustment</button>
              </div>
            </form>
            <form onSubmit={(e: FormEvent) => submitMove(e, adjust)}>
              <h4>Transfer</h4>
              <div className="row">
                <label className="field">
                  <span>Quantity</span>
                  <input name="trQty" inputMode="numeric" value={move.qty} onChange={(e: { target: { value: string } }) => setMove({ ...move, qty: e.target.value })} placeholder="10" />
                </label>
                <label className="field">
                  <span>From</span>
                  <select name="trFrom" value={move.from} onChange={(e: { target: { value: string } }) => setMove({ ...move, from: e.target.value as Warehouse })}>
                    <option>MAIN</option>
                    <option>WEST</option>
                  </select>
                </label>
                <label className="field">
                  <span>To</span>
                  <select name="trTo" value={move.to} onChange={(e: { target: { value: string } }) => setMove({ ...move, to: e.target.value as Warehouse })}>
                    <option>WEST</option>
                    <option>MAIN</option>
                  </select>
                </label>
                <button type="submit" className="btn btn--ghost">Post transfer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Orders({ orders, setOrders, suggestions, say }: { orders: PurchaseOrder[]; setOrders: (o: PurchaseOrder[]) => void; suggestions: ReturnType<typeof reorderSuggestions>; say: Say }) {
  const send = (po: PurchaseOrder) => {
    setOrders(orders.map((o) => (o.id === po.id ? { ...o, status: "sent" } : o)));
    say(`${po.id} marked as sent to ${SUPPLIERS.find((s) => s.id === po.supplierId)?.name}.`);
  };
  const cancel = (po: PurchaseOrder) => {
    setOrders(orders.map((o) => (o.id === po.id ? { ...o, status: "cancelled" } : o)));
    say(`${po.id} cancelled.`);
  };
  const raise = (supplierId: string, skus: string[]) => {
    const id = `PO-2026-${String(100 + orders.length).padStart(3, "0")}`;
    const po = createDraft(id, supplierId, "MAIN", ITEMS, skus, TODAY, TODAY);
    setOrders([po, ...orders]);
    say(`${id} drafted with ${po.lines.length} line(s).`);
  };

  const bySupplier = new Map<string, string[]>();
  for (const s of suggestions) bySupplier.set(s.supplierId, [...(bySupplier.get(s.supplierId) ?? []), s.sku]);

  return (
    <section aria-labelledby="po-title">
      <div className="head">
        <h2 id="po-title">Purchase orders</h2>
      </div>

      {suggestions.length > 0 ? (
        <div className="panel panel--warn">
          <h3>{suggestions.length} item(s) at or below reorder point</h3>
          <p className="muted">Stock already on order is counted, so nothing is ordered twice.</p>
          <ul className="suggest">
            {[...bySupplier].map(([supplierId, skus]) => (
              <li key={supplierId}>
                <div>
                  <strong>{SUPPLIERS.find((s) => s.id === supplierId)?.name}</strong>
                  <small>{skus.join(", ")}</small>
                </div>
                <button type="button" className="btn btn--sm" onClick={() => raise(supplierId, skus)}>
                  Raise draft PO
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">Nothing is below its reorder point.</p>
      )}

      <div className="cards">
        {orders.map((po) => {
          const supplier = SUPPLIERS.find((s) => s.id === po.supplierId);
          const overdue = (po.status === "sent" || po.status === "partial") && po.expectedAt < TODAY;
          return (
            <article key={po.id} className="card">
              <header>
                <div>
                  <h3 className="mono">{po.id}</h3>
                  <p className="muted">{supplier?.name} · {po.warehouse}</p>
                </div>
                <span className={`status status--${po.status}`}>{po.status}</span>
              </header>
              <dl className="mini">
                <div><dt>Value</dt><dd>{money(poValue(po))}</dd></div>
                <div><dt>Outstanding</dt><dd>{num(poOutstanding(po))} units</dd></div>
                <div><dt>Expected</dt><dd className={overdue ? "warn" : ""}>{po.expectedAt}{overdue ? " (overdue)" : ""}</dd></div>
              </dl>
              <table className="table table--inner">
                <caption className="sr">Lines on {po.id}</caption>
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col" className="num">Ordered</th>
                    <th scope="col" className="num">Received</th>
                    <th scope="col" className="num">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {po.lines.map((l) => (
                    <tr key={l.sku}>
                      <th scope="row" className="mono">{l.sku}</th>
                      <td className="num">{num(l.qtyOrdered)}</td>
                      <td className="num">{num(l.qtyReceived)}</td>
                      <td className="num">{money(l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {po.status === "draft" ? (
                <div className="row">
                  <button type="button" className="btn btn--sm" onClick={() => send(po)}>Send to supplier</button>
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => cancel(po)}>Cancel</button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Receiving({ orders, setOrders, movements, setMovements, say, fail }: { orders: PurchaseOrder[]; setOrders: (o: PurchaseOrder[]) => void; movements: Movement[]; setMovements: (m: Movement[]) => void; say: Say; fail: Say }) {
  const open = orders.filter((o) => o.status === "sent" || o.status === "partial");
  const [selected, setSelected] = useState(open[0]?.id ?? "");
  const po = orders.find((o) => o.id === selected) ?? open[0];
  const [qty, setQty] = useState<Record<string, string>>({});

  if (!po) return <p className="muted">No orders are awaiting receipt.</p>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const lines = po.lines.map((l) => ({ sku: l.sku, qty: Number(qty[l.sku] ?? 0) })).filter((l) => l.qty > 0);
    const r = receive(po, movements, lines, `${TODAY}T12:00:00Z`);
    if (!r.ok) return fail(r.error);
    setMovements(r.movements);
    setOrders(orders.map((o) => (o.id === r.po.id ? r.po : o)));
    setQty({});
    say(`Booked in ${r.received.reduce((s, l) => s + l.qty, 0)} units against ${po.id}. Status is now ${r.po.status}.`);
  };

  const receiveAll = () => setQty(Object.fromEntries(po.lines.map((l) => [l.sku, String(l.qtyOrdered - l.qtyReceived)])));

  return (
    <section aria-labelledby="rec-title">
      <div className="head">
        <h2 id="rec-title">Goods receipt</h2>
        <label className="field">
          <span>Order</span>
          <select value={po.id} onChange={(e: { target: { value: string } }) => { setSelected(e.target.value); setQty({}); }}>
            {open.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} — {SUPPLIERS.find((s) => s.id === o.supplierId)?.name} ({poOutstanding(o)} outstanding)
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="panel" onSubmit={submit}>
        <h3>Book in against {po.id}</h3>
        <p className="muted">Receiving posts one receipt movement per line. Over-receipt is refused.</p>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr">Lines to receive</caption>
            <thead>
              <tr>
                <th scope="col">SKU</th>
                <th scope="col" className="num">Ordered</th>
                <th scope="col" className="num">Already in</th>
                <th scope="col" className="num">Outstanding</th>
                <th scope="col" className="num">Receive now</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => {
                const remaining = l.qtyOrdered - l.qtyReceived;
                return (
                  <tr key={l.sku}>
                    <th scope="row" className="mono">{l.sku}</th>
                    <td className="num">{num(l.qtyOrdered)}</td>
                    <td className="num">{num(l.qtyReceived)}</td>
                    <td className="num strong">{num(remaining)}</td>
                    <td className="num">
                      <label>
                        <span className="sr">Quantity to receive for {l.sku}</span>
                        <input name={`rx-${l.sku}`} inputMode="numeric" className="qty" value={qty[l.sku] ?? ""} disabled={remaining === 0} onChange={(e: { target: { value: string } }) => setQty({ ...qty, [l.sku]: e.target.value })} />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row">
          <button type="submit" className="btn">Post receipt</button>
          <button type="button" className="btn btn--ghost" onClick={receiveAll}>Fill with outstanding</button>
        </div>
      </form>
    </section>
  );
}

function Suppliers({ orders }: { orders: PurchaseOrder[] }) {
  const rows = supplierReport(SUPPLIERS, ITEMS, orders, TODAY);
  return (
    <section aria-labelledby="sup-title">
      <div className="head">
        <h2 id="sup-title">Suppliers</h2>
      </div>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Suppliers and open exposure</caption>
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col">Country</th>
              <th scope="col">Terms</th>
              <th scope="col" className="num">SKUs</th>
              <th scope="col" className="num">Open POs</th>
              <th scope="col" className="num">Open value</th>
              <th scope="col" className="num">Overdue</th>
              <th scope="col">On-time record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.supplier.id}>
                <th scope="row">
                  {r.supplier.name}
                  <small>{r.supplier.contact}</small>
                </th>
                <td>{r.supplier.country}</td>
                <td>{r.supplier.terms} days</td>
                <td className="num">{r.skus}</td>
                <td className="num">{r.openOrders}</td>
                <td className="num">{money(r.openValue)}</td>
                <td className="num">{r.overdue > 0 ? <span className="warn">{r.overdue}</span> : "0"}</td>
                <td>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${Math.round(r.supplier.onTimeRate * 100)}%` }} className={r.supplier.onTimeRate < 0.85 ? "is-poor" : ""} />
                  </span>
                  <span className="meter__label">{Math.round(r.supplier.onTimeRate * 100)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">On-time record is seeded history for the demonstration, not calculated from the orders above.</p>
    </section>
  );
}

function Ledger({ movements }: { movements: Movement[] }) {
  const [sku, setSku] = useState("");
  const [type, setType] = useState("");
  const rows = useMemo(() => withRunningBalance(movements).reverse(), [movements]);
  const list = rows.filter((r) => (!sku || r.sku === sku) && (!type || r.type === type)).slice(0, 300);
  return (
    <section aria-labelledby="led-title">
      <div className="head">
        <h2 id="led-title">Stock ledger</h2>
        <div className="filters">
          <label className="field">
            <span>SKU</span>
            <select value={sku} onChange={(e: { target: { value: string } }) => setSku(e.target.value)}>
              <option value="">All</option>
              {ITEMS.map((i) => (
                <option key={i.sku}>{i.sku}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e: { target: { value: string } }) => setType(e.target.value)}>
              <option value="">All</option>
              {["receipt", "issue", "adjustment", "transfer_in", "transfer_out"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <p className="muted" role="status">
        Showing {list.length} of {rows.length} movements, newest first.
      </p>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Stock movements</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">SKU</th>
              <th scope="col">WH</th>
              <th scope="col">Type</th>
              <th scope="col" className="num">Qty</th>
              <th scope="col" className="num">Balance after</th>
              <th scope="col">Reference</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td className="mono">{day(m.at)}</td>
                <th scope="row" className="mono">{m.sku}</th>
                <td>{m.warehouse}</td>
                <td><span className={`mtype mtype--${m.type}`}>{m.type.replace("_", " ")}</span></td>
                <td className={`num strong ${m.qty < 0 ? "neg" : "pos"}`}>{m.qty > 0 ? "+" : ""}{num(m.qty)}</td>
                <td className="num">{num(m.balanceAfter)}</td>
                <td className="mono muted">{m.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reports({ rows, abc, value, summary }: { rows: ReturnType<typeof stockReport>; abc: Map<string, "A" | "B" | "C">; value: ReturnType<typeof valuation>; summary: ReturnType<typeof movementSummary> }) {
  const cats = [...value.byCategory].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...cats.map(([, v]) => v), 1);
  const counts = { A: 0, B: 0, C: 0 };
  for (const b of abc.values()) counts[b]++;
  const atRisk = rows.filter((r) => r.daysCover !== null && r.daysCover < 20);
  return (
    <section aria-labelledby="rep-title">
      <div className="head">
        <h2 id="rep-title">Reports</h2>
      </div>
      <div className="grid">
        <div className="panel">
          <h3>Inventory value by category</h3>
          <ul className="bars">
            {cats.map(([cat, v]) => (
              <li key={cat}>
                <span>{cat}</span>
                <span className="track"><span style={{ width: `${(v / max) * 100}%` }} /></span>
                <span className="mono">{compact(v)}</span>
              </li>
            ))}
          </ul>
          <p className="total">Total at standard cost: <strong>{money(value.total)}</strong></p>
        </div>

        <div className="panel">
          <h3>Movements, last 30 days</h3>
          <dl className="stats">
            <div><dt>Received</dt><dd className="pos">+{num(summary.receipts)}</dd></div>
            <div><dt>Issued to production</dt><dd className="neg">−{num(summary.issues)}</dd></div>
            <div><dt>Net adjustments</dt><dd>{summary.adjustments > 0 ? "+" : ""}{num(summary.adjustments)}</dd></div>
            <div><dt>Adjustment count</dt><dd>{summary.adjustmentCount}</dd></div>
          </dl>
          <p className="muted">A rising adjustment count usually means counting or handling problems, not a stock problem.</p>
        </div>

        <div className="panel">
          <h3>ABC classification</h3>
          <p className="muted">By annualised consumption value: A covers the top 80%, B the next 15%, C the rest.</p>
          <dl className="stats">
            <div><dt>A items</dt><dd>{counts.A}</dd></div>
            <div><dt>B items</dt><dd>{counts.B}</dd></div>
            <div><dt>C items</dt><dd>{counts.C}</dd></div>
          </dl>
        </div>

        <div className="panel">
          <h3>Under 20 days of cover</h3>
          {atRisk.length === 0 ? (
            <p className="muted">Nothing is running short at the current consumption rate.</p>
          ) : (
            <ul className="risk">
              {atRisk.map((r) => (
                <li key={r.item.sku}>
                  <span className="mono">{r.item.sku}</span>
                  <span>{r.item.name}</span>
                  <span className="warn mono">{r.daysCover}d</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
